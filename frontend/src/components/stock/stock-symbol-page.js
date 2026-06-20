"use client";

/* eslint-disable @next/next/no-img-element -- news thumbnails come from arbitrary publisher CDNs */

import Link from "next/link";
import { Fragment } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Globe, TrendingDown, TrendingUp } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { FavoriteButton } from "@/components/favorite-button";
import { InsiderTransactionsTable } from "@/components/insider-transactions-table";
import { PriceChart } from "@/components/price-chart";
import { StockAvatar } from "@/components/stock-avatar";
import { STOCK_UNIVERSE } from "@/data/stock-universe";
import { fetchStockBundle, fetchWolfRating } from "@/services/api";
import { cn } from "@/lib/utils";
import {
  Bar,
  Card,
  Empty,
  fmt,
  formatBig,
  FundamentalsSections,
  Stat,
  WolfRatingCircle,
} from "./stock-detail-blocks";

export default function StockSymbolPage() {
  const params = useParams();
  const symbol = decodeURIComponent(String(params?.symbol ?? ""));
  const sym = String(symbol ?? "").toUpperCase();

  const { data, isLoading } = useQuery({
    queryKey: ["stock-bundle", sym],
    queryFn: () => fetchStockBundle(sym),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const { data: rating, isLoading: ratingLoading } = useQuery({
    queryKey: ["wolf-rating", sym],
    queryFn: () => fetchWolfRating(sym),
    staleTime: 60 * 60_000,
    refetchOnWindowFocus: false,
  });

  const meta = STOCK_UNIVERSE.find((r) => r.sym === sym);
  const profile = data?.profile ?? {};
  const quote = data?.quote ?? null;
  const name = profile.name || meta?.name || sym;
  const up = (quote?.dp ?? 0) >= 0;

  return (
    <DashboardPageShell>
      <Fragment>
        <Link
          href="/screener"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to screener
        </Link>

        <section
          className="rounded-2xl border border-border/60 p-6"
          style={{
            background: "var(--gradient-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <StockAvatar symbol={sym} src={profile.logo} size="lg" alt={name} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{sym}</h1>
                  {profile.exchange ? (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {profile.exchange}
                    </span>
                  ) : null}
                  <FavoriteButton symbol={sym} size="sm" className="ml-1" />
                </div>
                <p className="mt-1 text-muted-foreground">{name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {profile.finnhubIndustry ? <span>{profile.finnhubIndustry}</span> : null}
                  {profile.country ? <span>· {profile.country}</span> : null}
                  {profile.weburl ? (
                    <a
                      href={profile.weburl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums">
                  {quote?.c != null ? `$${quote.c.toFixed(2)}` : isLoading ? "…" : "—"}
                </div>
                {quote ? (
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-sm font-medium tabular-nums",
                      up ? "text-accent" : "text-destructive",
                    )}
                  >
                    {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {up ? "+" : ""}
                    {quote.d.toFixed(2)} ({up ? "+" : ""}
                    {quote.dp.toFixed(2)}%)
                  </div>
                ) : null}
              </div>
              <WolfRatingCircle rating={rating} isLoading={ratingLoading} />
            </div>
          </div>
        </section>

        <section className="mt-6">
          <PriceChart symbol={sym} />
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Open" value={fmt(quote?.o)} />
          <Stat label="High" value={fmt(quote?.h)} />
          <Stat label="Low" value={fmt(quote?.l)} />
          <Stat label="Prev Close" value={fmt(quote?.pc)} />
          <Stat
            label="Market Cap"
            value={
              profile.marketCapitalization
                ? `$${formatBig(profile.marketCapitalization * 1e6)}`
                : "—"
            }
          />
          <Stat
            label="Shares Out"
            value={
              profile.shareOutstanding ? formatBig(profile.shareOutstanding * 1e6) : "—"
            }
          />
        </section>

        {data?.fundamentals ? <FundamentalsSections f={data.fundamentals} /> : null}

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Analyst Recommendations" subtitle="Last 4 months">
            {data?.recommendation?.length ? (
              <div className="space-y-3">
                {data.recommendation.map((r) => {
                  const total =
                    r.strongBuy + r.buy + r.hold + r.sell + r.strongSell || 1;

                  return (
                    <div key={r.period}>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>{r.period}</span>
                        <span>{total} analysts</span>
                      </div>
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
                        <Bar w={r.strongBuy / total} cls="bg-emerald-500" />
                        <Bar w={r.buy / total} cls="bg-emerald-400/70" />
                        <Bar w={r.hold / total} cls="bg-amber-400/70" />
                        <Bar w={r.sell / total} cls="bg-red-400/70" />
                        <Bar w={r.strongSell / total} cls="bg-red-500" />
                      </div>
                      <div className="mt-1 grid grid-cols-5 gap-1 text-[10px] text-muted-foreground">
                        <span>SB {r.strongBuy}</span>
                        <span>B {r.buy}</span>
                        <span>H {r.hold}</span>
                        <span>S {r.sell}</span>
                        <span>SS {r.strongSell}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty>No analyst data</Empty>
            )}
          </Card>

          <Card title="Earnings Surprises" subtitle="EPS actual vs estimate">
            {data?.earnings?.length ? (
              <div className="space-y-2">
                {data.earnings.map((e) => {
                  const positive = (e.surprisePercent ?? 0) >= 0;

                  return (
                    <div
                      key={e.period}
                      className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">{e.period}</span>
                      <span className="tabular-nums">
                        Est {e.estimate ?? "—"} → Act {e.actual ?? "—"}
                      </span>
                      <span
                        className={cn(
                          "tabular-nums font-medium",
                          positive ? "text-accent" : "text-destructive",
                        )}
                      >
                        {e.surprisePercent != null
                          ? `${positive ? "+" : ""}${e.surprisePercent.toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty>No earnings data</Empty>
            )}
          </Card>

          <Card title="Insider Sentiment" subtitle="MSPR (monthly share purchase ratio)">
            {data?.insiderSentiment?.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {data.insiderSentiment
                  .slice()
                  .reverse()
                  .map((s) => {
                    const positive = s.mspr >= 0;

                    return (
                      <div
                        key={`${s.year}-${s.month}`}
                        className="rounded-lg bg-secondary/30 p-2 text-center"
                      >
                        <div className="text-[10px] text-muted-foreground">
                          {s.year}/{String(s.month).padStart(2, "0")}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-sm font-semibold tabular-nums",
                            positive ? "text-accent" : "text-destructive",
                          )}
                        >
                          {s.mspr.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <Empty>No insider data</Empty>
            )}
          </Card>

          <Card title="Peers" subtitle="Related companies">
            {data?.peers?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.peers.map((p) => (
                  <Link
                    key={p}
                    href={`/stock/${p}`}
                    className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-foreground"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            ) : (
              <Empty>No peer data</Empty>
            )}
          </Card>
        </section>

        <section id="news" className="mt-6 scroll-mt-24">
          <Card title="Recent News" subtitle="Last 14 days">
            {data?.news?.length ? (
              <ul className="divide-y divide-border/60">
                {data.news.map((n) => (
                  <li key={n.id} className="py-3">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex gap-3"
                    >
                      {n.image ? (
                        <img
                          src={n.image}
                          alt=""
                          className="h-16 w-24 shrink-0 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{n.source}</span>
                          <span>·</span>
                          <span>{new Date(n.datetime * 1000).toLocaleDateString()}</span>
                        </div>
                        <h3 className="mt-1 line-clamp-2 text-sm font-medium group-hover:text-accent">
                          {n.headline}{" "}
                          <ExternalLink className="ml-1 inline h-3 w-3 opacity-60" />
                        </h3>
                        {n.summary ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {n.summary}
                          </p>
                        ) : null}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No recent news</Empty>
            )}
          </Card>
        </section>

        {data?.insiderTransactions?.length ? (
          <section className="mt-6">
            <Card title="Insider Transactions" subtitle="Recent filings">
              <InsiderTransactionsTable rows={data.insiderTransactions} />
            </Card>
          </section>
        ) : null}
      </Fragment>
    </DashboardPageShell>
  );
}
