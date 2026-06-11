"use client";

import { SlidersHorizontal, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCREENER_PAGE_LIMIT_OPTIONS } from "@/utils/screener-search-params";
import {
  FilterField,
  RangeFilter,
  SelectFilter,
} from "./filter-widgets";

export function ScreenerFiltersBar({
  isStocks,
  quickSearch,
  onQuickSearchChange,
  filtersOpen,
  onFiltersOpenChange,
  fields,
  draft,
  setDraft,
  applied,
  setApplied,
  onPageReset,
  pageSize,
  onPageSizeChange,
  chips,
  onRemoveChip,
  onClearFilters,
}) {
  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 bg-background/80 pl-9"
            placeholder="Search symbol or name…"
            value={quickSearch}
            onChange={(e) => onQuickSearchChange(e.target.value)}
            aria-label="Search table"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog
            open={filtersOpen}
            onOpenChange={(o) => {
              onFiltersOpenChange(o);
              if (o) setDraft(applied);
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="gap-2 text-primary-foreground"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-h-[85vh] max-w-3xl overflow-y-auto border-border/60"
              style={{ background: "var(--gradient-card)" }}
            >
              <DialogHeader>
                <DialogTitle>{isStocks ? "Stock filters" : "ETF filters"}</DialogTitle>
                <DialogDescription>
                  Narrow the universe. Empty fields mean &quot;any&quot;. Stocks: price / change /
                  valuation filters use{" "}
                  <span className="font-medium text-foreground">live quotes only</span> (no
                  placeholder numbers).
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2 md:grid-cols-3">
                {(fields ?? []).map((f) => (
                  <FilterField key={f.key} label={f.label}>
                    {f.type === "select" ? (
                      <SelectFilter
                        value={draft[f.key] ?? ""}
                        onChange={(v) => setDraft({ ...draft, [f.key]: v })}
                        options={f.options ?? []}
                        placeholder={f.placeholder}
                      />
                    ) : (
                      <RangeFilter
                        value={draft[f.key]}
                        onChange={(v) => setDraft({ ...draft, [f.key]: v })}
                      />
                    )}
                  </FilterField>
                ))}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setDraft({})}>
                  Reset
                </Button>
                <Button
                  className="text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                  onClick={() => {
                    setApplied(draft);
                    onFiltersOpenChange(false);
                    onPageReset();
                  }}
                >
                  Apply filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-10 w-[130px] bg-background/80">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {SCREENER_PAGE_LIMIT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Badge
              key={c.key}
              variant="secondary"
              className="gap-1 rounded-full bg-secondary/60 px-3 py-1 text-xs"
            >
              {c.text}
              <button
                type="button"
                onClick={() => onRemoveChip(c.key)}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${c.text}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </>
  );
}
