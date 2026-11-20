import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#fef2f2] text-[#dc2626]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="truncate text-2xl font-bold text-slate-900">{value}</p>
          {hint ? <p className="text-xs text-emerald-600">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
