import { cn } from "@/lib/utils";

export function PanelSurface({ children, className }) {
  return (
    <div
      className={cn("overflow-hidden rounded-2xl border border-border/60", className)}
      style={{
        background: "var(--gradient-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {children}
    </div>
  );
}
