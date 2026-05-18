import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricTile({ label, value, change, up, icon: Icon }) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border/60 p-5 transition hover:border-primary/40"
      style={{
        background: "var(--gradient-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            up ? "text-accent" : "text-destructive",
          )}
        >
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </span>
      </div>
      <div className="mt-5 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
