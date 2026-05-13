// Client-side helper. The Finnhub key now lives only on the server.
// All quote fetching goes through the cached `getQuotes` server function.
import { getQuotes, type FinnhubQuote } from "./quotes.functions";

export type { FinnhubQuote };

export async function fetchQuotes(symbols: string[]): Promise<Record<string, FinnhubQuote | null>> {
  if (!symbols.length) return {};
  // Server caps at 50 per request — chunk just in case.
  const out: Record<string, FinnhubQuote | null> = {};
  const chunk = 50;
  for (let i = 0; i < symbols.length; i += chunk) {
    const slice = symbols.slice(i, i + chunk);
    const res = await getQuotes({ data: { symbols: slice } });
    Object.assign(out, res.quotes);
  }
  return out;
}
