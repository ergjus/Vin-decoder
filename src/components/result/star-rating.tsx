import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** NCAP ratings are "1"–"5" or "Not Rated". */
export function StarRating({ rating, className }: { rating: string; className?: string }) {
  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return <span className="text-muted-foreground text-sm">Not rated</span>;
  }
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${stars} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            "size-4",
            i < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  );
}
