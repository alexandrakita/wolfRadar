import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink, Globe, TrendingDown, TrendingUp } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { getStockBundle } from "@/lib/quotes.functions";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { FavoriteButton } from "@/components/favorite-button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stock/$symbol")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.symbol.toUpperCase()} — WolfRadar Analysis` },
      { name: "description", content: `Live quote, fundamentals, analyst ratings and news for ${params.symbol.toUpperCase()}.` },
    ],
  }),
  component: StockAnalysis,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Could not load stock</h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Retry</button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-8">Stock not found.</div>,
});

function StockAnalysis() {
  const { symbol } = Route.useParams();
  const sym = symbol.toUpperCase();
  const [collapsed, setCollapsed] = useState(false);
  const fetchBundle = useServerFn(getStockBundle);

  const { data, isLoading } = useQuery({
    queryKey: ["stock-bundle", sym],
    queryFn: () => fetchBundle({ data: { symbol: sym } }),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const meta = STOCK_UNIVERSE.find((r) => r.sym === sym);
  const profile = data?.profile ?? {};
  const quote = data?.quote ?? null;
  const name = profile.name || meta?.name || sym;

  const up = (quote?.dp ?? 0) >= 0;
  const wolf = computeWolfRating(quote, data?.recommendation, data?.earnings);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMobileMenu={() => setCollapsed((c) => !c)} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/screener" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to screener
          </Link>

          {/* Header */}
          <section
            className="rounded-2xl border border-border/60 p-6"
            style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                {profile.logo ? (
                  <img src={profile.logo} alt={name} className="h-14 w-14 rounded-xl bg-secondary object-contain p-1" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                    {sym.slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{sym}</h1>
                    {profile.exchange && <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{profile.exchange}</span>}
                    <FavoriteButton symbol={sym} size="sm" className="ml-1" />
                  </div>
                  <p className="mt-1 text-muted-foreground">{name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {profile.finnhubIndustry && <span>{profile.finnhubIndustry}</span>}
                    {profile.country && <span>· {profile.country}</span>}
                    {profile.weburl && (
                      <a href={profile.weburl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                        <Globe className="h-3 w-3" /> Website
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-3xl font-bold tabular-nums">
                    {quote?.c != null ? `$${quote.c.toFixed(2)}` : isLoading ? "…" : "—"}
                  </div>
                  {quote && (
                    <div className={cn("mt-1 flex items-center justify-end gap-1 text-sm font-medium tabular-nums", up ? "text-accent" : "text-destructive")}>
                      {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {up ? "+" : ""}{quote.d.toFixed(2)} ({up ? "+" : ""}{quote.dp.toFixed(2)}%)
                    </div>
                  )}
                </div>
                <WolfRatingDial value={wolf} />
              </div>
            </div>
          </section>

          {/* Quote stats */}
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Open" value={fmt(quote?.o)} />
            <Stat label="High" value={fmt(quote?.h)} />
            <Stat label="Low" value={fmt(quote?.l)} />
            <Stat label="Prev Close" value={fmt(quote?.pc)} />
            <Stat label="Market Cap" value={profile.marketCapitalization ? `$${formatBig(profile.marketCapitalization * 1e6)}` : "—"} />
            <Stat label="Shares Out" value={profile.shareOutstanding ? formatBig(profile.shareOutstanding * 1e6) : "—"} />
          </section>

          {/* Yahoo Finance fundamentals */}
          {data?.fundamentals ? <FundamentalsSections f={data.fundamentals} /> : null}

          {/* Two-column body */}
          <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Analyst ratings */}
            <Card title="Analyst Recommendations" subtitle="Last 4 months">
              {data?.recommendation?.length ? (
                <div className="space-y-3">
                  {data.recommendation.map((r) => {
                    const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell || 1;
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
                          <span>SB {r.strongBuy}</span><span>B {r.buy}</span><span>H {r.hold}</span><span>S {r.sell}</span><span>SS {r.strongSell}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <Empty>No analyst data</Empty>}
            </Card>

            {/* Earnings history */}
            <Card title="Earnings Surprises" subtitle="EPS actual vs estimate">
              {data?.earnings?.length ? (
                <div className="space-y-2">
                  {data.earnings.map((e) => {
                    const positive = (e.surprisePercent ?? 0) >= 0;
                    return (
                      <div key={e.period} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">{e.period}</span>
                        <span className="tabular-nums">Est {e.estimate ?? "—"} → Act {e.actual ?? "—"}</span>
                        <span className={cn("tabular-nums font-medium", positive ? "text-accent" : "text-destructive")}>
                          {e.surprisePercent != null ? `${positive ? "+" : ""}${e.surprisePercent.toFixed(1)}%` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : <Empty>No earnings data</Empty>}
            </Card>

            {/* Insider sentiment */}
            <Card title="Insider Sentiment" subtitle="MSPR (monthly share purchase ratio)">
              {data?.insiderSentiment?.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {data.insiderSentiment.slice().reverse().map((s) => {
                    const positive = s.mspr >= 0;
                    return (
                      <div key={`${s.year}-${s.month}`} className="rounded-lg bg-secondary/30 p-2 text-center">
                        <div className="text-[10px] text-muted-foreground">{s.year}/{String(s.month).padStart(2, "0")}</div>
                        <div className={cn("mt-1 text-sm font-semibold tabular-nums", positive ? "text-accent" : "text-destructive")}>
                          {s.mspr.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <Empty>No insider data</Empty>}
            </Card>

            {/* Peers */}
            <Card title="Peers" subtitle="Related companies">
              {data?.peers?.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.peers.map((p) => (
                    <Link key={p} to="/stock/$symbol" params={{ symbol: p }}
                      className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-foreground">
                      {p}
                    </Link>
                  ))}
                </div>
              ) : <Empty>No peer data</Empty>}
            </Card>
          </section>

          {/* News */}
          <section className="mt-6">
            <Card title="Recent News" subtitle="Last 14 days">
              {data?.news?.length ? (
                <ul className="divide-y divide-border/60">
                  {data.news.map((n) => (
                    <li key={n.id} className="py-3">
                      <a href={n.url} target="_blank" rel="noreferrer" className="group flex gap-3">
                        {n.image && <img src={n.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" loading="lazy" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{n.source}</span>
                            <span>·</span>
                            <span>{new Date(n.datetime * 1000).toLocaleDateString()}</span>
                          </div>
                          <h3 className="mt-1 line-clamp-2 text-sm font-medium group-hover:text-accent">
                            {n.headline} <ExternalLink className="ml-1 inline h-3 w-3 opacity-60" />
                          </h3>
                          {n.summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.summary}</p>}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : <Empty>No recent news</Empty>}
            </Card>
          </section>

          {/* Insider transactions */}
          {data?.insiderTransactions?.length ? (
            <section className="mt-6">
              <Card title="Insider Transactions" subtitle="Recent filings">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr className="border-b border-border/60 text-left">
                        <th className="px-3 py-2">Insider</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2 text-right">Shares Δ</th>
                        <th className="px-3 py-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.insiderTransactions.map((t, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td className="px-3 py-2">{t.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{t.transactionDate}</td>
                          <td className="px-3 py-2 text-muted-foreground">{t.transactionCode}</td>
                          <td className={cn("px-3 py-2 text-right tabular-nums", t.change >= 0 ? "text-accent" : "text-destructive")}>
                            {t.change >= 0 ? "+" : ""}{t.change.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{t.transactionPrice ? `$${t.transactionPrice.toFixed(2)}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

