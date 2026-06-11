/**
 * Storage keys — same pattern as dashboard `localStorage` service.
 * @type {Record<string, string>}
 */
export const STORAGE_KEYS = {
  WATCHLIST: "stockycharts:watchlist",
  PORTFOLIO: "stockycharts:portfolio",
  DASHBOARDS: "stockycharts:dashboards",
  ALERTS: "stockycharts:alerts",
};

/** Same-window sync (storage event does not fire in the tab that wrote). */
export const SYNC_EVENTS = {
  WATCHLIST: "stockycharts:watchlist-change",
  PORTFOLIO: "stockycharts:portfolio-change",
  DASHBOARDS: "stockycharts:dashboards-change",
  ALERTS: "stockycharts:alerts-change",
};

const LEGACY_KEYS = {
  WATCHLIST: "wolfradar:watchlist",
  PORTFOLIO: "wolfradar:portfolio",
};

function isBrowser() {
  return typeof window !== "undefined";
}

function parseWatchlist(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((s) => typeof s === "string").map((s) => s.toUpperCase());
}

function parsePortfolio(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (h) =>
        h &&
        typeof h.sym === "string" &&
        typeof h.shares === "number" &&
        typeof h.avgCost === "number",
    )
    .map((h) => ({
      sym: h.sym.toUpperCase(),
      shares: h.shares,
      avgCost: h.avgCost,
      purchaseDate: typeof h.purchaseDate === "string" ? h.purchaseDate : undefined,
    }));
}

class LocalStorageService {
  /** @returns {unknown | null} */
  get(key) {
    if (!isBrowser()) return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  set(key, value) {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / privacy mode */
    }
  }

  /**
   * @param {string} key
   */
  remove(key) {
    if (!isBrowser()) return;
    localStorage.removeItem(key);
  }

  _emit(eventName) {
    if (!isBrowser()) return;
    window.dispatchEvent(new CustomEvent(eventName));
  }

