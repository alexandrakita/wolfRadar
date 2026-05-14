import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LineChart,
  Star,
  Bell,
  Wallet,
  Settings,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import wolfradarLogo from "@/assets/wolfradar.png";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Screener", url: "/screener", icon: LineChart },
  { title: "Watchlist", url: "/watchlist", icon: Star },
  { title: "Portfolio", url: "#", icon: Wallet },
  { title: "Alerts", url: "#", icon: Bell },
  { title: "Settings", url: "#", icon: Settings },
];

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-xl transition-all duration-300 md:flex md:flex-col",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-5">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <img
            src={wolfradarLogo}
            alt="WolfRadar"
            className="h-9 w-9 shrink-0 object-contain"
          />
          {!collapsed && (
            <span className="truncate text-lg font-semibold tracking-tight">
              Wolf<span className="text-accent">Radar</span>
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/40 text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const isInternal = item.url.startsWith("/");
          const active = isInternal && (item.url === "/" ? path === "/" : path.startsWith(item.url));
          const Cmp: any = isInternal ? Link : "a";
          const linkProps = isInternal ? { to: item.url } : { href: item.url };
          return (
            <Cmp
              key={item.title}
              {...linkProps}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
              style={active ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" } : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Cmp>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <Link
          to="/login"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </Link>
      </div>
    </aside>
  );
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  return { collapsed, toggle: () => setCollapsed((c) => !c) };
}
