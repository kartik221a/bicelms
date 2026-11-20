"use client";

import { useState, useTransition } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AnnouncementForm({
  courses,
  action,
}: {
  courses: { id: string; title: string }[];
  action: (formData: FormData) => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();
  const [audience, setAudience] = useState("all");
  const [courseId, setCourseId] = useState("none");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("audience", audience);
    fd.set("courseId", audience === "course" && courseId !== "none" ? courseId : "");
    startTransition(async () => {
      try {
        await action(fd);
        toast.success("Announcement published");
        form.reset();
        setAudience("all");
        setCourseId("none");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not publish announcement");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ann-title">Title *</Label>
        <Input id="ann-title" name="title" required placeholder="New Power Query module is live" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ann-body">Body *</Label>
        <Textarea id="ann-body" name="body" rows={4} required placeholder="What changed and why it matters…" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Audience</Label>
          <input type="hidden" name="audience" value={audience} />
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="students">Students only</SelectItem>
              <SelectItem value="course">Specific course</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Course {audience === "course" ? "*" : "(optional)"}</Label>
          <input type="hidden" name="courseId" value={courseId} />
          <Select value={courseId} onValueChange={setCourseId} disabled={audience !== "course"}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Checkbox name="pinned" />
          Pin to top of dashboards
        </label>
        <Button type="submit" disabled={pending} className="bg-[#dc2626] text-white hover:bg-[#b91c1c]">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
          Publish announcement
        </Button>
      </div>
    </form>
  );
}
