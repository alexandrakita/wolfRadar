import "./globals.css";

import { QueryProvider } from "@/contexts/query-provider";
import { RootLayoutClient } from "@/components/root-layout-client";

/** @type {import('next').Viewport} */
export const viewport = {
  themeColor: "#1b283d",
};

export const metadata = {
  title: {
    default: "WolfRadar",
    template: "%s · WolfRadar",
  },
  description: "Stock screener, watchlist, portfolio and fundamentals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </QueryProvider>
      </body>
    </html>
  );
}
