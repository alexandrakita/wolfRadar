"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DashboardPerformancePanel({ chartData }) {
  return (
    <div
      className="rounded-2xl border border-border/60 p-5"
      style={{
        background: "var(--gradient-card)",
        boxShadow: "var(--shadow-card)",
      }}
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
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.16 175)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.62 0.22 270)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.3 0.025 262)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="d"
              stroke="oklch(0.7 0.02 260)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="oklch(0.7 0.02 260)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.21 0.025 262)",
                border: "1px solid oklch(0.3 0.025 262)",
                borderRadius: 12,
                color: "oklch(0.97 0.005 260)",
              }}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke="oklch(0.78 0.16 175)"
              strokeWidth={2.5}
              fill="url(#g1)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DashboardTrendingPanel({ symbols }) {
  return (
    <div
      className="rounded-2xl border border-border/60 p-5"
      style={{
        background: "var(--gradient-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Trending Stocks</h2>
          <p className="text-sm text-muted-foreground">Most active today</p>
        </div>
        <button type="button" className="text-xs text-accent hover:underline">
          View all
        </button>
      </div>
      <ul className="divide-y divide-border/60">
        {symbols.map((s) => {
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
                  <span
                    className={`text-xs font-medium tabular-nums ${up ? "text-accent" : "text-destructive"}`}
                  >
                    {up ? "+" : ""}
                    {s.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
