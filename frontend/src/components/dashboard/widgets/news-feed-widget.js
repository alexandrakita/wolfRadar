"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { WidgetFrame } from "@/components/dashboard/widget-frame";
import { fetchMarketNews } from "@/services/api";
import { useWatchlist } from "@/hooks/use-watchlist";
import { screenerNewsUrl } from "@/utils/dashboard-links";

export function NewsFeedWidget(props) {
  const { list: watchlist } = useWatchlist();
  const symbols = watchlist.length ? watchlist.slice(0, 8) : ["AAPL", "NVDA", "MSFT", "TSLA"];

  const { data, isLoading } = useQuery({
    queryKey: ["market-news", symbols.join(",")],
    queryFn: () => fetchMarketNews(symbols, 12),
    refetchInterval: 5 * 60_000,
  });

  const items = data?.items ?? [];

  return (
    <WidgetFrame type="news-feed" {...props}>
      {isLoading ? (
        <div className="grid place-items-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !items.length ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No recent headlines</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={screenerNewsUrl(item.sym)}
                className="block py-3 transition hover:bg-secondary/20"
              >
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded bg-secondary/50 px-1.5 py-0.5 font-medium text-foreground">
                    {item.sym}
                  </span>
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>
                    {item.datetime
                      ? new Date(item.datetime * 1000).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">
                  {item.headline}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetFrame>
  );
}
