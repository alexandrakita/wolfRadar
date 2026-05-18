"use client";

import { useMemo } from "react";
import { DollarSign, Activity, BarChart3, Eye } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { PageHeading } from "@/components/page-heading";
import { MetricTile } from "@/components/metric-tile";
import {
  DashboardPerformancePanel,
  DashboardTrendingPanel,
} from "@/components/dashboard-home-panels";
import { useQuotes } from "@/hooks/use-quotes";

const chartData = [
  { d: "Mon", v: 4200 },
  { d: "Tue", v: 4380 },
  { d: "Wed", v: 4310 },
  { d: "Thu", v: 4520 },
  { d: "Fri", v: 4690 },
  { d: "Sat", v: 4640 },
  { d: "Sun", v: 4810 },
];

const TRENDING = [
  { sym: "NVDA", name: "NVIDIA Corp" },
  { sym: "AAPL", name: "Apple Inc." },
  { sym: "TSLA", name: "Tesla, Inc." },
  { sym: "MSFT", name: "Microsoft" },
  { sym: "AMZN", name: "Amazon.com" },
  { sym: "META", name: "Meta Platforms" },
];

export default function Page() {
  const { quotes } = useQuotes(TRENDING.map((t) => t.sym));
  const trending = TRENDING.map((t) => {
    const q = quotes[t.sym];
    return {
      ...t,
      price: q?.c ?? 0,
      change: q?.dp ?? 0,
    };
  });

  const metrics = useMemo(() => {
    const list = Object.values(quotes).filter(Boolean);
    const avgChange = list.length ? list.reduce((s, q) => s + q.dp, 0) / list.length : 0;
    const gainers = list.filter((q) => q.dp >= 0).length;
    const portfolio = list.reduce((s, q) => s + q.c * 10, 0);
    const dayPL = list.reduce((s, q) => s + q.d * 10, 0);
    return [
      {
        label: "Portfolio Value",
        value: portfolio
          ? `$${portfolio.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          : "—",
        change: `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`,
        up: avgChange >= 0,
        icon: DollarSign,
      },
      {
        label: "Day's P/L",
        value: dayPL
          ? `${dayPL >= 0 ? "+" : ""}$${Math.abs(dayPL).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          : "—",
        change: `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`,
        up: dayPL >= 0,
        icon: Activity,
      },
      {
        label: "Gainers / Losers",
        value: list.length ? `${gainers} / ${list.length - gainers}` : "—",
        change: `${list.length} tracked`,
        up: gainers >= list.length / 2,
        icon: BarChart3,
      },
      {
        label: "Watchlist",
        value: String(TRENDING.length),
        change: "live",
        up: true,
        icon: Eye,
      },
    ];
  }, [quotes]);

  return (
    <DashboardPageShell>
      <PageHeading
        title="Market Overview"
        description="Track your portfolio, screen stocks, and follow what's moving today."
      />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricTile key={m.label} {...m} />
        ))}
      </section>
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardPerformancePanel chartData={chartData} />
        <DashboardTrendingPanel symbols={trending} />
      </section>
    </DashboardPageShell>
  );
}
