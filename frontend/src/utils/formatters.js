export function fmtMoney(n) {
  const s = n < 0 ? "-" : "";
  return `${s}$${Math.abs(n).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

export function fmtPct(n) {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}
