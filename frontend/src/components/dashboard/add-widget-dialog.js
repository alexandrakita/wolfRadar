"use client";

import { WIDGET_CATALOG, WIDGET_TYPES } from "@/constants/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  Calendar,
  LineChart,
  Newspaper,
  Star,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

const ICONS = {
  [WIDGET_TYPES.MARKET_OVERVIEW]: Activity,
  [WIDGET_TYPES.FAVORITE_TICKER]: Star,
  [WIDGET_TYPES.MARKET_MOVERS]: TrendingUp,
  [WIDGET_TYPES.TOP_WOLF_RATING]: Zap,
  [WIDGET_TYPES.WHATS_CHANGED]: LineChart,
  [WIDGET_TYPES.NEWS_FEED]: Newspaper,
  [WIDGET_TYPES.PORTFOLIO_OVERVIEW]: Wallet,
  [WIDGET_TYPES.UPCOMING_EVENTS]: Calendar,
};

export function AddWidgetDialog({ open, onOpenChange, onAdd }) {
  const types = Object.keys(WIDGET_CATALOG);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add widget</DialogTitle>
          <DialogDescription>
            Build your command center with live market data and Wolf Radar insights.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {types.map((type) => {
            const meta = WIDGET_CATALOG[type];
            const Icon = ICONS[type] ?? Activity;
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAdd(type);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/15 p-4 text-left transition",
                  "hover:border-primary/40 hover:bg-secondary/30",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{meta.title}</span>
                    {meta.live ? (
                      <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-accent">
                        Live
                      </span>
                    ) : (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-400">
                        Mock
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
