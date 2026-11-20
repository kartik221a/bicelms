"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PublishToggleButton({
  status,
  onToggle,
}: {
  status: string;
  onToggle: (status: "draft" | "published" | "scheduled") => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();
  const published = status === "published";

  function toggle() {
    startTransition(async () => {
      try {
        await onToggle(published ? "draft" : "published");
        toast.success(published ? "Course unpublished — students can no longer see it" : "Course published");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update status");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggle}
      disabled={pending}
      className={published ? "" : "bg-[#4f46e5] text-white hover:bg-[#4338ca]"}
    >
      {published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      {published ? "Unpublish" : "Publish course"}
    </Button>
  );
}
