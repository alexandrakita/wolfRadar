import { useEffect, useState } from "react";
import { fetchQuotes, type FinnhubQuote } from "@/lib/finnhub";

export function useQuotes(symbols: string[], refreshMs = 60_000) {
  const key = symbols.join(",");
  const [quotes, setQuotes] = useState<Record<string, FinnhubQuote | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const data = await fetchQuotes(symbols);
        if (alive) setQuotes(data);
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    const id = setInterval(run, refreshMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshMs]);

  return { quotes, loading };
}
