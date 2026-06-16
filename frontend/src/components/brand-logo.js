import { WolfHeadIcon } from "@/icons/wolf-head-icon";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4 scale-[1.45]" },
  md: { box: "h-9 w-9 rounded-lg", icon: "h-4 w-4 scale-[1.55]" },
  lg: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5 scale-[1.5]" },
};

/** Wolf Radar mark — gradient tile + wolf silhouette. */
export function BrandLogo({ size = "md", className }) {
  const s = SIZES[size] ?? SIZES.md;

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center overflow-hidden", s.box, className)}
      style={{ background: "var(--gradient-primary)" }}
      aria-hidden
    >
      <WolfHeadIcon onPrimary className={s.icon} />
    </div>
  );
}
