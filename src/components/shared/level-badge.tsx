import { Badge } from "@/components/ui/badge";

const CONFIG = {
  beginner: { label: "Beginner", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  intermediate: { label: "Intermediate", className: "bg-amber-50 text-amber-700 border-amber-200" },
  advanced: { label: "Advanced", className: "bg-rose-50 text-rose-700 border-rose-200" },
} as const;

export function LevelBadge({ level }: { level: string }) {
  const cfg = CONFIG[level as keyof typeof CONFIG] ?? CONFIG.beginner;
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
