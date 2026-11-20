import { store, WhereInput } from "@/repositories";
import { errors } from "@/lib/api";
import { EnrollmentDoc, formatEnrollment, computeProgressPercent } from "./enrollment.types";
import { LessonDoc } from "./course.service";

/**
 * Learning progress tracking (master prompt §6).
 * Lesson completion rules: auto_90 (>=90% watched) or manual mark-complete.
 * Course progress percent derives from completed lessons / published lessons.
 */

export interface ProgressDoc {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  status: string;
  positionSeconds: number;
  watchPercent: number;
  completedAt?: string | null;
  updatedAt: string;
}

export async function upsertProgress(input: {
  userId: string;
  lessonId: string;
  positionSeconds: number;
  watchPercent: number;
  completed?: boolean;
}) {
  const lesson = await store.get<LessonDoc>("lessons", input.lessonId);
  if (!lesson) throw errors.notFound("Lesson not found");

  const enrollment = await getActiveEnrollment(input.userId, lesson.courseId);
  if (!enrollment && lesson.isFreePreview) {
    // Free preview lessons can be sampled without enrollment; no tracking.
    throw errors.forbidden("Enroll in this course to track progress.");
  }
  if (!enrollment) throw errors.forbidden("You are not enrolled in this course.");

  const existing = await store.list<ProgressDoc>("lessonProgress", {
    where: [
      ["userId", "==", input.userId],
      ["lessonId", "==", input.lessonId],
    ],
    limit: 1,
  });

  const ruleCompleted =
    input.completed ||
    (lesson.completionRule === "auto_90" && input.watchPercent >= 90);

  const now = new Date().toISOString();
  if (existing.length) {
    const current = existing[0];
    const completed = current.status === "completed" || ruleCompleted;
    const updated = await store.update<ProgressDoc>("lessonProgress", current.id, {
      positionSeconds: Math.max(current.positionSeconds, input.positionSeconds),
      watchPercent: Math.max(current.watchPercent, input.watchPercent),
      status: completed ? "completed" : "started",
      completedAt: completed && !current.completedAt ? now : current.completedAt,
    });
    await recomputeCourseProgress(input.userId, lesson.courseId);
    return updated!;
  }

  const created = await store.create<ProgressDoc>("lessonProgress", {
    userId: input.userId,
    lessonId: input.lessonId,
    courseId: lesson.courseId,
    status: ruleCompleted ? "completed" : "started",
    positionSeconds: input.positionSeconds,
    watchPercent: input.watchPercent,
    completedAt: ruleCompleted ? now : null,
  });
  await recomputeCourseProgress(input.userId, lesson.courseId);
  return created;
}

export async function markLessonCompleted(userId: string, lessonId: string) {
  return upsertProgress({
    userId,
    lessonId,
    positionSeconds: 0,
    watchPercent: 100,
    completed: true,
  });
}

export async function getUserCourseProgress(userId: string, courseId: string) {
  const [progress, lessons] = await Promise.all([
    store.list<ProgressDoc>("lessonProgress", { where: [["userId", "==", userId], ["courseId", "==", courseId]] }),
    store.list<LessonDoc>("lessons", { where: [["courseId", "==", courseId]] }),
  ]);
  const published = lessons.filter((l) => l.status === "published");
  const completedIds = new Set(progress.filter((p) => p.status === "completed").map((p) => p.lessonId));
  return {
    completedLessonIds: [...completedIds],
    completedLessons: completedIds.size,
    totalLessons: published.length,
    percent: computeProgressPercent(completedIds.size, published.length),
    resumeLessonId: findResumeLesson(progress, published),
  };
}

function findResumeLesson(progress: ProgressDoc[], lessons: LessonDoc[]): string | null {
  const sorted = [...lessons].sort((a, b) => a.position - b.position);
  const completed = new Set(progress.filter((p) => p.status === "completed").map((p) => p.lessonId));
  // First incomplete lesson with position >= last accessed
  return sorted.find((l) => !completed.has(l.id))?.id ?? null;
}

export async function recomputeCourseProgress(userId: string, courseId: string) {
  const enrollment = await getActiveEnrollment(userId, courseId);
  if (!enrollment) return;
  const [progress, lessons] = await Promise.all([
    store.list<ProgressDoc>("lessonProgress", { where: [["userId", "==", userId], ["courseId", "==", courseId]] }),
    store.list<LessonDoc>("lessons", { where: [["courseId", "==", courseId]] }),
  ]);
  const published = lessons.filter((l) => l.status === "published");
  const completed = progress.filter((p) => p.status === "completed").length;
  const percent = computeProgressPercent(completed, published.length);

  const patch: Record<string, unknown> = {
    progressPercent: percent,
    lastAccessedAt: new Date().toISOString(),
  };
  if (published.length && completed >= published.length) {
    patch.completedAt = new Date().toISOString();
    patch.status = "active";
  }
  await store.update("enrollments", enrollment.id, patch);
}

export async function getActiveEnrollment(userId: string, courseId: string): Promise<EnrollmentDoc | null> {
  const enrollment = await store.getByField<EnrollmentDoc>("enrollments", "userId", userId);
  if (!enrollment || enrollment.courseId !== courseId || enrollment.status !== "active") {
    // getByField returns first match on userId; fall back to explicit query
    const list = await store.list<EnrollmentDoc>("enrollments", {
      where: [
        ["userId", "==", userId],
        ["courseId", "==", courseId],
      ],
      limit: 1,
    });
    const e = list[0];
    return e && e.status === "active" ? formatEnrollment(e) : null;
  }
  return formatEnrollment(enrollment);
}

export async function requireEnrollment(userId: string, courseId: string): Promise<EnrollmentDoc> {
  const enrollment = await getActiveEnrollment(userId, courseId);
  if (!enrollment) throw errors.forbidden("You are not enrolled in this course.");
  return enrollment;
}

export async function listUserEnrollments(userId: string, filter?: "all" | "in_progress" | "completed") {
  const where: WhereInput[] = [["userId", "==", userId]];
  const enrollments = await store.list<EnrollmentDoc>("enrollments", {
    where,
    orderBy: [{ field: "lastAccessedAt", direction: "desc" }],
  });
  const active = enrollments.filter((e) => e.status === "active");
  const withProgress = await Promise.all(
    active.map(async (e) => {
      const course = await store.get<CourseDoc0>("courses", e.courseId);
      return course ? { ...formatEnrollment(e), course } : null;
    })
  );
  const items = withProgress.filter(Boolean) as (EnrollmentDoc & { course: CourseDoc0 })[];
  if (filter === "completed") return items.filter((e) => e.completedAt);
  if (filter === "in_progress") return items.filter((e) => !e.completedAt);
  return items;
}

type CourseDoc0 = import("./course.service").CourseDoc;
