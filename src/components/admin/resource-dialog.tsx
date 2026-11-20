"use client";

import { useMemo, useState, useTransition } from "react";
import { FolderPlus, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ResourceCourse {
  id: string;
  title: string;
  lessons: { id: string; title: string }[];
}

export function ResourceDialog({
  courses,
  initial,
  action,
}: {
  courses: ResourceCourse[];
  initial?: {
    id: string;
    courseId: string;
    lessonId?: string | null;
    title: string;
    type: string;
    storageId?: string | null;
    externalUrl?: string | null;
    downloadable: boolean;
    availableAfterLessonId?: string | null;
  };
  action: (formData: FormData) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [courseId, setCourseId] = useState(initial?.courseId ?? "");
  const [type, setType] = useState(initial?.type ?? "pdf");

  const lessons = useMemo(() => courses.find((c) => c.id === courseId)?.lessons ?? [], [courses, courseId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (initial?.id) fd.set("id", initial.id);
    fd.set("courseId", courseId === "none" ? "" : courseId);
    fd.set("type", type);
    startTransition(async () => {
      try {
        await action(fd);
        toast.success(initial?.id ? "Resource updated" : "Resource added");
        form.reset();
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save resource");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initial ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900" aria-label={`Edit resource ${initial.title}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button type="button" className="bg-[#dc2626] text-white hover:bg-[#b91c1c]">
            <FolderPlus className="h-4 w-4" /> Add resource
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit resource" : "Add resource"}</DialogTitle>
          <DialogDescription>
            Attach downloadable files or external links to a course, optionally gated behind a lesson.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Course *</Label>
              <Select value={courseId || "none"} onValueChange={(v) => { setCourseId(v === "none" ? "" : v); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select course…</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <input type="hidden" name="type" value={type} />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="cheatsheet">Cheat sheet</SelectItem>
                  <SelectItem value="practice_file">Practice file</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="external">External link</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resource-title">Title *</Label>
            <Input id="resource-title" name="title" required defaultValue={initial?.title ?? ""} placeholder="Section 1 exercise workbook" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Linked lesson</Label>
              <Select name="lessonId" defaultValue={initial?.lessonId || "none"} key={`lesson-${courseId}`}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {lessons.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Available after lesson</Label>
              <Select name="availableAfterLessonId" defaultValue={initial?.availableAfterLessonId || "none"} key={`gate-${courseId}`}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Immediately" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Immediately</SelectItem>
                  {lessons.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="resource-storage">Storage ID</Label>
              <Input id="resource-storage" name="storageId" defaultValue={initial?.storageId ?? ""} placeholder="cloudinary asset id" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resource-url">External URL</Label>
              <Input id="resource-url" name="externalUrl" type="url" defaultValue={initial?.externalUrl ?? ""} placeholder="https://…" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox name="downloadable" defaultChecked={initial?.downloadable ?? true} />
            Downloadable by enrolled students
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="bg-[#dc2626] text-white hover:bg-[#b91c1c]">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {initial ? "Save changes" : "Add resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
