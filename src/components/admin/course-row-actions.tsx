"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Eye, EyeOff, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialogButton } from "@/components/admin/confirm-dialog";

export function CourseRowActions({
  courseId,
  slug,
  status,
  setStatus,
  onDelete,
}: {
  courseId: string;
  slug: string;
  status: string;
  setStatus: (status: "draft" | "published" | "scheduled") => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();

  function changeStatus(next: "draft" | "published" | "scheduled") {
    startTransition(async () => {
      try {
        await setStatus(next);
        toast.success(next === "published" ? "Course published" : next === "draft" ? "Course unpublished" : "Course scheduled");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update status");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Course actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-slate-500">Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/courses/${courseId}/edit`} className="cursor-pointer">
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/courses/${slug}`} target="_blank" className="cursor-pointer">
            <ExternalLink className="h-4 w-4" /> View public page
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {status === "published" ? (
          <DropdownMenuItem onSelect={() => changeStatus("draft")} disabled={pending} className="cursor-pointer">
            <EyeOff className="h-4 w-4" /> Unpublish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => changeStatus("published")} disabled={pending} className="cursor-pointer">
            <Eye className="h-4 w-4" /> Publish
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <ConfirmDialogButton
          trigger={
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          }
          title="Delete course?"
          description="The course, its curriculum and its resources will be permanently removed. Student enrollments are not deleted."
          confirmLabel="Delete course"
          onConfirm={onDelete}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
