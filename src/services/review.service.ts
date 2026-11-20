import { store } from "@/repositories";
import { ReviewStatus } from "@/types";
import { CourseDoc } from "./course.service";
import { errors } from "@/lib/api";

export interface ReviewDoc {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment: string;
  status: string;
  adminReply?: string | null;
  createdAt: string;
}

export async function submitReview(input: {
  userId: string;
  courseId: string;
  rating: number;
  title?: string;
  comment: string;
}) {
  const enrolled = await store.count("enrollments", [
    { field: "userId", op: "==", value: input.userId },
    { field: "courseId", op: "==", value: input.courseId },
    { field: "status", op: "==", value: "active" },
  ]);
  if (!enrolled) throw errors.forbidden("Only enrolled students can review this course.");
  const existing = await store.list<ReviewDoc>("reviews", {
    where: [
      ["courseId", "==", input.courseId],
      ["userId", "==", input.userId],
    ],
    limit: 1,
  });
  if (existing.length) {
    const updated = await store.update<ReviewDoc>("reviews", existing[0].id, {
      rating: input.rating,
      title: input.title ?? null,
      comment: input.comment,
      status: "pending",
    });
    await recomputeCourseRating(input.courseId);
    return updated!;
  }
  const review = await store.create<ReviewDoc>("reviews", {
    courseId: input.courseId,
    userId: input.userId,
    rating: input.rating,
    title: input.title ?? null,
    comment: input.comment,
    status: "pending",
  });
  return review;
}

export async function listCourseReviews(courseId: string, onlyApproved = true) {
  const reviews = await store.list<ReviewDoc>("reviews", {
    where: [["courseId", "==", courseId]],
    orderBy: [{ field: "createdAt", direction: "desc" }],
    limit: 200,
  });
  const visible = onlyApproved ? reviews.filter((r) => r.status === "approved") : reviews;
  return Promise.all(
    visible.map(async (r) => ({
      ...r,
      user: await store.get<{ name: string; photoUrl?: string | null }>("users", r.userId),
    }))
  );
}

export async function moderateReview(reviewId: string, status: ReviewStatus, adminReply?: string) {
  const review = await store.update<ReviewDoc>("reviews", reviewId, {
    status,
    ...(adminReply !== undefined ? { adminReply } : {}),
  });
  if (review) await recomputeCourseRating(review.courseId);
  return review;
}

export async function recomputeCourseRating(courseId: string) {
  const course = await store.get<CourseDoc>("courses", courseId);
  if (!course) throw errors.notFound("Course not found");
  const reviews = await store.list<ReviewDoc>("reviews", { where: [["courseId", "==", courseId]] });
  const approved = reviews.filter((r) => r.status === "approved");
  const avg = approved.length ? approved.reduce((a, r) => a + r.rating, 0) / approved.length : 0;
  await store.update("courses", courseId, {
    ratingAvg: Math.round(avg * 10) / 10,
    ratingCount: approved.length,
  });
}
