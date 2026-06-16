import {
  LayoutDashboard,
  LineChart,
  Bell,
  Wallet,
  Settings,
  Zap,
} from "lucide-react";

import { WolfHeadIcon } from "@/icons/wolf-head-icon";

export const SIDEBAR_NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Screener", url: "/screener", icon: LineChart },
  { title: "Watchlist", url: "/watchlist", icon: WolfHeadIcon },
  { title: "Portfolio", url: "/portfolio", icon: Wallet },
  { title: "Wolf Signals", url: "/wolf-signals", icon: Zap },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Settings", url: "#", icon: Settings },
];
