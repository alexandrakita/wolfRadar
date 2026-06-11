import { Suspense } from "react";

export const metadata = {
  title: "Screener",
  description:
    "Market indexes, stock screener, and ETF discovery with live Yahoo Finance data and deep filters.",
};

export default function ScreenerLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
