import { handler, parseJson, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/services/auth/session";
import { authorizePlayback } from "@/services/playback.service";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { errors } from "@/lib/api";

const bodySchema = z.object({
  lessonId: z.string().min(1),
  deviceId: z.string().max(100).optional(),
});

/**
 * The ONLY way the player obtains a video source. Requires an authenticated
 * session + verified enrollment (or a free-preview lesson), returns a
 * short-lived signed source + watermark payload. Never exposes storage IDs.
 */
export const POST = handler(async (req: Request) => {
  const limited = rateLimit(`playback-authorize:${clientIp(req)}`, 30, 60_000);
  if (!limited.ok) throw errors.rateLimited(limited.retryAfter);
  const user = await requireUser();
  const body = await parseJson(req, bodySchema);
  const result = await authorizePlayback({
    userId: user.id,
    user: { name: user.name, email: user.email },
    lessonId: body.lessonId,
    deviceId: body.deviceId,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  return jsonOk(result);
});
