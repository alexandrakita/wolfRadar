"use client";

import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { DashboardCommandCenter } from "@/components/dashboard/dashboard-command-center";

export default function Page() {
  return (
    <DashboardPageShell>
      <DashboardCommandCenter />
    </DashboardPageShell>
  );
}
