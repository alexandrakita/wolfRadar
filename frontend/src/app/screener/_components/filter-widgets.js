"use client";

import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FilterField({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-[10px] text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

export function SelectFilter({ value, onChange, options, placeholder }) {
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v === "__any" ? "" : v)}>
      <SelectTrigger className="h-9 bg-background/40">
        <SelectValue placeholder={placeholder ?? "Any"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__any">Any</SelectItem>
        {options
          .filter((o) => o !== "Any")
          .map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

export function TextFilter({ value, onChange, placeholder }) {
  return (
    <Input
      className="h-9 bg-background/40"
      placeholder={placeholder ?? "Any"}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

const OPERATORS = [
  { value: "gt", label: "Greater than" },
  { value: "lt", label: "Less than" },
  { value: "eq", label: "Equal to" },
  { value: "between", label: "Between" },
];

export function RangeFilter({ value, onChange }) {
  const op = value?.op ?? "between";

  return (
    <div className="space-y-2">
      <Select
        value={op}
        onValueChange={(v) => onChange({ ...value, op: v, min: value?.min ?? "", max: value?.max ?? "" })}
      >
        <SelectTrigger className="h-8 bg-background/40 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {op === "between" ? (
        <div className="flex items-center gap-2">
          <Input
            className="h-9 bg-background/40"
            placeholder="Min"
            value={value?.min ?? ""}
            onChange={(e) => onChange({ ...value, op, min: e.target.value })}
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            className="h-9 bg-background/40"
            placeholder="Max"
            value={value?.max ?? ""}
            onChange={(e) => onChange({ ...value, op, max: e.target.value })}
          />
        </div>
      ) : op === "eq" ? (
        <Input
          className="h-9 bg-background/40"
          placeholder="Value"
          value={value?.min ?? ""}
          onChange={(e) => onChange({ ...value, op, min: e.target.value, max: "" })}
        />
      ) : op === "gt" ? (
        <Input
          className="h-9 bg-background/40"
          placeholder="Greater than"
          value={value?.min ?? ""}
          onChange={(e) => onChange({ ...value, op, min: e.target.value, max: "" })}
        />
      ) : (
        <Input
          className="h-9 bg-background/40"
          placeholder="Less than"
          value={value?.max ?? ""}
          onChange={(e) => onChange({ ...value, op, max: e.target.value, min: "" })}
        />
      )}
    </div>
  );
}

export function SortIndicator({ active, order }) {
  if (!active) {
    return (
      <span className="ml-1 inline-flex flex-col opacity-40">
        <ChevronDown className="h-3 w-3 -mb-1.5 rotate-180" />
        <ChevronDown className="h-3 w-3" />
      </span>
    );
  }
  return (
    <ChevronDown
      className={`ml-1 h-3.5 w-3.5 shrink-0 text-primary transition-transform duration-200 ${order === "asc" ? "rotate-180" : ""}`}
    />
  );
}