// ---------- helpers ----------
function fmt(n: number | undefined | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}
function formatBig(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 p-5" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
function Bar({ w, cls }: { w: number; cls: string }) {
  return <div className={cls} style={{ width: `${w * 100}%` }} />;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-secondary/30 px-3 py-6 text-center text-sm text-muted-foreground">{children}</div>;
}

// ---------- WolfRating placeholder ----------
// Will be replaced with the user's custom formula.
function computeWolfRating(
  quote: { dp: number } | null | undefined,
  rec: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number }[] | undefined,
  earnings: { surprisePercent: number | null }[] | undefined,
): number | null {
  if (!quote && !rec?.length && !earnings?.length) return null;
  let score = 50;
  if (rec?.length) {
    const r = rec[0];
    const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell || 1;
    const bull = (r.strongBuy * 1 + r.buy * 0.5 - r.sell * 0.5 - r.strongSell * 1) / total;
    score += bull * 30;
  }
  if (earnings?.length) {
    const beats = earnings.filter((e) => (e.surprisePercent ?? 0) > 0).length;
    score += (beats / earnings.length - 0.5) * 20;
  }
  if (quote) score += Math.max(-5, Math.min(5, quote.dp));
  return Math.max(0, Math.min(100, Math.round(score)));
}

function WolfRatingDial({ value }: { value: number | null }) {
  const v = value ?? 0;
  const color = v >= 70 ? "text-accent" : v >= 40 ? "text-amber-400" : "text-destructive";
  const ring = `conic-gradient(currentColor ${v * 3.6}deg, oklch(0.3 0.025 262) 0)`;
  return (
    <div className="flex items-center gap-3">
      <div className={cn("relative grid h-20 w-20 place-items-center rounded-full", color)} style={{ background: ring }}>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-card">
          <span className="text-xl font-bold tabular-nums">{value ?? "—"}</span>
        </div>
      </div>
      <div className="text-xs">
        <div className="font-semibold">WolfRating</div>
        <div className="text-muted-foreground">0–100 score</div>
      </div>
    </div>
  );
}

// ---------- Yahoo Fundamentals ----------
import type { YahooFundamentals } from "@/lib/yahoo.functions";

