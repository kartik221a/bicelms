import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PILL_STYLES: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  captured: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  draft: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  created: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  hidden: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  scheduled: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/25",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/25",
  refunded: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/25",
  failed: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  suspended: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  revoked: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
};

const LABELS: Record<string, string> = {
  published: "Published",
  paid: "Paid",
  approved: "Approved",
  captured: "Captured",
  active: "Active",
  draft: "Draft",
  created: "Created",
  hidden: "Hidden",
  scheduled: "Scheduled",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
  suspended: "Suspended",
  revoked: "Revoked",
  cancelled: "Cancelled",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const key = status?.toLowerCase() ?? "";
  return (
    <Badge variant="outline" className={cn("border-0 px-2 py-0.5 font-medium capitalize", PILL_STYLES[key] ?? PILL_STYLES.draft, className)}>
      {LABELS[key] ?? status}
    </Badge>
  );
}
