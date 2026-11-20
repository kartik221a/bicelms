import { Star } from "lucide-react";

export function RatingStars({
  rating,
  count,
  size = "sm",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const cls = size === "md" ? "h-4.5 w-4.5" : "h-3.5 w-3.5";
  return (
    <span className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${cls} ${i <= Math.round(rating) ? "fill-[#ef4444] text-[#ef4444]" : "fill-slate-200 text-slate-200"}`}
          />
        ))}
      </span>
      <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
      {count !== undefined ? <span className="text-slate-500">({count.toLocaleString("en-IN")} reviews)</span> : null}
    </span>
  );
}