function fmtNum(n: number | null | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
function fmtMoney(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}
function fmtBig(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${formatBig(n)}`;
}
function fmtPct(n: number | null | undefined, scale = 100) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * scale).toFixed(2)}%`;
}

function FundamentalsSections({ f }: { f: YahooFundamentals }) {
  return (
    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Valuation" subtitle="Yahoo Finance">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Trailing P/E" value={fmtNum(f.trailingPE)} />
          <Stat label="Forward P/E" value={fmtNum(f.forwardPE)} />
          <Stat label="PEG Ratio" value={fmtNum(f.pegRatio)} />
          <Stat label="Price / Book" value={fmtNum(f.priceToBook)} />
          <Stat label="Price / Sales" value={fmtNum(f.priceToSales)} />
          <Stat label="EV / EBITDA" value={fmtNum(f.evToEbitda)} />
          <Stat label="EV / Revenue" value={fmtNum(f.evToRevenue)} />
          <Stat label="Enterprise Value" value={fmtBig(f.enterpriseValue)} />
          <Stat label="Book Value" value={fmtMoney(f.bookValue)} />
        </div>
      </Card>

      <Card title="Profitability & Margins" subtitle="Trailing twelve months">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Gross Margin" value={fmtPct(f.grossMargins)} />
          <Stat label="Operating Margin" value={fmtPct(f.operatingMargins)} />
          <Stat label="Profit Margin" value={fmtPct(f.profitMargins)} />
          <Stat label="Return on Equity" value={fmtPct(f.returnOnEquity)} />
          <Stat label="Return on Assets" value={fmtPct(f.returnOnAssets)} />
          <Stat label="Revenue Growth" value={fmtPct(f.revenueGrowth)} />
          <Stat label="Earnings Growth" value={fmtPct(f.earningsGrowth)} />
          <Stat label="EPS Q. Growth" value={fmtPct(f.earningsQuarterlyGrowth)} />
          <Stat label="Trailing EPS" value={fmtMoney(f.trailingEps)} />
        </div>
      </Card>

      <Card title="Income Statement" subtitle="Latest reported">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Total Revenue" value={fmtBig(f.totalRevenue)} />
          <Stat label="EBITDA" value={fmtBig(f.ebitda)} />
          <Stat label="Net Income" value={fmtBig(f.netIncomeToCommon)} />
          <Stat label="Forward EPS" value={fmtMoney(f.forwardEps)} />
          <Stat label="Total Cash" value={fmtBig(f.totalCash)} />
          <Stat label="Total Debt" value={fmtBig(f.totalDebt)} />
        </div>
      </Card>

      <Card title="Balance Sheet & Risk" subtitle="Liquidity and leverage">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Debt / Equity" value={fmtNum(f.debtToEquity)} />
          <Stat label="Current Ratio" value={fmtNum(f.currentRatio)} />
          <Stat label="Quick Ratio" value={fmtNum(f.quickRatio)} />
          <Stat label="Beta" value={fmtNum(f.beta)} />
          <Stat label="Short % Float" value={fmtPct(f.shortPercentOfFloat)} />
          <Stat label="Short Ratio" value={fmtNum(f.shortRatio)} />
        </div>
      </Card>

      <Card title="Dividends & Ownership" subtitle="Yields and holders">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Dividend Yield" value={fmtPct(f.dividendYield, 100)} />
          <Stat label="Dividend Rate" value={fmtMoney(f.dividendRate)} />
          <Stat label="Payout Ratio" value={fmtPct(f.payoutRatio)} />
          <Stat label="Insiders Held" value={fmtPct(f.heldPercentInsiders)} />
          <Stat label="Institutions Held" value={fmtPct(f.heldPercentInstitutions)} />
          <Stat label="Avg Vol (3M)" value={f.averageDailyVolume3Month != null ? formatBig(f.averageDailyVolume3Month) : "—"} />
        </div>
      </Card>

      <Card title="Price Range & Targets" subtitle="52-week range and analyst targets">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="52W High" value={fmtMoney(f.fiftyTwoWeekHigh)} />
          <Stat label="52W Low" value={fmtMoney(f.fiftyTwoWeekLow)} />
          <Stat label="50-Day Avg" value={fmtMoney(f.fiftyDayAverage)} />
          <Stat label="200-Day Avg" value={fmtMoney(f.twoHundredDayAverage)} />
          <Stat label="Target Mean" value={fmtMoney(f.targetMeanPrice)} />
          <Stat label="Target High" value={fmtMoney(f.targetHighPrice)} />
          <Stat label="Target Low" value={fmtMoney(f.targetLowPrice)} />
          <Stat label="Analyst Rating" value={f.recommendationKey ? f.recommendationKey.replace(/_/g, " ") : "—"} />
          <Stat label="# Analysts" value={fmtNum(f.numberOfAnalystOpinions, 0)} />
        </div>
      </Card>
    </section>
  );
}
