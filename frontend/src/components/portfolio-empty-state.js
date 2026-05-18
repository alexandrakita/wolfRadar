"use client";

import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelSurface } from "@/components/panel-surface";

export function PortfolioEmptyState({ onAddHolding }) {
  return (
    <PanelSurface className="p-10 text-center">
      <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/50" />
      <h2 className="mt-3 text-lg font-semibold">No holdings yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a ticker, shares, and average buy price to start tracking your portfolio.
      </p>
      <Button
        type="button"
        onClick={onAddHolding}
        className="mt-5 text-primary-foreground"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add your first holding
      </Button>
    </PanelSurface>
  );
}
