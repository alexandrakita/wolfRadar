/** Mock Wolf Rating data until proprietary formula ships. */

import { STOCK_UNIVERSE } from "@/data/stock-universe";

const SECTORS = [...new Set(STOCK_UNIVERSE.map((r) => r.sector).filter(Boolean))].slice(0, 12);
const COUNTRIES = ["US", "US", "US", "US", "CA", "UK", "DE"];

function hashSym(sym) {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) >>> 0;
  return h;
}

export function mockWolfRating(sym) {
  const h = hashSym(sym);
  return 42 + (h % 55);
}

export function mockWolfRatingDelta(sym) {
  const h = hashSym(sym);
  const prev = 40 + (h % 50);
  const next = mockWolfRating(sym);
  return { prev, next, delta: next - prev };
}

const TOP_SYMBOLS = ["NVDA", "MSFT", "AAPL", "META", "AMZN", "GOOGL", "PLTR", "RKLB", "ZIM", "AMD", "CRM", "UBER"];

export function mockTopWolfRatingStocks(filters = {}) {
  let rows = TOP_SYMBOLS.map((sym, i) => {
    const meta = STOCK_UNIVERSE.find((r) => r.sym === sym);
    const rating = mockWolfRating(sym);
    return {
      sym,
      name: meta?.name ?? sym,
      sector: meta?.sector ?? "Technology",
      country: meta?.country ?? "US",
      price: 50 + (hashSym(sym) % 400),
      mktCap: (hashSym(sym) % 900 + 100) * 1e9,
      rating,
    };
  });

  if (filters.sector && filters.sector !== "all") {
    rows = rows.filter((r) => r.sector === filters.sector);
  }
  if (filters.country && filters.country !== "all") {
    rows = rows.filter((r) => r.country === filters.country);
  }
  if (filters.minPrice != null && filters.minPrice !== "") {
    rows = rows.filter((r) => r.price >= Number(filters.minPrice));
  }
  if (filters.maxPrice != null && filters.maxPrice !== "") {
    rows = rows.filter((r) => r.price <= Number(filters.maxPrice));
  }
  if (filters.minMktCap != null && filters.minMktCap !== "") {
    rows = rows.filter((r) => r.mktCap >= Number(filters.minMktCap) * 1e9);
  }

  return rows.sort((a, b) => b.rating - a.rating).slice(0, 8);
}

export function mockWhatsChangedToday() {
  const items = [
    { sym: "NVDA", kind: "Wolf Rating increase", detail: "74 → 88", type: "rating" },
    { sym: "PLTR", kind: "Major volume spike", detail: "3.2× avg volume", type: "volume" },
    { sym: "AAPL", kind: "Earnings release", detail: "Beat EPS estimates", type: "earnings" },
    { sym: "ZIM", kind: "Analyst upgrade", detail: "Hold → Buy", type: "analyst" },
    { sym: "RKLB", kind: "Wolf Rating increase", detail: "61 → 79", type: "rating" },
    { sym: "META", kind: "Dividend declared", detail: "$0.50 / share", type: "dividend" },
  ];
  return items.map((item) => ({
    ...item,
    name: STOCK_UNIVERSE.find((r) => r.sym === item.sym)?.name ?? item.sym,
    rating: mockWolfRating(item.sym),
  }));
}

export function mockUpcomingEvents() {
  const now = Date.now();
  const day = 86400000;
  return [
    { sym: "AAPL", type: "Earnings", date: new Date(now + day * 2).toISOString(), label: "Q2 earnings report" },
    { sym: "MSFT", type: "Ex-Dividend", date: new Date(now + day * 5).toISOString(), label: "Ex-dividend date" },
    { sym: "NVDA", type: "Earnings", date: new Date(now + day * 8).toISOString(), label: "Q1 earnings report" },
    { sym: "KO", type: "Dividend Payment", date: new Date(now + day * 12).toISOString(), label: "Quarterly dividend payment" },
    { sym: "META", type: "Dividend Declaration", date: new Date(now + day * 15).toISOString(), label: "Dividend declaration" },
    { sym: "TSLA", type: "Earnings", date: new Date(now + day * 18).toISOString(), label: "Q2 earnings report" },
  ].map((e) => ({
    ...e,
    name: STOCK_UNIVERSE.find((r) => r.sym === e.sym)?.name ?? e.sym,
  }));
}

export { SECTORS, COUNTRIES };
