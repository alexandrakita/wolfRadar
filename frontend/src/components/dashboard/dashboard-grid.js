"use client";

import { useCallback, useState } from "react";

import { widgetColClass } from "@/constants/dashboard";
import { WIDGET_COMPONENTS } from "@/components/dashboard/widget-registry";
import { cn } from "@/lib/utils";

export function DashboardGrid({
  dashboardId,
  widgets,
  editMode,
  onRemoveWidget,
  onUpdateWidget,
  onReorderWidgets,
}) {
  const [dragIndex, setDragIndex] = useState(null);

  const clearDrag = useCallback(() => setDragIndex(null), []);

  const handleDrop = useCallback(
    (toIndex) => {
      if (dragIndex == null) return;
      if (dragIndex !== toIndex) {
        onReorderWidgets(dashboardId, dragIndex, toIndex);
      }
      setDragIndex(null);
    },
    [dashboardId, dragIndex, onReorderWidgets],
  );

  if (!widgets.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-min">
      {widgets.map((widget, index) => {
        const Component = WIDGET_COMPONENTS[widget.type];
        if (!Component) return null;

        return (
          <div
            key={widget.id}
            className={cn(
              widgetColClass(widget.size),
              "min-h-[120px]",
              dragIndex === index && "opacity-50",
            )}
            onDragOver={(e) => {
              if (editMode) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
          >
            <Component
              editMode={editMode}
              size={widget.size}
              config={widget.config ?? {}}
              onConfigChange={(patch) =>
                onUpdateWidget(dashboardId, widget.id, {
                  config: { ...(widget.config ?? {}), ...patch },
                })
              }
              onRemove={() => onRemoveWidget(dashboardId, widget.id)}
              onResize={(size) => onUpdateWidget(dashboardId, widget.id, { size })}
              onDragStart={(e) => {
                if (!editMode) return;
                setDragIndex(index);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={clearDrag}
              onDragOver={(e) => {
                if (editMode) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDrop(index);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
