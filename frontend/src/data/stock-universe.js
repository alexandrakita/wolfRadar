// US exchange-listed universe (NASDAQ Trader Symbol Directory).
// Regenerate: npm run gen:universe (filters ETFs, test issues, obvious units/warrants).
// Only directory fields here — market metrics come from the backend (live quotes).

import RAW from "./stock-universe-data.json";

export const STOCK_UNIVERSE = RAW.map((r) => ({
  sym: r.sym,
  name: r.name,
  sector: r.sector,
}));
