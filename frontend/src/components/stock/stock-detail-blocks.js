"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function fmt(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}
export function formatBig(n) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString(undefined, {
    maximumFractionDigits: 0
  });
}
export function Stat({
  label,
  value
}) {
  return <div className="rounded-xl border border-border/60 bg-card/40 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-base font-semibold tabular-nums">{value}</div></div>;
}
export function Card({
  title,
  subtitle,
  children
}) {
  return <div className="rounded-2xl border border-border/60 p-5" style={{
    background: "var(--gradient-card)",
    boxShadow: "var(--shadow-card)"
  }}><div className="mb-4"><h2 className="text-lg font-semibold">{title}</h2>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</div>{children}</div>;
}
export function Bar({
  w,
  cls
}) {
  return <div className={cls} style={{
    width: `${w * 100}%`
  }} />;
}
export function Empty({
  children
}) {
  return <div className="rounded-lg bg-secondary/30 px-3 py-6 text-center text-sm text-muted-foreground">{children}</div>;
}

const CATEGORY_ROWS = [
  { key: "momentumRating", label: "Momentum" },
  { key: "growthRating", label: "Growth / Fundamentals" },
  { key: "sentimentRating", label: "Sentiment" },
  { key: "activityRating", label: "Activity / Attention" },
];

function scoreColor(value) {
  const v = value ?? 0;
  if (v >= 70) return "text-accent";
  if (v >= 40) return "text-amber-400";
  return "text-destructive";
}

