"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CourseFormInitial {
  id?: string;
  title?: string;
  slug?: string;
  subtitle?: string | null;
  description?: string;
  categoryId?: string | null;
  instructorId?: string | null;
  level?: string;
  price?: number; // paise
  originalPrice?: number | null; // paise
  thumbnailUrl?: string | null;
  status?: string;
}

const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
];

export function CourseForm({
  categories,
  instructors,
  initial,
  action,
  mode,
}: {
  categories: { id: string; name: string }[];
  instructors: { id: string; name: string }[];
  initial?: CourseFormInitial;
  action: (formData: FormData) => Promise<unknown>;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [instructorId, setInstructorId] = useState(initial?.instructorId ?? "");
  const [level, setLevel] = useState(initial?.level ?? "beginner");
  const [status, setStatus] = useState(initial?.status ?? "draft");

  function submit(fd: FormData) {
    startTransition(async () => {
      try {
        const priceRupees = String(fd.get("priceRupees") ?? "").trim();
        const originalRupees = String(fd.get("originalPriceRupees") ?? "").trim();
        if (fd.get("categoryId") === "none") fd.set("categoryId", "");
        if (fd.get("instructorId") === "none") fd.set("instructorId", "");
        fd.set("price", priceRupees === "" ? "0" : String(Math.round(Number(priceRupees) * 100)));
        if (originalRupees !== "") {
          fd.set("originalPrice", String(Math.round(Number(originalRupees) * 100)));
        } else if (mode === "create") {
          fd.set("originalPrice", "");
        }
        const result = await action(fd);
        toast.success(mode === "create" ? "Course created — build the curriculum next" : "Course updated");
        const created = result as { id?: string } | undefined;
        if (mode === "create" && created?.id) {
          router.push(`/admin/courses/${created.id}/edit`);
        } else {
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save the course");
      }
    });
  }

  return (
    <form action={submit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" name="title" required minLength={4} defaultValue={initial?.title ?? ""} placeholder="Advanced Excel for Data Analysts" />
        </div>
        {mode === "create" ? (
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input id="slug" name="slug" placeholder="auto-generated from title" pattern="[a-z0-9-]+" />
            <p className="text-xs text-slate-500">Lowercase letters, numbers and dashes only.</p>
          </div>
        ) : null}
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input id="subtitle" name="subtitle" defaultValue={initial?.subtitle ?? ""} placeholder="One-line pitch shown on the course card" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={5} defaultValue={initial?.description ?? ""} placeholder="What students will learn, who it is for, outcomes…" />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <input type="hidden" name="categoryId" value={categoryId} />
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Instructor</Label>
          <input type="hidden" name="instructorId" value={instructorId} />
          <Select value={instructorId} onValueChange={setInstructorId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {instructors.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Level</Label>
          <input type="hidden" name="level" value={level} />
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <input type="hidden" name="status" value={status} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priceRupees">Price (₹ rupees) *</Label>
          <Input
            id="priceRupees"
            name="priceRupees"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={initial?.price != null ? String(initial.price / 100) : "0"}
            placeholder="2999"
          />
          <p className="text-xs text-slate-500">Enter rupees — stored internally as integer paise (×100).</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="originalPriceRupees">Original price (₹ rupees)</Label>
          <Input
            id="originalPriceRupees"
            name="originalPriceRupees"
            type="number"
            min={0}
            step="1"
            defaultValue={initial?.originalPrice != null ? String(initial.originalPrice / 100) : ""}
            placeholder="4999"
          />
          <p className="text-xs text-slate-500">Shown struck-through next to the price.</p>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
          <Input id="thumbnailUrl" name="thumbnailUrl" type="url" defaultValue={initial?.thumbnailUrl ?? ""} placeholder="https://…/cover.jpg" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="bg-[#4f46e5] text-white hover:bg-[#4338ca]">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? "Create course" : "Save changes"}
        </Button>
        <p className="text-xs text-slate-500">
          {mode === "create"
            ? "You will be taken to the curriculum builder after creating."
            : "Changes apply to the course page immediately after saving."}
        </p>
      </div>
    </form>
  );
}
