import {
  LayoutDashboard,
  LineChart,
  Star,
  Bell,
  Wallet,
  Settings,
} from "lucide-react";

export const SIDEBAR_NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Screener", url: "/screener", icon: LineChart },
  { title: "Watchlist", url: "/watchlist", icon: Star },
  { title: "Portfolio", url: "/portfolio", icon: Wallet },
  { title: "Alerts", url: "#", icon: Bell },
  { title: "Settings", url: "#", icon: Settings },
];
