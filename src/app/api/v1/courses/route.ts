import { handler, jsonOk } from "@/lib/api";
import { courseQuerySchema } from "@/validators";
import { listPublishedCourses } from "@/services/course.service";

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const query = courseQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
  const result = await listPublishedCourses(query);
  return jsonOk(result);
});
