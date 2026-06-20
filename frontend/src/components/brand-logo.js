import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/wolf-radar-logo.png";
const ICON_SRC = "/icons/wolf-radar-icon.png";
const TEXT_SRC = "/icons/wolf-radar-text.png";

/** Full stacked wordmark — intrinsic 734×532 */
const LOGO_WIDTH = 734;
const LOGO_HEIGHT = 532;

/** Split crops from the same artwork */
const ICON_WIDTH = 484;
const ICON_HEIGHT = 304;
const TEXT_WIDTH = 722;
const TEXT_HEIGHT = 252;

const STACKED_SIZES = {
  sm: "h-7 w-auto max-w-[min(100%,9.5rem)]",
  md: "h-9 w-auto max-w-[min(100%,11.5rem)] sm:h-10",
  lg: "h-11 w-auto max-w-[min(100%,14rem)] sm:h-12",
  xl: "h-14 w-auto max-w-[min(100%,18rem)] sm:h-16",
  icon: "h-9 w-9 shrink-0",
};

const SPLIT_SIZES = {
  sm: { mark: "h-8 w-8", text: "h-5 w-auto max-w-[7.5rem]" },
  md: { mark: "h-9 w-9", text: "h-6 w-auto max-w-[8.5rem] sm:h-[1.65rem] sm:max-w-[9rem]" },
  lg: { mark: "h-10 w-10", text: "h-7 w-auto max-w-[10rem]" },
  icon: { mark: "h-9 w-9", text: null },
};

/**
 * Wolf Radar brand mark.
 * @param {"stacked" | "split"} [variant] — stacked = full logo; split = icon + letters (sidebar)
 */
export function BrandLogo({
  size = "md",
  variant = "stacked",
  className,
}) {
  if (variant === "split") {
    const s = SPLIT_SIZES[size] ?? SPLIT_SIZES.md;
    const iconOnly = size === "icon" || !s.text;

    return (
      <span
        className={cn(
          "inline-flex min-w-0 items-center",
          iconOnly ? "gap-0" : "gap-2",
          className,
        )}
      >
        <Image
          src={ICON_SRC}
          alt=""
          aria-hidden
          width={256}
          height={256}
          priority
          className={cn("shrink-0 object-contain", s.mark)}
        />
        {!iconOnly ? (
          <Image
            src={TEXT_SRC}
            alt="Wolf Radar"
            width={TEXT_WIDTH}
            height={TEXT_HEIGHT}
            priority
            className={cn("min-w-0 object-contain object-left", s.text)}
          />
        ) : null}
      </span>
    );
  }

  const isIcon = size === "icon";
  const sizeClass = STACKED_SIZES[size] ?? STACKED_SIZES.md;

  return (
    <Image
      src={isIcon ? ICON_SRC : LOGO_SRC}
      alt="Wolf Radar"
      width={isIcon ? 256 : LOGO_WIDTH}
      height={isIcon ? 256 : LOGO_HEIGHT}
      priority={size === "md" || size === "xl"}
      className={cn(
        "block select-none object-contain object-left",
        sizeClass,
        className,
      )}
    />
  );
}
