"use client";

import Link from "next/link";

import { mockUpcomingEvents } from "@/utils/dashboard-mock";
import { WidgetFrame } from "@/components/dashboard/widget-frame";
import { wolfSignalsUrl } from "@/utils/dashboard-links";
import { Calendar, BadgeDollarSign, TrendingUp } from "lucide-react";

const TYPE_ICON = {
  Earnings: TrendingUp,
  "Ex-Dividend": BadgeDollarSign,
  "Dividend Payment": BadgeDollarSign,
  "Dividend Declaration": Calendar,
};

export function UpcomingEventsWidget(props) {
  const events = mockUpcomingEvents().sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <WidgetFrame type="upcoming-events" {...props}>
      <ul className="divide-y divide-border/50">
        {events.map((event) => {
          const Icon = TYPE_ICON[event.type] ?? Calendar;
          const when = new Date(event.date);
          return (
            <li key={`${event.sym}-${event.type}-${event.date}`}>
              <Link
                href={wolfSignalsUrl({ symbol: event.sym, event: event.type })}
                className="flex items-start gap-3 py-3 transition hover:bg-secondary/20"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/50">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{event.sym}</span>
                    <span className="text-xs text-muted-foreground">
                      {when.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="text-sm">{event.type}</div>
                  <div className="text-xs text-muted-foreground">{event.label}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </WidgetFrame>
  );
}
