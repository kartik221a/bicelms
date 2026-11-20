import { handler, jsonOk } from "@/lib/api";
import { requireUser } from "@/services/auth/session";
import { listUserEnrollments } from "@/services/progress.service";

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const filterParam = url.searchParams.get("filter");
  const filter = filterParam === "in_progress" || filterParam === "completed" ? filterParam : "all";
  const items = await listUserEnrollments(user.id, filter);
  return jsonOk({ items });
});
