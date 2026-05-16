import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Holding } from "@/hooks/use-portfolio";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (h: Holding) => void;
  initial?: Holding | null;
};

export function AddHoldingDialog({ open, onOpenChange, onSubmit, initial }: Props) {
  const [sym, setSym] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSym(initial?.sym ?? "");
      setShares(initial ? String(initial.shares) : "");
      setAvgCost(initial ? String(initial.avgCost) : "");
      setErr(null);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = sym.trim().toUpperCase();
    const sh = Number(shares);
    const ac = Number(avgCost);
    if (!s || !/^[A-Z.\-]{1,10}$/.test(s)) return setErr("Enter a valid ticker");
    if (!Number.isFinite(sh) || sh <= 0) return setErr("Shares must be > 0");
    if (!Number.isFinite(ac) || ac <= 0) return setErr("Avg buy price must be > 0");
    onSubmit({ sym: s, shares: sh, avgCost: ac });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit holding" : "Add holding"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sym">Ticker</Label>
            <Input
              id="sym"
              value={sym}
              onChange={(e) => setSym(e.target.value.toUpperCase())}
              placeholder="AAPL"
              disabled={!!initial}
              autoFocus={!initial}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="shares">Shares</Label>
              <Input id="shares" type="number" step="any" min="0" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avg">Avg buy price</Label>
              <Input id="avg" type="number" step="any" min="0" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} placeholder="150.00" />
            </div>
          </div>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              className="text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              {initial ? "Save" : "Add holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
