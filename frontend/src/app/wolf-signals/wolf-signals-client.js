"use client";

import { useSearchParams } from "next/navigation";
import { Calendar, Zap } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { PageHeading } from "@/components/page-heading";
import { mockUpcomingEvents } from "@/utils/dashboard-mock";

export default function WolfSignalsPage() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol");
  const event = searchParams.get("event");

  const events = mockUpcomingEvents().sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const filtered = symbol
    ? events.filter((e) => e.sym === symbol.toUpperCase())
    : events;

  return (
    <DashboardPageShell>
      <PageHeading
        title="Wolf Signals"
        description="Upcoming earnings, dividends, and catalyst events across your watchlist."
      />
      {symbol ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Showing events for{" "}
          <span className="font-medium text-foreground">{symbol.toUpperCase()}</span>
          {event ? ` · ${event}` : ""}
        </p>
      ) : null}
      <ul className="space-y-3">
        {filtered.map((e) => (
          <li
            key={`${e.sym}-${e.type}-${e.date}`}
            className="flex items-start gap-4 rounded-2xl border border-border/60 p-4"
            style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              {e.type.includes("Earnings") ? (
                <Zap className="h-4 w-4 text-accent" />
              ) : (
                <Calendar className="h-4 w-4 text-accent" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{e.sym}</span>
                <span className="text-sm text-muted-foreground">{e.type}</span>
              </div>
              <p className="mt-1 text-sm">{e.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(e.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted-foreground">
        Event calendar uses mock dates until live earnings/dividend feeds are connected.
      </p>
    </DashboardPageShell>
  );
}
