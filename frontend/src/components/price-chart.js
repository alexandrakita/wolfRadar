import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { fetchYahooChart } from "@/services/api";
import { cn } from "@/lib/utils";
const RANGES = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"];
export function PriceChart({
  symbol
}) {
  const [range, setRange] = useState("1M");
  const {
    data,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ["chart", symbol, range],
    queryFn: () => fetchYahooChart(symbol, range),
    staleTime: range === "1D" ? 30_000 : 5 * 60_000
  });
  const chartPoints = data?.points;
  const points = useMemo(() => chartPoints ?? [], [chartPoints]);
  const {
    first,
    last,
    up
  } = useMemo(() => {
    if (!points.length) return {
      first: 0,
      last: 0,
      up: true
    };
    const f = points[0].c;
    const l = points[points.length - 1].c;
    return {
      first: f,
      last: l,
      up: l >= f
    };
  }, [points]);
  const change = last - first;
  const changePct = first > 0 ? change / first * 100 : 0;
  const fmtTick = t => {
    const d = new Date(t);
    if (range === "1D") return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    if (range === "5D") return d.toLocaleDateString([], {
      weekday: "short"
    });
    if (range === "5Y") return String(d.getFullYear());
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric"
    });
  };
  const stroke = up ? "oklch(0.78 0.16 175)" : "oklch(0.62 0.22 25)";
  return <div className="rounded-2xl border border-border/60 p-5" style={{
    background: "var(--gradient-card)",
    boxShadow: "var(--shadow-card)"
  }}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{"Price Chart"}</h2><p className="text-xs text-muted-foreground">{points.length ? `${points.length} data points · ${range}` : "Historical price"}</p></div><div className="flex items-center gap-4">{points.length ? <div className={cn("flex items-center gap-1 text-sm font-medium tabular-nums", up ? "text-accent" : "text-destructive")}>{up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{up ? "+" : ""}{change.toFixed(2)}{" ("}{up ? "+" : ""}{changePct.toFixed(2)}{"%)"}</div> : null}<div className="flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/40 p-1">{RANGES.map(r => <button key={r} type="button" onClick={() => setRange(r)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition", r === range ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground")}>{r}</button>)}</div></div></div><div className="relative h-64 w-full">{isLoading ? <div className="absolute inset-0 grid place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div> : !points.length ? <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{"No chart data available"}</div> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={points} margin={{
          top: 10,
          right: 10,
          left: -10,
          bottom: 0
        }}><defs><linearGradient id={`pc-${symbol}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={stroke} stopOpacity={0.4} /><stop offset="100%" stopColor={stroke} stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="oklch(0.3 0.025 262)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="t" stroke="oklch(0.7 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtTick} minTickGap={40} /><YAxis stroke="oklch(0.7 0.02 260)" fontSize={11} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={v => `$${v.toFixed(0)}`} width={50} /><Tooltip contentStyle={{
            background: "oklch(0.21 0.025 262)",
            border: "1px solid oklch(0.3 0.025 262)",
            borderRadius: 12,
            color: "oklch(0.97 0.005 260)"
          }} labelFormatter={t => new Date(t).toLocaleString()} formatter={value => [`$${value.toFixed(2)}`, "Price"]} /><Area type="monotone" dataKey="c" stroke={stroke} strokeWidth={2} fill={`url(#pc-${symbol})`} isAnimationActive={false} /></AreaChart></ResponsiveContainer>}{isFetching && !isLoading ? <Loader2 className="absolute right-2 top-2 h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}</div></div>;
}
