"use client";

import { useId, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

import { fetchYahooChart } from "@/services/api";
import { cn } from "@/lib/utils";

export function MiniSparkChart({ symbol, range = "5D", className, height = 56 }) {
  const gradientId = useId().replace(/:/g, "");
  const { data, isLoading } = useQuery({
    queryKey: ["spark", symbol, range],
    queryFn: () => fetchYahooChart(symbol, range),
    staleTime: 60_000,
    enabled: !!symbol,
  });

  const points = useMemo(() => data?.points ?? [], [data?.points]);
  const up = useMemo(() => {
    if (points.length < 2) return true;
    return points[points.length - 1].c >= points[0].c;
  }, [points]);

  const stroke = up ? "oklch(0.78 0.16 175)" : "oklch(0.62 0.22 25)";

  if (isLoading) {
    return (
      <div className={cn("grid place-items-center text-muted-foreground", className)} style={{ height }}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!points.length) {
    return (
      <div
        className={cn("grid place-items-center text-xs text-muted-foreground", className)}
        style={{ height }}
      >
        No data
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="c"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