function WolfRatingBreakdown({ rating }) {
  return (
    <div className="space-y-3">
      <div className="border-b border-border/60 pb-2">
        <div className="text-sm font-semibold">Wolf Rating breakdown</div>
        {rating.ratingDate ? (
          <div className="text-[11px] text-muted-foreground">As of {rating.ratingDate}</div>
        ) : null}
      </div>
      {CATEGORY_ROWS.map(({ key, label }) => {
        const value = rating[key];
        const pct = typeof value === "number" ? value : 0;
        return (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className={cn("font-semibold tabular-nums", scoreColor(value))}>
                {value ?? "—"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact dial + label (no tooltip) — dashboard widgets. */
export function WolfRatingDial({ value, label = "WolfRating" }) {
  const v = value ?? 0;
  const ring = `conic-gradient(currentColor ${v * 3.6}deg, oklch(0.3 0.025 262) 0)`;
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "relative grid h-20 w-20 place-items-center rounded-full",
          typeof value === "number" ? scoreColor(value) : "text-muted-foreground",
        )}
        style={typeof value === "number" ? { background: ring } : undefined}
      >
        <div className="grid h-16 w-16 place-items-center rounded-full bg-card">
          <span className="text-xl font-bold tabular-nums">{value ?? "—"}</span>
        </div>
      </div>
      <div className="text-xs">
        <div className="font-semibold">{label}</div>
        <div className="text-muted-foreground">0–100 score</div>
      </div>
    </div>
  );
}

/** Header Wolf Rating dial — hover for four category breakdown. */
export function WolfRatingCircle({ rating, isLoading }) {
  const value = rating?.wolfRating;
  const display = isLoading && value == null ? "…" : (value ?? "—");
  const v = typeof value === "number" ? value : 0;
  const ring = `conic-gradient(currentColor ${v * 3.6}deg, oklch(0.3 0.025 262) 0)`;
  const hasBreakdown =
    rating &&
    CATEGORY_ROWS.some(({ key }) => typeof rating[key] === "number");

  const dial = (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "relative grid h-20 w-20 shrink-0 place-items-center rounded-full",
          typeof value === "number" ? scoreColor(value) : "text-muted-foreground",
        )}
        style={typeof value === "number" ? { background: ring } : undefined}
      >
        <div
          className={cn(
            "grid h-16 w-16 place-items-center rounded-full bg-card",
            typeof value !== "number" && "border border-border/60",
          )}
        >
          <span className="text-xl font-bold tabular-nums">{display}</span>
        </div>
      </div>
      <div className="text-xs">
        <div className="font-semibold">WolfRating</div>
        <div className="text-muted-foreground">0–100 score</div>
      </div>
    </div>
  );

  if (!hasBreakdown) return dial;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="cursor-help rounded-xl text-left outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/50"
            aria-label="Wolf Rating breakdown"
          >
            {dial}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          align="center"
          sideOffset={8}
          className="w-72 border border-border/60 bg-popover p-4 text-popover-foreground shadow-xl"
        >
          <WolfRatingBreakdown rating={rating} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------- Yahoo Fundamentals ----------

export function fmtNum(n, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  });
}
export function fmtMoney(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}
export function fmtBig(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${formatBig(n)}`;
}
export function fmtPct(n, scale = 100) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * scale).toFixed(2)}%`;
}
export function FundamentalsSections({
  f
}) {
  return <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"><Card title="Valuation" subtitle="Yahoo Finance"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="Trailing P/E" value={fmtNum(f.trailingPE)} /><Stat label="Forward P/E" value={fmtNum(f.forwardPE)} /><Stat label="PEG Ratio" value={fmtNum(f.pegRatio)} /><Stat label="Price / Book" value={fmtNum(f.priceToBook)} /><Stat label="Price / Sales" value={fmtNum(f.priceToSales)} /><Stat label="EV / EBITDA" value={fmtNum(f.evToEbitda)} /><Stat label="EV / Revenue" value={fmtNum(f.evToRevenue)} /><Stat label="Enterprise Value" value={fmtBig(f.enterpriseValue)} /><Stat label="Book Value" value={fmtMoney(f.bookValue)} /></div></Card><Card title="Profitability & Margins" subtitle="Trailing twelve months"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="Gross Margin" value={fmtPct(f.grossMargins)} /><Stat label="Operating Margin" value={fmtPct(f.operatingMargins)} /><Stat label="Profit Margin" value={fmtPct(f.profitMargins)} /><Stat label="Return on Equity" value={fmtPct(f.returnOnEquity)} /><Stat label="Return on Assets" value={fmtPct(f.returnOnAssets)} /><Stat label="Revenue Growth" value={fmtPct(f.revenueGrowth)} /><Stat label="Earnings Growth" value={fmtPct(f.earningsGrowth)} /><Stat label="EPS Q. Growth" value={fmtPct(f.earningsQuarterlyGrowth)} /><Stat label="Trailing EPS" value={fmtMoney(f.trailingEps)} /></div></Card><Card title="Income Statement" subtitle="Latest reported"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="Total Revenue" value={fmtBig(f.totalRevenue)} /><Stat label="EBITDA" value={fmtBig(f.ebitda)} /><Stat label="Net Income" value={fmtBig(f.netIncomeToCommon)} /><Stat label="Forward EPS" value={fmtMoney(f.forwardEps)} /><Stat label="Total Cash" value={fmtBig(f.totalCash)} /><Stat label="Total Debt" value={fmtBig(f.totalDebt)} /></div></Card><Card title="Balance Sheet & Risk" subtitle="Liquidity and leverage"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="Debt / Equity" value={fmtNum(f.debtToEquity)} /><Stat label="Current Ratio" value={fmtNum(f.currentRatio)} /><Stat label="Quick Ratio" value={fmtNum(f.quickRatio)} /><Stat label="Beta" value={fmtNum(f.beta)} /><Stat label="Short % Float" value={fmtPct(f.shortPercentOfFloat)} /><Stat label="Short Ratio" value={fmtNum(f.shortRatio)} /></div></Card><Card title="Dividends & Ownership" subtitle="Yields and holders"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="Dividend Yield" value={fmtPct(f.dividendYield, 100)} /><Stat label="Dividend Rate" value={fmtMoney(f.dividendRate)} /><Stat label="Payout Ratio" value={fmtPct(f.payoutRatio)} /><Stat label="Insiders Held" value={fmtPct(f.heldPercentInsiders)} /><Stat label="Institutions Held" value={fmtPct(f.heldPercentInstitutions)} /><Stat label="Avg Vol (3M)" value={f.averageDailyVolume3Month != null ? formatBig(f.averageDailyVolume3Month) : "—"} /></div></Card><Card title="Price Range & Targets" subtitle="52-week range and analyst targets"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="52W High" value={fmtMoney(f.fiftyTwoWeekHigh)} /><Stat label="52W Low" value={fmtMoney(f.fiftyTwoWeekLow)} /><Stat label="50-Day Avg" value={fmtMoney(f.fiftyDayAverage)} /><Stat label="200-Day Avg" value={fmtMoney(f.twoHundredDayAverage)} /><Stat label="Target Mean" value={fmtMoney(f.targetMeanPrice)} /><Stat label="Target High" value={fmtMoney(f.targetHighPrice)} /><Stat label="Target Low" value={fmtMoney(f.targetLowPrice)} /><Stat label="Analyst Rating" value={f.recommendationKey ? f.recommendationKey.replace(/_/g, " ") : "—"} /><Stat label="# Analysts" value={fmtNum(f.numberOfAnalystOpinions, 0)} /></div></Card></section>;
}
