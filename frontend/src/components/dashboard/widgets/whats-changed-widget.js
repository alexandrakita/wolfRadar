"use client";

import Link from "next/link";

import { mockWhatsChangedToday } from "@/utils/dashboard-mock";
import { WidgetFrame } from "@/components/dashboard/widget-frame";
import { StockAvatar } from "@/components/stock-avatar";
import { screenerSymbolUrl } from "@/utils/dashboard-links";
import { cn } from "@/lib/utils";
import { TrendingUp, Volume2, Calendar, LineChart, BadgeDollarSign } from "lucide-react";

const ICONS = {
  rating: TrendingUp,
  volume: Volume2,
  earnings: Calendar,
  analyst: LineChart,
  dividend: BadgeDollarSign,
};

export function WhatsChangedWidget(props) {
  const items = mockWhatsChangedToday();

  return (
    <WidgetFrame type="whats-changed" {...props}>
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = ICONS[item.type] ?? TrendingUp;
          return (
            <li key={`${item.sym}-${item.kind}`}>
              <Link
                href={screenerSymbolUrl(item.sym)}
                className="flex items-start gap-3 rounded-xl border border-border/40 bg-secondary/15 p-3 transition hover:border-primary/30"
              >
                <StockAvatar symbol={item.sym} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.sym}</span>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="text-sm">{item.kind}</div>
                  <div
                    className={cn(
                      "mt-0.5 text-xs font-medium",
                      item.type === "rating" ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    {item.detail}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Mock change feed — Wolf Rating deltas placeholder until live scoring ships.
      </p>
    </WidgetFrame>
  );
}