  _migrateLegacyWatchlist() {
    if (!isBrowser()) return;
    try {
      if (localStorage.getItem(STORAGE_KEYS.WATCHLIST) != null) return;
      const raw = localStorage.getItem(LEGACY_KEYS.WATCHLIST);
      if (!raw) return;
      const parsed = parseWatchlist(JSON.parse(raw));
      localStorage.removeItem(LEGACY_KEYS.WATCHLIST);
      if (parsed.length) localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(parsed));
    } catch {
      /* ignore corrupt legacy */
    }
  }

  _migrateLegacyPortfolio() {
    if (!isBrowser()) return;
    try {
      if (localStorage.getItem(STORAGE_KEYS.PORTFOLIO) != null) return;
      const raw = localStorage.getItem(LEGACY_KEYS.PORTFOLIO);
      if (!raw) return;
      const parsed = parsePortfolio(JSON.parse(raw));
      localStorage.removeItem(LEGACY_KEYS.PORTFOLIO);
      localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(parsed));
    } catch {
      /* ignore corrupt legacy */
    }
  }

  /** @returns {string[]} */
  getWatchlist() {
    if (!isBrowser()) return [];
    this._migrateLegacyWatchlist();
    const row = this.get(STORAGE_KEYS.WATCHLIST);
    return parseWatchlist(row ?? []);
  }

  /** @param {string[]} symbols */
  setWatchlist(symbols) {
    const next = parseWatchlist(symbols);
    this.set(STORAGE_KEYS.WATCHLIST, next);
    this._emit(SYNC_EVENTS.WATCHLIST);
  }

  /** @param {string} sym */
  addWatchSymbol(sym) {
    const s = sym.toUpperCase();
    const cur = this.getWatchlist();
    if (!cur.includes(s)) this.setWatchlist([...cur, s]);
  }

  /** @param {string} sym */
  toggleWatchSymbol(sym) {
    const s = sym.toUpperCase();
    const cur = this.getWatchlist();
    const next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s];
    this.setWatchlist(next);
  }

  /** @param {string} sym */
  removeWatchSymbol(sym) {
    const s = sym.toUpperCase();
    const cur = this.getWatchlist();
    this.setWatchlist(cur.filter((x) => x !== s));
  }

  /** @returns {{ sym: string, shares: number, avgCost: number, purchaseDate?: string }[]} */
  getPortfolio() {
    if (!isBrowser()) return [];
    this._migrateLegacyPortfolio();
    const row = this.get(STORAGE_KEYS.PORTFOLIO);
    return parsePortfolio(row ?? []);
  }

  /** @param {{ sym: string, shares: number, avgCost: number, purchaseDate?: string }[]} rows */
  setPortfolio(rows) {
    const next = parsePortfolio(rows);
    this.set(STORAGE_KEYS.PORTFOLIO, next);
    this._emit(SYNC_EVENTS.PORTFOLIO);
  }

  /** @param {{ sym: string, shares: number, avgCost: number, purchaseDate?: string }} holding */
  upsertPortfolioHolding(holding) {
    const sym = holding.sym.toUpperCase();
    if (typeof holding.shares !== "number" || typeof holding.avgCost !== "number") return;
    const cur = this.getPortfolio();
    const idx = cur.findIndex((x) => x.sym === sym);
    const row = {
      sym,
      shares: holding.shares,
      avgCost: holding.avgCost,
      purchaseDate:
        typeof holding.purchaseDate === "string" ? holding.purchaseDate : undefined,
    };
    const next =
      idx >= 0 ? cur.map((x, i) => (i === idx ? row : x)) : [...cur, row];
    this.setPortfolio(next);
  }

  /** @param {string} sym */
  removePortfolioSymbol(sym) {
    const s = sym.toUpperCase();
    const cur = this.getPortfolio().filter((x) => x.sym !== s);
    this.setPortfolio(cur);
  }

  /** @returns {{ version: number, activeId: string | null, dashboards: object[] }} */
  getDashboardsState() {
    if (!isBrowser()) return { version: 1, activeId: null, dashboards: [] };
    const row = this.get(STORAGE_KEYS.DASHBOARDS);
    if (!row || typeof row !== "object") return { version: 1, activeId: null, dashboards: [] };
    const dashboards = Array.isArray(row.dashboards)
      ? row.dashboards.filter((d) => d && typeof d.id === "string" && typeof d.name === "string")
      : [];
    const activeId =
      typeof row.activeId === "string" && dashboards.some((d) => d.id === row.activeId)
        ? row.activeId
        : dashboards[0]?.id ?? null;
    return {
      version: 1,
      activeId,
      dashboards: dashboards.map((d) => ({
        id: d.id,
        name: d.name,
        widgets: Array.isArray(d.widgets)
          ? d.widgets.filter(
              (w) =>
                w &&
                typeof w.id === "string" &&
                typeof w.type === "string" &&
                w.type !== "alerts",
            )
          : [],
      })),
    };
  }

  /** @param {{ version: number, activeId: string | null, dashboards: object[] }} state */
  setDashboardsState(state) {
    const dashboards = (state.dashboards ?? []).slice(0, 3).map((d) => ({
      id: d.id,
      name: d.name,
      widgets: Array.isArray(d.widgets) ? d.widgets : [],
    }));
    const activeId =
      state.activeId && dashboards.some((d) => d.id === state.activeId)
        ? state.activeId
        : dashboards[0]?.id ?? null;
    this.set(STORAGE_KEYS.DASHBOARDS, { version: 1, activeId, dashboards });
    this._emit(SYNC_EVENTS.DASHBOARDS);
  }

  /** @returns {object[]} */
  getAlerts() {
    if (!isBrowser()) return [];
    const row = this.get(STORAGE_KEYS.ALERTS);
    return Array.isArray(row) ? row : [];
  }

  /** @param {object[]} rows */
  setAlerts(rows) {
    this.set(STORAGE_KEYS.ALERTS, Array.isArray(rows) ? rows : []);
    this._emit(SYNC_EVENTS.ALERTS);
  }
}

export const localStorageService = new LocalStorageService();
