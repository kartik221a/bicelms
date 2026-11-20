"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, NotebookPen, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/lms/confirm-dialog";

export interface EditorNote {
  id: string;
  title: string;
  content: string;
  timestampSeconds?: number | null;
  courseId?: string | null;
  lessonId?: string | null;
  updatedAt: string;
}

export interface CourseLinkInfo {
  title: string;
  slug: string;
}

/** Right-pane note editor for /my-notes. Saves via /api/v1/users/me/notes. */
export function NotesEditor({
  note,
  courses,
  backHref,
}: {
  note: EditorNote | null;
  courses: Record<string, CourseLinkInfo>;
  backHref: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const course = note?.courseId ? courses[note.courseId] : undefined;

  async function save() {
    if (!note) return;
    if (!title.trim()) {
      toast.error("Give your note a title before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/users/me/notes?noteId=${encodeURIComponent(note.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error?.message ?? "Could not save the note.");
        return;
      }
      toast.success("Note saved");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Network error — note not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!note) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/users/me/notes?noteId=${encodeURIComponent(note.id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error?.message ?? "Could not delete the note.");
        return;
      }
      toast.success("Note deleted");
      router.push(backHref);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Network error — note not deleted.");
    } finally {
      setDeleting(false);
    }
  }

  if (!note) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
          <NotebookPen className="h-6 w-6 text-slate-400" />
        </span>
        <h3 className="mt-4 font-semibold text-slate-900">Select a note</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Pick a note from the list to read or edit it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {course ? (
          <Badge variant="secondary" className="h-6 px-2 text-xs font-medium">
            {course.title}
          </Badge>
        ) : null}
        {note.lessonId && course ? (
          <Link
            href={`/learn/${course.slug}/${note.lessonId}`}
            className="inline-flex h-6 items-center gap-1 rounded-md bg-[#eef2ff] px-2 text-xs font-semibold text-[#4f46e5] transition-colors hover:bg-[#e0e7ff]"
          >
            <ExternalLink className="h-3 w-3" /> Open lesson
          </Link>
        ) : null}
        <span className="ml-auto text-xs text-slate-400">Last updated {new Date(note.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
        className="mb-3 h-10 border-slate-200 text-base font-semibold"
        aria-label="Note title"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Note content..."
        className="scrollbar-thin min-h-[240px] flex-1 resize-none border-slate-200 text-sm leading-relaxed"
        aria-label="Note content"
      />

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <ConfirmDialog
          title="Delete this note?"
          description="This note will be permanently removed from your account."
          onConfirm={remove}
          trigger={
            <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" disabled={deleting}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          }
        />
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save note
        </Button>
      </div>
    </div>
  );
}
