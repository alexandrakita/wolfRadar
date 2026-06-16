import { cn } from "@/lib/utils";

const WOLF_SRC = "/icons/wolf-head-sm.png";

/**
 * Wolf head icon — white silhouette on black PNG; `screen` hides the black matte.
 * @param {{ className?: string, filled?: boolean, onPrimary?: boolean, muted?: boolean }} props
 */
export function WolfHeadIcon({
  className,
  filled = false,
  onPrimary = false,
  muted = false,
}) {
  let filter;
  let opacityClass;

  if (onPrimary) {
    filter = undefined;
    opacityClass = "opacity-100";
  } else if (filled) {
    filter = "sepia(1) saturate(5) hue-rotate(358deg) brightness(1.05)";
    opacityClass = "opacity-100";
  } else if (muted) {
    filter = "brightness(0.75)";
    opacityClass = "opacity-80";
  } else {
    filter = "grayscale(1) brightness(0.85)";
    opacityClass = "opacity-45";
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- screen blend needs raster matte
    <img
      src={WOLF_SRC}
      alt=""
      aria-hidden
      draggable={false}
      className={cn(
        "pointer-events-none shrink-0 select-none object-contain",
        opacityClass,
        className,
      )}
      style={{
        mixBlendMode: "screen",
        ...(filter ? { filter } : {}),
      }}
    />
  );
}
