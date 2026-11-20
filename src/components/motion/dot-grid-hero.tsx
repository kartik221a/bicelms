import { cn } from "@/lib/utils";

/**
 * Hero background (React Bits "Dot Field" + aurora glow style): layered
 * dot grid, drifting brand-red glows and a vignette. Pure CSS — zero
 * runtime cost, server-component safe. Designed for black sections.
 */
export function DotGridHero({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* dot texture */}
      <div className="absolute inset-0 dot-grid" />
      {/* drifting brand glows */}
      <div
        className="animate-glow-drift absolute -top-32 left-[8%] h-80 w-80 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(220,38,38,0.32), transparent 70%)" }}
      />
      <div
        className="animate-glow-drift absolute top-1/3 right-[4%] h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(153,27,27,0.28), transparent 70%)", animationDelay: "-6s" }}
      />
      <div
        className="animate-glow-drift absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(220,38,38,0.18), transparent 70%)", animationDelay: "-3s" }}
      />
      {/* floating outline accents */}
      <div className="animate-float absolute right-[14%] top-[18%] hidden h-24 w-24 rounded-2xl border border-white/10 lg:block" />
      <div
        className="animate-float absolute left-[6%] bottom-[14%] hidden h-16 w-16 rounded-full border border-red-600/30 lg:block"
        style={{ animationDelay: "-3s" }}
      />
      {/* vignette so text stays readable */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
    </div>
  );
}
