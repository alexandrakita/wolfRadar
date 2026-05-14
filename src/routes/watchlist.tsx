import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star, TrendingDown, TrendingUp } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { FavoriteButton } from "@/components/favorite-button";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useQuotes } from "@/hooks/use-quotes";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — WolfRadar" },
      { name: "description", content: "Your personal stock watchlist with live prices." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const [collapsed, setCollapsed] = useState(false);
  const { list } = useWatchlist();
  const { quotes } = useQuotes(list);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMobileMenu={() => setCollapsed((c) => !c)} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Watchlist</h1>
            <p className="mt-2 text-muted-foreground">
              {list.length} {list.length === 1 ? "stock" : "stocks"} you're tracking. Tap the star anywhere to add or remove.
            </p>
          </div>

          {list.length === 0 ? (
            <div
              className="rounded-2xl border border-border/60 p-10 text-center"
              style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
            >
              <Star className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h2 className="mt-3 text-lg font-semibold">Your watchlist is empty</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Open the screener and tap the star next to any stock to add it here.
              </p>
              <Link
                to="/screener"
                className="mt-5 inline-flex rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                Browse stocks
              </Link>
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-2xl border border-border/60"
              style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Symbol</th>
                      <th className="px-4 py-3 text-right font-medium">Price</th>
                      <th className="px-4 py-3 text-right font-medium">Change</th>
                      <th className="px-4 py-3 text-right font-medium">Day Range</th>
                      <th className="px-4 py-3 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {list.map((sym) => {
                      const q = quotes[sym];
                      const meta = STOCK_UNIVERSE.find((r) => r.sym === sym);
                      const up = (q?.dp ?? 0) >= 0;
                      return (
                        <tr key={sym} className="transition hover:bg-secondary/30">
                          <td className="px-4 py-3">
                            <Link to="/stock/$symbol" params={{ symbol: sym }} className="flex items-center gap-3">
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-semibold text-primary-foreground"
                                style={{ background: "var(--gradient-primary)" }}
                              >
                                {sym.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-medium">{sym}</div>
                                <div className="text-xs text-muted-foreground">{meta?.name ?? "—"}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {q?.c != null ? `$${q.c.toFixed(2)}` : "—"}
                          </td>
                          <td className={cn("px-4 py-3 text-right tabular-nums", up ? "text-accent" : "text-destructive")}>
                            {q ? (
                              <span className="inline-flex items-center justify-end gap-1">
                                {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                {up ? "+" : ""}{q.dp.toFixed(2)}%
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {q ? `${q.l.toFixed(2)} – ${q.h.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <FavoriteButton symbol={sym} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
