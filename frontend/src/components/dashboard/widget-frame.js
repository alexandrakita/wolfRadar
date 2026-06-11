"use client";

import { GripVertical, Maximize2, Minimize2, Trash2 } from "lucide-react";

import { WIDGET_CATALOG, WIDGET_SIZES } from "@/constants/dashboard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function WidgetFrame({
  type,
  title,
  subtitle,
  editMode,
  size,
  onRemove,
  onResize,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  badge,
  children,
  className,
}) {
  const meta = WIDGET_CATALOG[type];
  const heading = title ?? meta?.title ?? "Widget";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 transition",
        editMode && "ring-1 ring-primary/30",
        className,
      )}
      style={{
        background: "var(--gradient-card)",
        boxShadow: "var(--shadow-card)",
      }}
      draggable={editMode}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <header className="flex items-start gap-2 border-b border-border/40 px-4 py-3">
        {editMode ? (
          <button
            type="button"
            className="mt-0.5 cursor-grab text-muted-foreground active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{heading}</h3>
            {badge}
            {meta?.live === false ? (
              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-400">
                Mock Wolf Rating
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : meta?.description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {meta.description}
            </p>
          ) : null}
        </div>
        {editMode ? (
          <div className="flex shrink-0 items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {size === "sm" ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {WIDGET_SIZES.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => onResize?.(s)}>
                    {s === size ? "✓ " : ""}
                    {s.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 p-4">{children}</div>
    </article>
  );
}
