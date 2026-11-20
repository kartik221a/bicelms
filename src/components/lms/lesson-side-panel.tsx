"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download, ExternalLink, File, FileSpreadsheet, FileText, Link2, Loader2,
  Lock, MessageCircle, NotebookPen, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/lms/confirm-dialog";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/money";

export interface SidePanelNote {
  id: string;
  title: string;
  content: string;
  timestampSeconds?: number | null;
  updatedAt: string;
}

export interface SidePanelResource {
  id: string;
  title: string;
  type: string;
  downloadable: boolean;
  locked: boolean;
  downloadUrl: string | null;
  externalUrl: string | null;
  sizeBytes?: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  cheatsheet: "Cheat sheet",
  practice_file: "Practice file",
  template: "Template",
  assignment: "Assignment",
  external: "External link",
  other: "File",
};

function formatSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseTimestamp(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const mmss = /^(\d{1,2}):(\d{1,2})$/.exec(t);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/**
 * Right-hand panel of the learning interface: per-lesson notes with
 * blur/debounced auto-save, course resources with honest lock states, and a
 * Q&A placeholder until the live cohort ships.
 */
export function LessonSidePanel({
  lessonId,
  courseId,
  notes,
  resources,
  enrolled,
}: {
  lessonId: string;
  courseId: string;
  notes: SidePanelNote[];
  resources: SidePanelResource[];
  enrolled: boolean;
}) {
  return (
    <Tabs defaultValue="notes" className="flex h-full flex-col gap-0">
      <TabsList className="h-auto w-full justify-start gap-4 rounded-none border-b border-slate-200 bg-transparent p-0 px-4">
        <TabsTrigger
          value="notes"
          className="relative h-auto rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 py-3 text-[13px] font-semibold text-slate-500 shadow-none data-[state=active]:border-[#4f46e5] data-[state=active]:bg-transparent data-[state=active]:text-[#4f46e5] data-[state=active]:shadow-none"
        >
          <NotebookPen className="h-4 w-4" /> Notes
          {notes.length ? (
            <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">{notes.length}</span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger
          value="resources"
          className="h-auto rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 py-3 text-[13px] font-semibold text-slate-500 shadow-none data-[state=active]:border-[#4f46e5] data-[state=active]:bg-transparent data-[state=active]:text-[#4f46e5] data-[state=active]:shadow-none"
        >
          <FileText className="h-4 w-4" /> Resources
          {resources.length ? (
            <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">{resources.length}</span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger
          value="qa"
          className="h-auto rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 py-3 text-[13px] font-semibold text-slate-500 shadow-none data-[state=active]:border-[#4f46e5] data-[state=active]:bg-transparent data-[state=active]:text-[#4f46e5] data-[state=active]:shadow-none"
        >
          <MessageCircle className="h-4 w-4" /> Q&amp;A
        </TabsTrigger>
      </TabsList>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <TabsContent value="notes" className="m-0 space-y-4 p-4">
          <NotesTab lessonId={lessonId} courseId={courseId} notes={notes} />
        </TabsContent>
        <TabsContent value="resources" className="m-0 space-y-2 p-4">
          {resources.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No resources for this course yet.</p>
          ) : (
            resources.map((r) => <ResourceRow key={r.id} resource={r} enrolled={enrolled} />)
          )}
        </TabsContent>
        <TabsContent value="qa" className="m-0 p-4">
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200">
              <MessageCircle className="h-5 w-5 text-slate-400" />
            </span>
            <h4 className="mt-3 text-sm font-semibold text-slate-900">Q&amp;A coming with the live cohort</h4>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              Lesson discussions open when your cohort starts. Until then, use notes to capture questions for the instructor.
            </p>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}

function NotesTab({
  lessonId,
  courseId,
  notes,
}: {
  lessonId: string;
  courseId: string;
  notes: SidePanelNote[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tsRaw, setTsRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const loadNote = (n: SidePanelNote) => {
    setActiveId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setTsRaw(n.timestampSeconds != null ? formatDuration(n.timestampSeconds) : "");
    dirtyRef.current = false;
  };

  const resetEditor = () => {
    setActiveId(null);
    setTitle("");
    setContent("");
    setTsRaw("");
    dirtyRef.current = false;
  };

  const save = useCallback(async () => {
    if (!dirtyRef.current) return;
    const t = title.trim();
    if (!t && !content.trim()) return; // nothing worth saving yet
    dirtyRef.current = false;
    setSaving(true);
    try {
      const ts = parseTimestamp(tsRaw);
      const body = {
        title: t || "Untitled note",
        content,
        courseId,
        lessonId,
        timestampSeconds: ts,
      };
      const id = activeIdRef.current;
      const res = await fetch(id ? `/api/v1/users/me/notes?noteId=${encodeURIComponent(id)}` : "/api/v1/users/me/notes", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        dirtyRef.current = true;
        toast.error(json.error?.message ?? "Could not save the note.");
        return;
      }
      const createdId: string | undefined = json.data?.note?.id;
      if (!id && createdId) {
        activeIdRef.current = createdId;
        setActiveId(createdId);
      }
      toast.success("Note saved");
      startTransition(() => router.refresh());
    } catch {
      dirtyRef.current = true;
      toast.error("Network error — note not saved.");
    } finally {
      setSaving(false);
    }
  }, [title, content, tsRaw, courseId, lessonId, router]);

  // Debounced auto-save while typing (1.5s after the last keystroke).
  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(() => void save(), 1500);
    return () => clearTimeout(t);
  }, [title, content, tsRaw, save]);

  async function deleteNote(id: string) {
    try {
      const res = await fetch(`/api/v1/users/me/notes?noteId=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error?.message ?? "Could not delete the note.");
        return;
      }
      toast.success("Note deleted");
      if (activeIdRef.current === id) resetEditor();
      startTransition(() => router.refresh());
    } catch {
      toast.error("Network error — note not deleted.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-slate-900">
          {activeId ? "Edit note" : "New note"}
        </h4>
        <div className="flex items-center gap-2">
          {activeId ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={resetEditor}>
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
          ) : null}
          <span className="text-xs text-slate-400">{saving ? "Saving..." : "Auto-saved on pause"}</span>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm focus-within:shadow-[0_0_0_2px_#4f46e5]">
        <Input
          value={title}
          onChange={(e) => {
            dirtyRef.current = true;
            setTitle(e.target.value);
          }}
          onBlur={() => void save()}
          placeholder="Note title"
          className="h-8 border-0 bg-white text-sm font-medium shadow-none focus-visible:ring-0"
          aria-label="Note title"
        />
        <Textarea
          value={content}
          onChange={(e) => {
            dirtyRef.current = true;
            setContent(e.target.value);
          }}
          onBlur={() => void save()}
          placeholder="Write your notes for this lesson... (auto-saved)"
          rows={4}
          className="resize-none border-0 bg-white text-sm shadow-none focus-visible:ring-0"
          aria-label="Note content"
        />
        <div className="flex items-center gap-2 pt-1">
          <Input
            value={tsRaw}
            onChange={(e) => {
              dirtyRef.current = true;
              setTsRaw(e.target.value);
            }}
            onBlur={() => void save()}
            placeholder="Timestamp (e.g. 1:25)"
            className="h-8 w-40 border-slate-200 bg-white text-xs"
            aria-label="Timestamp in the video"
          />
          <Button size="sm" className="ml-auto h-8" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save note
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[13px] font-semibold text-slate-900">
            Lesson notes {notes.length ? `(${notes.length})` : ""}
          </h4>
        </div>
        {notes.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
            No notes for this lesson yet. Capture your first thought above.
          </p>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group rounded-lg border p-3 transition-colors",
                  activeId === n.id ? "border-[#c7d2fe] bg-[#eef2ff]/60" : "border-slate-200 bg-slate-50/70 hover:bg-slate-50"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  {n.timestampSeconds != null ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[#eef2ff] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#4f46e5]">
                      {formatDuration(n.timestampSeconds)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">General</span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => loadNote(n)}>
                      Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete this note?"
                      description="This note will be permanently removed."
                      onConfirm={() => deleteNote(n.id)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                          aria-label={`Delete note ${n.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </div>
                {n.title ? <p className="truncate text-[13px] font-semibold text-slate-900">{n.title}</p> : null}
                {n.content ? (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{n.content}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceRow({ resource, enrolled }: { resource: SidePanelResource; enrolled: boolean }) {
  const typeLabel = TYPE_LABELS[resource.type] ?? TYPE_LABELS.other;
  const size = formatSize(resource.sizeBytes);
  const Icon =
    resource.type === "pdf"
      ? FileText
      : resource.type === "practice_file" || resource.type === "template" || resource.type === "assignment"
        ? FileSpreadsheet
        : resource.type === "external"
          ? Link2
          : File;
  const iconClass =
    resource.type === "pdf"
      ? "bg-rose-50 text-rose-600"
      : resource.type === "practice_file" || resource.type === "template" || resource.type === "assignment"
        ? "bg-emerald-50 text-emerald-700"
        : resource.type === "external"
          ? "bg-amber-50 text-amber-700"
          : "bg-[#eef2ff] text-[#4f46e5]";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-slate-900">{resource.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold uppercase tracking-wide">
            {typeLabel}
          </Badge>
          {size ? <span>{size}</span> : null}
          {resource.locked ? (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Lock className="h-3 w-3" /> Locked
            </span>
          ) : !resource.downloadable ? (
            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              View only
            </span>
          ) : null}
        </div>
      </div>
      <TooltipProvider delayDuration={200}>
        <div className="flex shrink-0 items-center gap-1">
          {resource.externalUrl ? (
            <a
              href={resource.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View
            </a>
          ) : null}
          {enrolled && resource.downloadUrl && resource.downloadable && !resource.locked ? (
            <a
              href={resource.downloadUrl}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#4f46e5] px-2.5 text-xs font-medium text-white transition-colors hover:bg-[#4338ca]"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 px-2.5 text-xs"
                  disabled
                  aria-label={resource.locked ? "Resource locked" : "View only resource"}
                >
                  {resource.locked ? <Lock className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                  Download
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {resource.locked
                  ? enrolled
                    ? "Complete the gating lesson to unlock this file"
                    : "Enroll in the course to access resources"
                  : "This resource is view only"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
