import { Badge } from "@/components/ui/badge";

// Red / white / black palette: Beginner = neutral, Intermediate = red,
// Advanced = solid black (strongest visual weight for the hardest level).
const CONFIG = {
  beginner: { label: "Beginner", className: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  intermediate: { label: "Intermediate", className: "bg-red-50 text-red-700 border-red-200" },
  advanced: { label: "Advanced", className: "bg-black text-white border-black" },
} as const;

export function LevelBadge({ level }: { level: string }) {
  const cfg = CONFIG[level as keyof typeof CONFIG] ?? CONFIG.beginner;
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
