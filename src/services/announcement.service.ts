import { store } from "@/repositories";
import { errors } from "@/lib/api";

export interface AnnouncementDoc {
  id: string;
  title: string;
  body: string;
  courseId?: string | null;
  audience: string;
  pinned: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

export async function listAnnouncementsForUser(userId: string, enrolledCourseIds: string[]) {
  const all = await store.list<AnnouncementDoc>("announcements", {
    orderBy: [{ field: "createdAt", direction: "desc" }],
    limit: 100,
  });
  const now = Date.now();
  return all
    .filter((a) => a.publishedAt && new Date(a.publishedAt).getTime() <= now)
    .filter(
      (a) =>
        (a.audience === "all" || a.audience === "students") ||
        (a.audience === "course" && a.courseId && enrolledCourseIds.includes(a.courseId))
    )
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

export async function listAllAnnouncements() {
  return store.list<AnnouncementDoc>("announcements", {
    orderBy: [{ field: "createdAt", direction: "desc" }],
    limit: 200,
  });
}

export async function publishAnnouncement(input: {
  title: string;
  body: string;
  courseId?: string | null;
  audience: string;
  pinned?: boolean;
}) {
  if (!["all", "students", "course"].includes(input.audience)) {
    throw errors.badRequest("Invalid audience");
  }
  return store.create<AnnouncementDoc>("announcements", {
    ...input,
    pinned: input.pinned ?? false,
    publishedAt: new Date().toISOString(),
  });
}
