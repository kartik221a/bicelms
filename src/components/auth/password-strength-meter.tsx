"use client";

import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Live 4-segment password strength meter: length (8+), mixed case, digit and
 * symbol criteria. Used by the register and reset-password forms.
 */
const CRITERIA = [
  { label: "8+ characters", test: (pw: string) => pw.length >= 8 },
  { label: "upper & lowercase", test: (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: "a number", test: (pw: string) => /\d/.test(pw) },
  { label: "a symbol", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
] as const;

function meta(score: number) {
  switch (score) {
    case 1:
      return { color: "bg-red-500", text: "Weak password", textClass: "text-red-600" };
    case 2:
      return { color: "bg-orange-500", text: "Fair password", textClass: "text-orange-600" };
    case 3:
      return { color: "bg-amber-500", text: "Good password", textClass: "text-amber-600" };
    case 4:
      return { color: "bg-emerald-500", text: "Strong password", textClass: "text-emerald-600" };
    default:
      return { color: "", text: "", textClass: "" };
  }
}

export function PasswordStrengthMeter({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  const results = CRITERIA.map((c) => ({ ...c, ok: c.test(password) }));
  const score = results.filter((r) => r.ok).length;
  const m = meta(score);
  const allMet = score === 4;

  return (
    <div className={cn("space-y-1.5", className)} aria-live="polite">
      <div
        className="grid grid-cols-4 gap-1.5"
        role="status"
        aria-label={`Password strength: ${m.text || "enter a password"}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-colors duration-200 ${
              i < score ? m.color : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      {allMet ? (
        <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Meets all criteria (8+ characters, upper &amp; lowercase, numbers, symbols)
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Use {results.filter((r) => !r.ok).map((r) => r.label).join(", ")}
        </p>
      )}
    </div>
  );
}
