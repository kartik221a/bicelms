import { store } from "@/repositories";
import { errors } from "@/lib/api";
import { signToken, verifyToken } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { getVideoProvider } from "@/providers/video";
import { getActiveEnrollment } from "./progress.service";
import { getSettings } from "./settings.service";
import { maskEmail } from "@/lib/money";
import { PlaybackAuthorization } from "@/types";
import { LessonDoc } from "./course.service";

/**
 * Layered video protection (master prompt §7):
 *  1. authenticated playback (session required)
 *  2. server-side enrollment verification
 *  3. short-lived signed playback tokens (HMAC, configurable TTL)
 *  4. rate limiting on the authorization endpoint
 *  5. session/device tracking with configurable concurrent-session limits
 *  6. dynamic student watermark data (name / masked email / student id)
 * The video URL is never exposed in public API responses or page payloads —
 * the player receives it only through this authorized, expiring exchange.
 */

const PLAYBACK_RATE_LIMIT = { limit: 30, windowMs: 60_000 };

export async function authorizePlayback(input: {
  userId: string;
  user: { name: string; email: string };
  lessonId: string;
  deviceId?: string;
  ip?: string;
  userAgent?: string;
}): Promise<PlaybackAuthorization> {
  const lesson = await store.get<LessonDoc>("lessons", input.lessonId);
  if (!lesson || lesson.status !== "published") throw errors.notFound("Lesson not found");

  const settings = await getSettings();
  const ttl = (settings.playbackTokenTtlMin || 30) * 60;

  const enrollment = await getActiveEnrollment(input.userId, lesson.courseId);
  if (!enrollment && !lesson.isFreePreview) {
    throw errors.forbidden("Enroll in this course to watch this lesson.");
  }

  const limited = rateLimit(`playback:${input.userId}:${input.ip ?? "unknown"}`, PLAYBACK_RATE_LIMIT.limit, PLAYBACK_RATE_LIMIT.windowMs);
  if (!limited.ok) throw errors.rateLimited(limited.retryAfter);

  // Concurrent session tracking (deterrent layer; configurable limit)
  const activeSessions = await store.list<{ id: string; lastSeenAt: string; revoked: boolean }>("videoSessions", {
    where: [["userId", "==", input.userId]],
    orderBy: [{ field: "lastSeenAt", direction: "desc" }],
  });
  const live = activeSessions.filter(
    (s) => !s.revoked && Date.now() - new Date(s.lastSeenAt).getTime() < 15 * 60_000
  );
  const deviceId = input.deviceId ?? "unknown";
  if (!live.some((s) => s.id) || live.length >= (settings.videoSessionLimit ?? 2)) {
    const mine = await store.create("videoSessions", {
      userId: input.userId,
      lessonId: input.lessonId,
      deviceId,
      ip: input.ip ?? null,
      userAgent: (input.userAgent ?? "").slice(0, 200),
    });
    // revoke oldest beyond the limit
    const excess = live.slice((settings.videoSessionLimit ?? 2) - 1);
    for (const s of excess) await store.update("videoSessions", s.id, { revoked: true });
    void mine;
  }

  const provider = getVideoProvider();
  const target = await provider.resolve(lesson.videoStorageId ?? "", ttl);
  if (!target) throw errors.notFound("Video for this lesson is not available yet.");

  const token = signToken({ uid: input.userId, lessonId: input.lessonId }, ttl);
  await store.update("enrollments", enrollment?.id ?? "n/a", {
    lastAccessedAt: new Date().toISOString(),
    lastLessonId: input.lessonId,
  }).catch(() => {});

  return {
    lessonId: input.lessonId,
    src: target.src,
    token,
    kind: target.kind,
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    watermark: {
      name: input.user.name,
      maskedEmail: maskEmail(input.user.email),
      studentId: input.userId.slice(-8).toUpperCase(),
      opacity: settings.watermarkOpacity ?? 0.12,
    },
  };
}

export function verifyPlaybackToken(token: string, lessonId: string): { uid: string } | null {
  const payload = verifyToken<{ uid: string; lessonId: string }>(token);
  if (!payload) return null;
  if (payload.lessonId !== lessonId) return null;
  return { uid: payload.uid };
}
