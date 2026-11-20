"use client";

import { useState, useTransition } from "react";
import { Check, EyeOff, Loader2, MessageSquareReply } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

export interface ReviewModerateProps {
  reviewId: string;
  currentStatus: string;
  onModerate: (status: "approved" | "hidden" | "pending", adminReply?: string) => Promise<unknown>;
}

export function ReviewActions({ reviewId, currentStatus, onModerate }: ReviewModerateProps) {
  const [pending, startTransition] = useTransition();
  const [replyOpen, setReplyOpen] = useState(false);

  function moderate(status: "approved" | "hidden" | "pending", adminReply?: string) {
    startTransition(async () => {
      try {
        await onModerate(status, adminReply);
        toast.success(status === "approved" ? "Review approved" : status === "hidden" ? "Review hidden" : "Review set to pending");
        setReplyOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not moderate review");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {currentStatus !== "approved" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-emerald-700 hover:bg-emerald-50"
          disabled={pending}
          onClick={() => moderate("approved")}
          aria-label="Approve review"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-slate-600 hover:bg-slate-100"
          disabled={pending}
          onClick={() => moderate("hidden")}
          aria-label="Hide review"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <EyeOff className="h-3.5 w-3.5" />} Hide
        </Button>
      )}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs text-[#4f46e5] hover:bg-[#eef2ff]" aria-label="Reply to review">
            <MessageSquareReply className="h-3.5 w-3.5" /> Reply
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reply publicly</DialogTitle>
            <DialogDescription>The reply is shown under the review on the course page.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              moderate(currentStatus === "hidden" ? "hidden" : "approved", String(fd.get("adminReply") ?? "").trim() || undefined);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor={`reply-${reviewId}`}>Admin reply</Label>
              <Textarea id={`reply-${reviewId}`} name="adminReply" rows={4} placeholder="Thanks for the feedback!…" />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setReplyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending} className="bg-[#4f46e5] text-white hover:bg-[#4338ca]">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save reply
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
