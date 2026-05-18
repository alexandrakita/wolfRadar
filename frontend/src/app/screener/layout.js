import { Suspense } from "react";

export const metadata = {
  title: "Screener",
  description:
    "Stocks and ETFs screener with deep filters: price, market cap, P/E, sector, dividend yield, and more.",
};

export default function ScreenerLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
