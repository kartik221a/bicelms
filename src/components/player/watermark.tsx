"use client";

import { useEffect, useRef } from "react";

/**
 * Dynamic student watermark (master prompt §7): name + masked email + student
 * id, drifting periodically to make simple cropping harder. This is a
 * deterrent layer, not DRM — stated honestly in the docs.
 */
export function VideoWatermark({
  name,
  maskedEmail,
  studentId,
  opacity = 0.12,
}: {
  name: string;
  maskedEmail: string;
  studentId: string;
  opacity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Re-trigger the drift animation periodically with a new phase so the
    // pattern is not trivially predictable.
    const interval = setInterval(() => {
      if (ref.current) {
        ref.current.style.animationDuration = `${12 + Math.random() * 6}s`;
        ref.current.style.animationDelay = `${-Math.random() * 8}s`;
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const line = `${name}  |  ${maskedEmail}  |  ID ${studentId}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none" aria-hidden>
      <div ref={ref} className="watermark-drift absolute inset-0">
        <p
          className="absolute whitespace-nowrap text-sm font-medium tracking-wide text-white"
          style={{ left: "12%", top: "18%", opacity, textShadow: "0 0 4px rgba(0,0,0,0.35)" }}
        >
          {line}
        </p>
        <p
          className="absolute whitespace-nowrap text-sm font-medium tracking-wide text-white"
          style={{ right: "8%", bottom: "22%", opacity, transform: "rotate(-18deg)", textShadow: "0 0 4px rgba(0,0,0,0.35)" }}
        >
          {line}
        </p>
      </div>
    </div>
  );
}
