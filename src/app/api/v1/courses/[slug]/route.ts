import { handler, jsonOk, errors } from "@/lib/api";
import { getCourseBySlug, getCurriculum } from "@/services/course.service";
import { listCourseReviews } from "@/services/review.service";

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const course = await getCourseBySlug(slug);
  if (course.status !== "published") throw errors.notFound("Course not found");
  const curriculum = await getCurriculum(course.id, true);
  const reviews = await listCourseReviews(course.id, true);
  return jsonOk({ course, curriculum, reviews });
});
