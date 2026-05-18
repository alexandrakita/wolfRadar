import { TrendingUp } from "lucide-react";

export function LoginBrandMark({ size = "desktop" }) {
  const compact = size === "mobile";
  return (
    <div className="flex items-center gap-2">
      <div
        className={compact ? "flex h-9 w-9 items-center justify-center rounded-xl" : "flex h-10 w-10 items-center justify-center rounded-xl"}
        style={{ background: "var(--gradient-primary)" }}
      >
        <TrendingUp className={compact ? "h-4 w-4 text-primary-foreground" : "h-5 w-5 text-primary-foreground"} />
      </div>
      {compact ? (
        <span className="text-lg font-semibold">Stockpillar</span>
      ) : (
        <span className="text-2xl font-semibold tracking-tight">
          Stock<span className="text-accent">pillar</span>
        </span>
      )}
    </div>
  );
}
