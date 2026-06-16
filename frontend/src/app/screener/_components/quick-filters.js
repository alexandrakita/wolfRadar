"use client";

import { STOCK_BADGES } from "@/constants/stock-badges";
import { cn } from "@/lib/utils";

export function QuickFilters({ active, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Quick filters
      </p>
      <div className="flex flex-wrap gap-2">
        {STOCK_BADGES.map((badge) => {
          const on = active.includes(badge.id);
          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => {
                if (on) onChange(active.filter((id) => id !== badge.id));
                else onChange([...active, badge.id]);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                on
                  ? badge.color
                  : "border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground",
              )}
              title={badge.criteria}
            >
              <span aria-hidden>{badge.emoji}</span>
              {badge.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
