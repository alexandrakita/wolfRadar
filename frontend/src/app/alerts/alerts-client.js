"use client";

import { Bell } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { PageHeading } from "@/components/page-heading";
import { useAlerts } from "@/hooks/use-alerts";
import { TOAST } from "@/constants/toast-messages";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const { alerts, toggle, ready } = useAlerts();

  return (
    <DashboardPageShell>
      <PageHeading
        title="Alerts"
        description="Earnings reminders, dividend alerts, price targets, and watchlist notifications."
      />
      {!ready ? null : !alerts.length ? (
        <p className="text-muted-foreground">No alerts configured yet.</p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                "flex items-center justify-between gap-4 rounded-2xl border border-border/60 p-4",
                alert.active === false && "opacity-50",
              )}
              style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Bell className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="font-medium">{alert.sym}</div>
                  <div className="text-sm text-muted-foreground">{alert.label}</div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toggle(alert.id);
                  toast.success(
                    alert.active !== false ? TOAST.alertDisabled : TOAST.alertEnabled,
                  );
                }}
              >
                {alert.active !== false ? "Disable" : "Enable"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </DashboardPageShell>
  );
}
