import { store } from "@/repositories";
import { errors } from "@/lib/api";
import { LessonDoc } from "./course.service";
import { ProgressDoc } from "./progress.service";

/**
 * Course resources (master prompt §8). Students only ever see resources of
 * courses they are enrolled in; lesson-gated resources unlock only after the
 * gating lesson is completed; view-only resources never expose a file URL.
 */

export interface ResourceDoc {
  id: string;
  courseId: string;
  lessonId?: string | null;
  title: string;
  type: string;
  storageId?: string | null;
  externalUrl?: string | null;
  downloadable: boolean;
  availableAfterLessonId?: string | null;
  sizeBytes?: number | null;
  mime?: string | null;
  createdAt: string;
}

export interface StudentResourceView {
  id: string;
  title: string;
  type: string;
  downloadable: boolean;
  locked: boolean;
  downloadUrl: string | null; // null for view-only resources
  externalUrl: string | null;
  sizeBytes?: number | null;
  mime?: string | null;
  lessonId?: string | null;
}

export async function listStudentResources(
  userId: string,
  courseId: string,
  completedLessonIds: string[]
): Promise<StudentResourceView[]> {
  const resources = await store.list<ResourceDoc>("resources", {
    where: [["courseId", "==", courseId]],
    orderBy: [{ field: "createdAt", direction: "asc" }],
  });
  const completed = new Set(completedLessonIds);
  return resources.map((r) => {
    const locked = Boolean(r.availableAfterLessonId) && !completed.has(r.availableAfterLessonId!);
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      downloadable: r.downloadable && !locked,
      locked,
      downloadUrl: r.downloadable && !locked ? `/api/v1/resources/${r.id}/download` : null,
      externalUrl: r.type === "external" ? r.externalUrl ?? null : null,
      sizeBytes: r.sizeBytes ?? null,
      mime: r.mime ?? null,
      lessonId: r.lessonId ?? null,
    };
  });
}

export async function assertResourceAccess(userId: string, resourceId: string) {
  const resource = await store.get<ResourceDoc>("resources", resourceId);
  if (!resource) throw errors.notFound("Resource not found");
  const enrollment = await store.list("enrollments", {
    where: [
      ["userId", "==", userId],
      ["courseId", "==", resource.courseId],
      ["status", "==", "active"],
    ],
    limit: 1,
  });
  if (!enrollment.length) throw errors.forbidden("You are not enrolled in this course.");
  if (resource.availableAfterLessonId) {
    const done = await store.list<ProgressDoc>("lessonProgress", {
      where: [
        ["userId", "==", userId],
        ["lessonId", "==", resource.availableAfterLessonId],
        ["status", "==", "completed"],
      ],
      limit: 1,
    });
    if (!done.length) throw errors.forbidden("This resource unlocks after completing the previous lesson.");
  }
  return resource;
}

export interface LessonView extends LessonDoc {
  completed?: boolean;
  watchPercent?: number;
  locked?: boolean;
}
