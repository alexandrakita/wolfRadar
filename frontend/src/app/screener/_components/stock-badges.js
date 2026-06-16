"use client";

import { STOCK_BADGE_BY_ID } from "@/constants/stock-badges";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function StockBadges({ badgeIds, className }) {
  if (!badgeIds?.length) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-wrap gap-1", className)}>
        {badgeIds.map((id) => {
          const badge = STOCK_BADGE_BY_ID[id];
          if (!badge) return null;
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex size-6 cursor-default items-center justify-center rounded-full border text-sm leading-none",
                    badge.color,
                  )}
                  aria-label={badge.label}
                  title={badge.label}
                >
                  <span aria-hidden>{badge.emoji}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] space-y-1 p-2.5">
                <p className="font-semibold">
                  {badge.emoji} {badge.label}
                </p>
                <p className="text-primary-foreground/80">{badge.short}</p>
                <p className="text-[10px] text-primary-foreground/60">{badge.criteria}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
