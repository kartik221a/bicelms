import { handler, parseJson, jsonOk } from "@/lib/api";
import { noteSchema } from "@/validators";
import { requireUser } from "@/services/auth/session";
import { listNotes, createNote, updateNote, deleteNote } from "@/services/note.service";
import { errors } from "@/lib/api";

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const items = await listNotes(user.id, {
    courseId: url.searchParams.get("courseId") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  return jsonOk({ notes: items });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const input = await parseJson(req, noteSchema);
  const note = await createNote(user.id, input);
  return jsonOk({ note }, { status: 201 });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const noteId = url.searchParams.get("noteId") ?? "";
  if (!noteId) throw errors.badRequest("noteId query parameter is required");
  const input = await parseJson(req, noteSchema.partial());
  const note = await updateNote(user.id, noteId, input);
  return jsonOk({ note });
});

export const DELETE = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const noteId = url.searchParams.get("noteId") ?? "";
  if (!noteId) throw errors.badRequest("noteId query parameter is required");
  await deleteNote(user.id, noteId);
  return jsonOk({ deleted: true });
});
