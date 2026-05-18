"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { cn } from "@/lib/utils";

export function DashboardPageShell({ children, mainClassName }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMobileMenu={toggle} />
        <main className={cn("flex-1 px-4 py-8 sm:px-6 lg:px-8", mainClassName)}>{children}</main>
      </div>
    </div>
  );
}
