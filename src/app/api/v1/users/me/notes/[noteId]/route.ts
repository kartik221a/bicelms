import { handler, parseJson, jsonOk } from "@/lib/api";
import { noteSchema } from "@/validators";
import { requireUser } from "@/services/auth/session";
import { createNote, updateNote, deleteNote } from "@/services/note.service";

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
  const input = await parseJson(req, noteSchema.partial());
  const note = await updateNote(user.id, noteId, input);
  return jsonOk({ note });
});

export const DELETE = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const noteId = url.searchParams.get("noteId") ?? "";
  await deleteNote(user.id, noteId);
  return jsonOk({ deleted: true });
});
