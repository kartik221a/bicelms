"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Marks the current lesson as completed via POST /api/v1/progress
 * (positionSeconds 0, watchPercent 100, completed true) and refreshes the
 * route so server-computed progress, sidebar and certificate checks update.
 */
export function MarkCompletedButton({
  lessonId,
  completed,
  enrolled,
  className,
}: {
  lessonId: string;
  completed: boolean;
  enrolled: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!enrolled) {
    return (
      <Button variant="outline" disabled className={className} title="Enroll to track progress">
        <CheckCircle2 className="h-4 w-4" /> Enroll to track progress
      </Button>
    );
  }

  if (completed) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn("border-emerald-200 text-emerald-700", className)}
      >
        <CheckCircle2 className="h-4 w-4" /> Completed
      </Button>
    );
  }

  async function markCompleted() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, positionSeconds: 0, watchPercent: 100, completed: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error?.message ?? "Could not mark this lesson as completed.");
        return;
      }
      toast.success("Lesson completed. Keep it up!");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button onClick={markCompleted} disabled={saving || isPending} className={className}>
      {saving || isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      Mark as completed
    </Button>
  );
}
