"use client";

import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { PageHeading } from "@/components/page-heading";
import { WatchlistEmptyState } from "@/components/watchlist-empty-state";
import { WatchlistTable } from "@/components/watchlist-table";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useQuotes } from "@/hooks/use-quotes";

export default function Page() {
  const { list } = useWatchlist();
  const { quotes } = useQuotes(list);
  return (
    <DashboardPageShell>
      <PageHeading
        title="Watchlist"
        description={`${list.length} ${list.length === 1 ? "stock" : "stocks"} you're tracking. Tap the star anywhere to add or remove.`}
      />
      {list.length === 0 ? (
        <WatchlistEmptyState />
      ) : (
        <WatchlistTable symbols={list} quotesBySym={quotes} />
      )}
    </DashboardPageShell>
  );
}

