"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * SpotlightCard (Aceternity Card Spotlight style): a soft radial spotlight
 * follows the cursor across the card surface. Pure CSS variables + pointer
 * events, so it also composes with other hover effects.
 */
export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(220, 38, 38, 0.10)",
  spotlightSize = 420,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightSize?: number;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -spotlightSize, y: -spotlightSize });
  const [active, setActive] = useState(false);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    []
  );

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onClick={onClick}
      className={cn("group relative overflow-hidden", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(${spotlightSize}px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
