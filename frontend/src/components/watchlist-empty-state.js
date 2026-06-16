import Link from "next/link";
import { WolfHeadIcon } from "@/icons/wolf-head-icon";
import { PanelSurface } from "@/components/panel-surface";

export function WatchlistEmptyState() {
  return (
    <PanelSurface className="p-10 text-center">
      <WolfHeadIcon muted className="mx-auto h-10 w-10" />
      <h2 className="mt-3 text-lg font-semibold">Your watchlist is empty</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Open the screener and tap the wolf icon next to any stock to add it here.
      </p>
      <Link
        href="/screener"
        className="mt-5 inline-flex rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        Browse stocks
      </Link>
    </PanelSurface>
  );
}
