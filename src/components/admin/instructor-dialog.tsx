"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface InstructorInitial {
  id: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  credentials?: string | null;
}

export function InstructorDialog({
  initial,
  action,
}: {
  initial?: InstructorInitial;
  action: (formData: FormData) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial?.id);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (editing) fd.set("id", initial!.id);
    startTransition(async () => {
      try {
        await action(fd);
        toast.success(editing ? "Instructor updated" : "Instructor added");
        form.reset();
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save instructor");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900" aria-label={`Edit instructor ${initial?.name}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button type="button" className="bg-[#dc2626] text-white hover:bg-[#b91c1c]">
            <Plus className="h-4 w-4" /> Add instructor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit instructor" : "Add instructor"}</DialogTitle>
          <DialogDescription>Instructors can be attached to courses from the course form.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="instructor-name">Name *</Label>
            <Input id="instructor-name" name="name" required defaultValue={initial?.name ?? ""} placeholder="Rahul Sharma" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instructor-title">Title</Label>
            <Input id="instructor-title" name="title" defaultValue={initial?.title ?? ""} placeholder="Senior Data Analyst, ex-Flipkart" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instructor-photo">Photo URL</Label>
            <Input id="instructor-photo" name="photoUrl" type="url" defaultValue={initial?.photoUrl ?? ""} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instructor-credentials">Credentials</Label>
            <Input id="instructor-credentials" name="credentials" defaultValue={initial?.credentials ?? ""} placeholder="MCS, Microsoft Certified Trainer" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instructor-bio">Bio</Label>
            <Textarea id="instructor-bio" name="bio" rows={3} defaultValue={initial?.bio ?? ""} placeholder="Short teaching background…" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="bg-[#dc2626] text-white hover:bg-[#b91c1c]">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? "Save changes" : "Add instructor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
