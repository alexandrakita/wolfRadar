"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Check,
  X,
  Trash2,
  MoreVertical,
} from "lucide-react";

import { MAX_DASHBOARDS, WIDGET_CATALOG } from "@/constants/dashboard";
import { TOAST } from "@/constants/toast-messages";
import { AddWidgetDialog } from "@/components/dashboard/add-widget-dialog";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { defaultWidgetConfig } from "@/components/dashboard/widget-registry";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboards } from "@/hooks/use-dashboards";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function DashboardCommandCenter() {
  const {
    state,
    activeDashboard,
    ready,
    canCreateDashboard,
    createDashboard,
    deleteDashboard,
    renameDashboard,
    setActiveDashboard,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
  } = useDashboards();

  const [editMode, setEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const hasDashboards = state.dashboards.length > 0;
  const hasWidgets = (activeDashboard?.widgets?.length ?? 0) > 0;

  const handleCreate = () => {
    if (!canCreateDashboard) {
      toast.error(TOAST.dashboardLimitReached);
      return;
    }
    createDashboard();
    setEditMode(true);
    toast.success(TOAST.dashboardCreated);
  };

  const handleAddWidget = (type) => {
    if (!activeDashboard) return;
    addWidget(activeDashboard.id, type, defaultWidgetConfig(type));
    const title = WIDGET_CATALOG[type]?.title ?? "Widget";
    toast.success(TOAST.widgetAdded(title));
  };

  const requestRemoveWidget = (dashboardId, widgetId) => {
    const dashboard = state.dashboards.find((d) => d.id === dashboardId);
    const widget = dashboard?.widgets.find((w) => w.id === widgetId);
    const title = WIDGET_CATALOG[widget?.type]?.title ?? "Widget";
    setConfirmDelete({
      kind: "widget",
      dashboardId,
      widgetId,
      title,
    });
  };

  const requestDeleteDashboard = (dashboard) => {
    setConfirmDelete({
      kind: "dashboard",
      id: dashboard.id,
      name: dashboard.name,
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;

    if (confirmDelete.kind === "dashboard") {
      deleteDashboard(confirmDelete.id);
      toast.success(TOAST.dashboardDeleted(confirmDelete.name));
    } else if (confirmDelete.kind === "widget") {
      removeWidget(confirmDelete.dashboardId, confirmDelete.widgetId);
      toast.success(TOAST.widgetRemoved);
    }

    setConfirmDelete(null);
  };

  const handleRename = () => {
    const id = renameTargetId ?? activeDashboard?.id;
    if (!id || !renameValue.trim()) return;
    renameDashboard(id, renameValue);
    setRenameOpen(false);
    setRenameTargetId(null);
    toast.success(TOAST.dashboardRenamed);
  };

  const handleSwitchDashboard = (id) => {
    const dash = state.dashboards.find((d) => d.id === id);
    setActiveDashboard(id);
    if (dash && id !== state.activeId) {
      toast.info(TOAST.dashboardSwitched(dash.name));
    }
  };

  const finishEditing = () => {
    setEditMode(false);
  };

  const openRename = (dashboard) => {
    setRenameTargetId(dashboard.id);
    setRenameValue(dashboard.name);
    setRenameOpen(true);
  };

  const confirmTitle =
    confirmDelete?.kind === "dashboard"
      ? `Delete "${confirmDelete.name}"?`
      : confirmDelete?.kind === "widget"
        ? `Remove ${confirmDelete.title}?`
        : "Delete this item?";

  const confirmDescription =
    confirmDelete?.kind === "dashboard"
      ? "All widgets on this dashboard will be permanently removed."
      : confirmDelete?.kind === "widget"
        ? "This widget will be removed from your dashboard."
        : "This action cannot be undone.";

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasDashboards) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--gradient-primary)" }}
        >
          <LayoutGrid className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Your command center</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Start with a blank canvas. Add widgets for market snapshots, movers, portfolio,
          news, and Wolf Radar signals — all in one place.
        </p>
        <Button
          size="lg"
          className="mt-8 gap-2 px-8"
          onClick={handleCreate}
          disabled={!canCreateDashboard}
        >
          <Plus className="h-4 w-4" />
          Create New Dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeading
          title="Dashboard"
          description="What is happening today, best opportunities, and what changed since yesterday."
        />
        <div className="flex flex-wrap items-center gap-2">
          {editMode ? (
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={finishEditing}>
              <Check className="h-3.5 w-3.5" />
              Done editing
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditMode(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Customize
            </Button>
          )}
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add widget
          </Button>
          {canCreateDashboard ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCreate}>
              <Plus className="h-3.5 w-3.5" />
              New dashboard
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {state.dashboards.map((d) => {
            const isActive = d.id === state.activeId;
            return (
              <div
                key={d.id}
                className={cn(
                  "group flex items-center rounded-lg transition",
                  isActive ? "bg-primary/15" : "hover:bg-secondary/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSwitchDashboard(d.id)}
                  className={cn(
                    "rounded-lg py-2 pl-4 text-sm font-medium transition",
                    isActive ? "pr-1 text-foreground" : "pr-4 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d.name}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground",
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100 focus:opacity-100",
                      )}
                      aria-label={`${d.name} options`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => openRename(d)}>
                      <Pencil className="h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => requestDeleteDashboard(d)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete dashboard
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {isActive ? <span className="w-2 shrink-0" aria-hidden /> : null}
              </div>
            );
          })}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {state.dashboards.length}/{MAX_DASHBOARDS} dashboards
        </span>
      </div>

      {!hasWidgets ? (
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-8 text-center"
          style={{ background: "var(--gradient-card)" }}
        >
          <LayoutGrid className="mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Add your first widget</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Track indices, favorite tickers, movers, portfolio performance, news, and more.
          </p>
          <Button className="mt-6 gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add widget
          </Button>
        </div>
      ) : activeDashboard ? (
        <DashboardGrid
          dashboardId={activeDashboard.id}
          widgets={activeDashboard.widgets}
          editMode={editMode}
          onRemoveWidget={requestRemoveWidget}
          onUpdateWidget={updateWidget}
          onReorderWidgets={reorderWidgets}
        />
      ) : null}

      <AddWidgetDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAddWidget} />

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) setRenameTargetId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename dashboard</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Dashboard name"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title={confirmTitle}
        description={confirmDescription}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
