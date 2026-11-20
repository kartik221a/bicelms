import { cn } from "@/lib/utils";

/**
 * Marquee (Magic UI style): infinite horizontal scroll. Pure CSS
 * (duplicated track + translateX keyframes in globals.css), pauses on
 * hover, masked edges, reverse direction supported. Server-component safe.
 *
 * The track renders `children` twice; the parent must be wide enough for
 * one full copy (use flex + shrink-0 on items).
 */
export function Marquee({
  children,
  className,
  reverse = false,
  duration = 40,
  pauseOnHover = true,
  mask = true,
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  duration?: number;
  pauseOnHover?: boolean;
  mask?: boolean;
}) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden",
        mask && "marquee-mask",
        pauseOnHover && "marquee-paused",
        className
      )}
      style={{ ["--marquee-duration" as string]: `${duration}s` }}
    >
      <div className={cn("flex w-max shrink-0 items-center", reverse ? "animate-marquee-reverse" : "animate-marquee")}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
