/**
 * Range filter: if min/max set, value must be a real number inside bounds.
 * Unknown / missing values do not pass (transparent — no fake fallbacks).
 */
export function numericRangeMatches(n, r) {
  if (!r) return true;
  const hasBound = !!(r.min?.trim() || r.max?.trim());
  if (!hasBound) return true;
  if (n == null || (typeof n === "number" && Number.isNaN(n))) return false;
  const num = Number(n);
  if (Number.isNaN(num)) return false;
  const min = r.min ? Number(r.min) : undefined;
  const max = r.max ? Number(r.max) : undefined;
  if (min !== undefined && !Number.isNaN(min) && num < min) return false;
  if (max !== undefined && !Number.isNaN(max) && num > max) return false;
  return true;
}

export function passesStockMarketFilters(row, applied) {
  const f = applied ?? {};
  if (!numericRangeMatches(row.price, f.price)) return false;
  if (!numericRangeMatches(row.chg, f.chg)) return false;
  if (!numericRangeMatches(row.pe, f.pe)) return false;
  if (!numericRangeMatches(row.epsGrowth, f.epsGrowth)) return false;
  if (!numericRangeMatches(row.mktCapNum, f.mktCap)) return false;
  return true;
}

export function fmtVolLike(v) {
  if (v == null) return "—";
  if (typeof v === "string") return v || "—";
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
  return "—";
}

export function fmtMoneyLike(v, digits = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

export function formatChip(label, v) {
  if (typeof v === "string") return v ? `${label}: ${v}` : null;
  const min = v.min?.trim();
  const max = v.max?.trim();
  if (!min && !max) return null;
  if (min && max) return `${label}: ${min}–${max}`;
  if (min) return `${label} ≥ ${min}`;
  return `${label} ≤ ${max}`;
}

export function compareStockRows(a, b, field, order) {
  const mul = order === "asc" ? 1 : -1;
  const tie = () => mul * (a.sym ?? "").localeCompare(b.sym ?? "");

  switch (field) {
    case "sym":
      return mul * (a.sym ?? "").localeCompare(b.sym ?? "");
    case "name":
      return mul * (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" });
    case "price":
    case "chg":
    case "pe":
    case "eps":
    case "epsGrowth":
    case "relVol": {
      const va = a[field];
      const vb = b[field];
      const na = Number.isFinite(va) ? va : null;
      const nb = Number.isFinite(vb) ? vb : null;
      if (na == null && nb == null) return tie();
      if (na == null) return 1;
      if (nb == null) return -1;
      return mul * (na - nb);
    }
    case "vol":
    case "mktCap":
      return mul * String(a[field] ?? "").localeCompare(String(b[field] ?? ""), undefined, { numeric: true });
    default:
      return 0;
  }
}

export function compareEtfRows(a, b, field, order) {
  const mul = order === "asc" ? 1 : -1;
  const tie = () => mul * (a.sym ?? "").localeCompare(b.sym ?? "");

  switch (field) {
    case "sym":
      return mul * (a.sym ?? "").localeCompare(b.sym ?? "");
    case "name":
      return mul * (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" });
    case "price":
    case "chg":
    case "expense":
    case "yld": {
      const va = a[field];
      const vb = b[field];
      const na = Number.isFinite(va) ? va : null;
      const nb = Number.isFinite(vb) ? vb : null;
      if (na == null && nb == null) return tie();
      if (na == null) return 1;
      if (nb == null) return -1;
      return mul * (na - nb);
    }
    case "aum":
      return mul * String(a.aum ?? "").localeCompare(String(b.aum ?? ""), undefined, { numeric: true });
    case "brand":
      return mul * String(a.brand ?? "").localeCompare(String(b.brand ?? ""));
    default:
      return 0;
  }
}

export function enrichStockRow(s, q) {
  return {
    ...s,
    price: q?.c ?? null,
    chg: q?.dp ?? null,
    vol: q?.volLabel ?? null,
    relVol: q?.relVol ?? null,
    mktCap: q?.mktCapLabel ?? null,
    mktCapNum: q?.mktCap ?? null,
    pe: q?.pe ?? null,
    eps: q?.eps ?? null,
    epsGrowth: q?.epsGrowth ?? null,
    logo: q?.logo ?? null,
    name: q?.longName ?? s.name,
  };
}
