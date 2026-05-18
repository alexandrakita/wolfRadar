"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * @param {{ symbol: string, src?: string | null, size?: "sm" | "lg", className?: string, alt?: string }} props
 */
export function StockAvatar({
  symbol,
  src,
  size = "sm",
  className = "",
  alt = "",
}) {
  const [failed, setFailed] = useState(false);
  const sym = String(symbol ?? "").toUpperCase();
  const url =
    src ||
    (sym
      ? `https://financialmodelingprep.com/image-stock/${encodeURIComponent(sym)}.png`
      : "");
  const box =
    size === "lg"
      ? "h-14 w-14 rounded-xl p-1 text-sm"
      : "h-8 w-8 rounded-lg p-0.5 text-[10px]";

  if (failed || !url || !sym) {
    return (
      <div
        className={`flex ${box} items-center justify-center font-semibold text-primary-foreground ${className}`}
        style={{ background: "var(--gradient-primary)" }}
      >
        {sym.slice(0, 2)}
      </div>
    );
  }

  const px = size === "lg" ? 56 : 32;

  return (
    <Image
      src={url}
      alt={alt || sym}
      width={px}
      height={px}
      unoptimized
      className={`${box} bg-secondary object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
