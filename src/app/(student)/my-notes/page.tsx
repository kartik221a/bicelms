import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Search, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { NotesEditor, type CourseLinkInfo, type EditorNote } from "@/components/lms/notes-editor";
import { getSession } from "@/services/auth/session";
import { store } from "@/repositories";
import { listNotes, type NoteDoc } from "@/services/note.service";
import { listUserEnrollments } from "@/services/progress.service";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Notes" };

export default async function MyNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; courseId?: string; note?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { q, courseId, note: noteParam } = await searchParams;

  const [notes, enrollments] = await Promise.all([
    listNotes(session.id, { q, courseId }),
    listUserEnrollments(session.id),
  ]);

  // courseId -> { title, slug } for badges and "Open lesson" links.
  const courseLinks = new Map<string, CourseLinkInfo>();
  for (const e of enrollments) {
    courseLinks.set(e.courseId, { title: e.course.title, slug: e.course.slug });
  }
  const extraCourseIds = [...new Set(notes.map((n) => n.courseId).filter((id): id is string => Boolean(id)))];
  await Promise.all(
    extraCourseIds.map(async (id) => {
      if (courseLinks.has(id)) return;
      const c = await store.get<{ id: string; title: string; slug: string }>("courses", id);
      if (c) courseLinks.set(id, { title: c.title, slug: c.slug });
    })
  );

  const selected = noteParam ? notes.find((n) => n.id === noteParam) ?? null : null;

  // Query string helpers that preserve the current filters.
  const withParams = (patch: { note?: string | null }) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (courseId) sp.set("courseId", courseId);
    if (patch.note) sp.set("note", patch.note);
    const s = sp.toString();
    return s ? `/my-notes?${s}` : "/my-notes";
  };
  const chipHref = (id?: string) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (id) sp.set("courseId", id);
    const s = sp.toString();
    return s ? `/my-notes?${s}` : "/my-notes";
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My notes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything you wrote while learning — searchable and linked back to its lesson.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Left: search, filters, note list */}
        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] lg:sticky lg:top-[5.25rem]">
          <CardContent className="space-y-4 p-4">
            <form action="/my-notes" method="get" className="flex gap-2">
              {courseId ? <input type="hidden" name="courseId" value={courseId} /> : null}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search notes..."
                  className="border-slate-200 pl-8"
                  aria-label="Search notes"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap gap-1.5">
              <Link
                href={chipHref()}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  !courseId
                    ? "border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                All courses
              </Link>
              {enrollments.map((e) => (
                <Link
                  key={e.courseId}
                  href={chipHref(e.courseId)}
                  className={cn(
                    "max-w-[180px] truncate rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    courseId === e.courseId
                      ? "border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5]"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {e.course.title}
                </Link>
              ))}
            </div>

            <div className="scrollbar-thin max-h-[520px] space-y-2 overflow-y-auto">
              {notes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-10 text-center">
                  <StickyNote className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {q || courseId ? "No notes match your filters" : "No notes yet"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {q || courseId
                      ? "Try a different search term or course filter."
                      : "Take notes from any lesson while watching the video."}
                  </p>
                </div>
              ) : (
                notes.map((n) => (
                  <NoteListItem
                    key={n.id}
                    note={n}
                    href={withParams({ note: n.id })}
                    active={selected?.id === n.id}
                    courseTitle={n.courseId ? courseLinks.get(n.courseId)?.title : undefined}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: editor */}
        <NotesEditor
          note={selected ? serialize(selected) : null}
          courses={Object.fromEntries(courseLinks)}
          backHref={withParams({ note: null })}
        />
      </div>
    </div>
  );
}

function serialize(n: NoteDoc): EditorNote {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    timestampSeconds: n.timestampSeconds ?? null,
    courseId: n.courseId ?? null,
    lessonId: n.lessonId ?? null,
    updatedAt: n.updatedAt,
  };
}

function NoteListItem({
  note,
  href,
  active,
  courseTitle,
}: {
  note: NoteDoc;
  href: string;
  active: boolean;
  courseTitle?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg border p-3 transition-colors",
        active
          ? "border-[#c7d2fe] bg-[#eef2ff]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
      aria-current={active ? "true" : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-slate-900">{note.title || "Untitled note"}</p>
        <span className="shrink-0 text-[11px] text-slate-400">
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
        {note.content || "No content"}
      </p>
      {courseTitle ? (
        <Badge variant="secondary" className="mt-2 max-w-full truncate text-[10px] font-medium">
          {courseTitle}
        </Badge>
      ) : null}
    </Link>
  );
}
