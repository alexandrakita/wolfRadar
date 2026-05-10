import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { ArrowDownRight, ArrowUpRight, DollarSign, Activity, BarChart3, Eye } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Stockpillar" },
      { name: "description", content: "Your stock screener overview: market metrics, performance, and trending tickers." },
    ],
  }),
  component: Dashboard,
});

const chartData = [
  { d: "Mon", v: 4200 }, { d: "Tue", v: 4380 }, { d: "Wed", v: 4310 },
  { d: "Thu", v: 4520 }, { d: "Fri", v: 4690 }, { d: "Sat", v: 4640 }, { d: "Sun", v: 4810 },
];

const metrics = [
  { label: "Portfolio Value", value: "$48,210", change: "+2.4%", up: true, icon: DollarSign },
  { label: "Day's P/L", value: "+$1,124", change: "+1.1%", up: true, icon: Activity },
  { label: "Volatility", value: "1.82", change: "-0.3%", up: false, icon: BarChart3 },
  { label: "Watchlist", value: "12", change: "+3 new", up: true, icon: Eye },
];

const trending = [
  { sym: "NVDA", name: "NVIDIA Corp", price: 924.30, change: 3.42 },
  { sym: "AAPL", name: "Apple Inc.", price: 213.55, change: 1.18 },
  { sym: "TSLA", name: "Tesla, Inc.", price: 248.90, change: -2.10 },
  { sym: "MSFT", name: "Microsoft", price: 432.18, change: 0.84 },
  { sym: "AMZN", name: "Amazon.com", price: 184.72, change: 2.05 },
  { sym: "META", name: "Meta Platforms", price: 498.11, change: -0.62 },
];

function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMobileMenu={() => setCollapsed((c) => !c)} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Market Overview</h1>
            <p className="mt-2 text-muted-foreground">
              Track your portfolio, screen stocks, and follow what's moving today.
            </p>
          </div>

          {/* Metrics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="group relative overflow-hidden rounded-2xl border border-border/60 p-5 transition hover:border-primary/40"
                style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-accent">
                    <m.icon className="h-4 w-4" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${m.up ? "text-accent" : "text-destructive"}`}>
                    {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {m.change}
                  </span>
                </div>
                <div className="mt-5 text-2xl font-semibold tracking-tight">{m.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </section>

          {/* Chart + Trending */}
          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="rounded-2xl border border-border/60 p-5"
              style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Performance</h2>
                  <p className="text-sm text-muted-foreground">Last 7 days</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold">$4,810</div>
                  <div className="text-xs text-accent">+14.5%</div>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.78 0.16 175)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.62 0.22 270)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="oklch(0.3 0.025 262)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="d" stroke="oklch(0.7 0.02 260)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.7 0.02 260)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.21 0.025 262)",
                        border: "1px solid oklch(0.3 0.025 262)",
                        borderRadius: 12,
                        color: "oklch(0.97 0.005 260)",
                      }}
                    />
                    <Area type="monotone" dataKey="v" stroke="oklch(0.78 0.16 175)" strokeWidth={2.5} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-2xl border border-border/60 p-5"
              style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Trending Stocks</h2>
                  <p className="text-sm text-muted-foreground">Most active today</p>
                </div>
                <button className="text-xs text-accent hover:underline">View all</button>
              </div>
              <ul className="divide-y divide-border/60">
                {trending.map((s) => {
                  const up = s.change >= 0;
                  return (
                    <li key={s.sym} className="flex items-center gap-3 py-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-primary-foreground"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {s.sym.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{s.sym}</span>
                          <span className="font-semibold tabular-nums">${s.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted-foreground">{s.name}</span>
                          <span className={`text-xs font-medium tabular-nums ${up ? "text-accent" : "text-destructive"}`}>
                            {up ? "+" : ""}{s.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
