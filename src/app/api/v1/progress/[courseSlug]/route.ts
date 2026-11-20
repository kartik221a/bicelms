import { handler, jsonOk } from "@/lib/api";
import { requireUser } from "@/services/auth/session";
import { getUserCourseProgress } from "@/services/progress.service";
import { getCourseBySlug } from "@/services/course.service";

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ courseSlug: string }> }) => {
  const user = await requireUser();
  const { courseSlug } = await ctx.params;
  const course = await getCourseBySlug(courseSlug);
  const progress = await getUserCourseProgress(user.id, course.id);
  return jsonOk({ progress });
});
