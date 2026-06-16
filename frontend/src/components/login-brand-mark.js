import { BrandLogo } from "@/components/brand-logo";

export function LoginBrandMark({ size = "desktop" }) {
  const compact = size === "mobile";

  return (
    <div className="flex items-center gap-2">
      <BrandLogo size={compact ? "md" : "lg"} />
      {compact ? (
        <span className="text-lg font-semibold tracking-tight">
          Wolf<span className="text-accent">Radar</span>
        </span>
      ) : (
        <span className="text-2xl font-semibold tracking-tight">
          Wolf<span className="text-accent">Radar</span>
        </span>
      )}
    </div>
  );
}
