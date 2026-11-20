import { handler, jsonOk } from "@/lib/api";
import { requireUser } from "@/services/auth/session";
import { listNotes } from "@/services/note.service";

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const items = await listNotes(user.id, {
    courseId: url.searchParams.get("courseId") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  return jsonOk({ notes: items });
});
