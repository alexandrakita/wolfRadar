import { Bell, Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function DashboardHeader({ onMobileMenu }: { onMobileMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ticker, sector, or company…"
            className="h-10 rounded-full border-border/60 bg-secondary/40 pl-10"
          />
        </div>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
        </button>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
          aria-label="User"
        >
          AM
        </div>
      </div>
    </header>
  );
}
