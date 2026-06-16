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

export function fmtVolLike(v) {
  if (v == null) return "—";
  if (typeof v === "string") return v || "—";
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
    return v.toFixed(0);
  }
  return "—";
}

export function fmtMoneyLike(v, digits = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

export function formatMktCapLabel(m) {
  if (m == null || !Number.isFinite(m)) return null;
  const abs = Math.abs(m);
  if (abs >= 1e12) return `${(m / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(m / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(m / 1e6).toFixed(2)}M`;
  return m.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatChip(label, v) {
  if (typeof v === "string") return v && v !== "Any" ? `${label}: ${v}` : null;
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

/** Legacy quote-only enrichment */
export function enrichStockRow(s, q) {
  return enrichStockRowFromMetrics(s, q);
}

/** Full enrichment from screener metrics or quote fallback */
export function enrichStockRowFromMetrics(s, m) {
  const mktCapNum = m?.mktCap ?? null;
  const volNum = m?.vol ?? null;
  return {
    ...s,
    staticExchange: s.sector,
    price: m?.price ?? m?.c ?? null,
    chg: m?.chg ?? m?.dp ?? null,
    vol: m?.volLabel ?? fmtVolLike(volNum),
    volNum,
    relVol: m?.relVol ?? null,
    avgVolume: m?.avgVolume ?? null,
    mktCap: m?.mktCapLabel ?? formatMktCapLabel(mktCapNum),
    mktCapNum,
    pe: m?.pe ?? null,
    ps: m?.ps ?? null,
    peg: m?.peg ?? null,
    eps: m?.eps ?? null,
    epsGrowth: m?.epsGrowth ?? null,
    revGrowth: m?.revenueGrowth ?? m?.revGrowth ?? null,
    divYield: m?.divYield ?? null,
    roe: m?.roe ?? null,
    beta: m?.beta ?? null,
    country: m?.country ?? null,
    exchange: m?.exchange ?? s.sector ?? null,
    sector: m?.sector ?? null,
    industry: m?.industry ?? null,
    fiftyTwoWeekHigh: m?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: m?.fiftyTwoWeekLow ?? null,
    high52wProximity: m?.high52wProximity ?? null,
    low52wProximity: m?.low52wProximity ?? null,
    perfDaily: m?.perfDaily ?? m?.chg ?? m?.dp ?? null,
    perfWeekly: m?.perfWeekly ?? null,
    perfMonthly: m?.perfMonthly ?? null,
    perf1M: m?.perf1M ?? null,
    perf3M: m?.perf3M ?? null,
    perfYtd: m?.perfYtd ?? null,
    logo: m?.logo ?? null,
    name: m?.longName ?? s.name,
  };
}
