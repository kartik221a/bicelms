"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Receipt, UserRound } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/admin/status-pill";
import { ConfirmDialogButton } from "@/components/admin/confirm-dialog";

export interface StudentDetailData {
  id: string;
  name: string;
  email: string;
  status: string;
  joined: string;
  enrollments: { id: string; courseTitle: string; progressPercent: number; status: string; source: string }[];
  orders: { id: string; orderNumber: string; courseTitle: string; finalAmount: number; status: string; date: string }[];
}

export function StudentDetailDialog({
  student,
  courses,
  onRevoke,
  onManualEnroll,
}: {
  student: StudentDetailData;
  courses: { id: string; title: string }[];
  onRevoke: (enrollmentId: string) => Promise<unknown>;
  onManualEnroll: (courseId: string) => Promise<unknown>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [courseId, setCourseId] = useState("");

  function close() {
    // Navigating away clears the ?student= search param server-side
    router.push("/admin/students");
  }

  function enroll() {
    if (!courseId || courseId === "none") {
      toast.error("Pick a course to enroll into");
      return;
    }
    startTransition(async () => {
      try {
        await onManualEnroll(courseId);
        toast.success("Student enrolled manually");
        close();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not enroll student");
      }
    });
  }

  const avgProgress = student.enrollments.length
    ? Math.round(
        student.enrollments.reduce((a, e) => a + (e.status === "active" ? e.progressPercent : 0), 0) /
          Math.max(1, student.enrollments.filter((e) => e.status === "active").length)
      )
    : 0;

  return (
    <Dialog open onOpenChange={(v) => (!v ? close() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-bold text-[#4f46e5]">
              {student.name.charAt(0).toUpperCase()}
            </span>
            {student.name}
            <StatusPill status={student.status} />
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{student.email}</span>
            <span>Joined {student.joined}</span>
            <span>
              {student.enrollments.filter((e) => e.status === "active").length} active courses · avg progress {avgProgress}%
            </span>
          </DialogDescription>
        </DialogHeader>

        <section aria-label="Purchased courses">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BookOpen className="h-4 w-4 text-[#4f46e5]" /> Purchased courses
          </h3>
          {student.enrollments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No enrollments yet — use manual enrollment below.
            </p>
          ) : (
            <ul className="space-y-2">
              {student.enrollments.map((e) => (
                <li key={e.id} className="rounded-lg border border-slate-200 px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{e.courseTitle}</p>
                      <p className="text-xs capitalize text-slate-500">
                        {e.status} · via {e.source}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">{e.progressPercent}%</span>
                      {e.status === "active" ? (
                        <ConfirmDialogButton
                          trigger={
                            <Button type="button" variant="outline" size="sm" className="h-7 border-rose-200 text-xs text-rose-600 hover:bg-rose-50">
                              Revoke
                            </Button>
                          }
                          title="Revoke enrollment?"
                          description={`Access to "${e.courseTitle}" will be removed immediately. The order history is kept.`}
                          confirmLabel="Revoke access"
                          onConfirm={() => onRevoke(e.id)}
                        />
                      ) : null}
                    </div>
                  </div>
                  <Progress value={e.progressPercent} className="mt-2 h-1.5" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator />

        <section aria-label="Order history">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Receipt className="h-4 w-4 text-[#4f46e5]" /> Order history
          </h3>
          {student.orders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">No orders yet.</p>
          ) : (
            <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {student.orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-slate-600">{o.orderNumber}</span>
                  <span className="min-w-0 flex-1 truncate px-2 text-slate-700">{o.courseTitle}</span>
                  <span className="font-semibold text-slate-900">{formatINR(o.finalAmount)}</span>
                  <StatusPill status={o.status} className="px-1.5 py-0 text-[10px]" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator />

        <section aria-label="Manually enroll">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserRound className="h-4 w-4 text-[#4f46e5]" /> Manually enroll
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="courseId" value={courseId} />
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-full flex-1">
                <SelectValue placeholder="Select a course…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a course…</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={enroll}
              disabled={pending}
              className="bg-[#4f46e5] text-white hover:bg-[#4338ca]"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enroll
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Creates a free active enrollment with source &ldquo;manual&rdquo; — no payment record is generated.
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
