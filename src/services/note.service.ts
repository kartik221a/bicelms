import { store } from "@/repositories";
import { errors } from "@/lib/api";
import { NoteInput } from "@/validators";

export interface NoteDoc {
  id: string;
  userId: string;
  courseId?: string | null;
  lessonId?: string | null;
  title: string;
  content: string;
  timestampSeconds?: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function listNotes(userId: string, opts?: { courseId?: string; q?: string }) {
  const notes = await store.list<NoteDoc>("notes", {
    where: [["userId", "==", userId]],
    orderBy: [{ field: "updatedAt", direction: "desc" }],
    limit: 300,
  });
  let items = notes;
  if (opts?.courseId) items = items.filter((n) => n.courseId === opts.courseId);
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    items = items.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }
  return items;
}

export async function createNote(userId: string, input: NoteInput) {
  return store.create<NoteDoc>("notes", {
    userId,
    courseId: input.courseId ?? null,
    lessonId: input.lessonId ?? null,
    title: input.title,
    content: input.content,
    timestampSeconds: input.timestampSeconds ?? null,
  });
}

export async function updateNote(userId: string, noteId: string, input: Partial<NoteInput>) {
  const note = await store.get<NoteDoc>("notes", noteId);
  if (!note) throw errors.notFound("Note not found");
  if (note.userId !== userId) throw errors.forbidden(); // IDOR guard
  return store.update<NoteDoc>("notes", noteId, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.content !== undefined ? { content: input.content } : {}),
    ...(input.courseId !== undefined ? { courseId: input.courseId } : {}),
    ...(input.lessonId !== undefined ? { lessonId: input.lessonId } : {}),
    ...(input.timestampSeconds !== undefined ? { timestampSeconds: input.timestampSeconds } : {}),
  });
}

export async function deleteNote(userId: string, noteId: string) {
  const note = await store.get<NoteDoc>("notes", noteId);
  if (!note) throw errors.notFound("Note not found");
  if (note.userId !== userId) throw errors.forbidden(); // IDOR guard
  await store.delete("notes", noteId);
  return true;
}
