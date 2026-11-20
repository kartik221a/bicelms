import { formatINR, discountPercent } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

export function PriceTag({
  price,
  originalPrice,
  size = "md",
}: {
  price: number;
  originalPrice?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const off = discountPercent(price, originalPrice);
  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold text-slate-900 ${size === "lg" ? "text-3xl" : "text-base"}`}>
        {price === 0 ? "Free" : formatINR(price)}
      </span>
      {originalPrice && originalPrice > price ? (
        <span className={`text-slate-400 line-through ${size === "lg" ? "text-base" : "text-sm"}`}>
          {formatINR(originalPrice)}
        </span>
      ) : null}
      {off ? (
        <Badge className="bg-red-600 hover:bg-red-600 text-white font-semibold">{off}% OFF</Badge>
      ) : null}
    </div>
  );
}
