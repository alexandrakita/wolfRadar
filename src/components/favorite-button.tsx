import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/use-watchlist";

export function FavoriteButton({
  symbol,
  size = "md",
  className,
}: {
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { has, toggle } = useWatchlist();
  const active = has(symbol);
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(symbol);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      title={active ? "Remove from watchlist" : "Add to watchlist"}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border transition",
        dim,
        active
          ? "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
          : "border-border/60 bg-background/40 text-muted-foreground hover:text-amber-400 hover:border-amber-400/40",
        className,
      )}
    >
      <Star className={cn(icon, active && "fill-current")} />
    </button>
  );
}
