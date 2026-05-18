export async function generateMetadata({ params }) {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol || "").toUpperCase();
  return {
    title: sym,
    description: `Live quote, fundamentals, analyst ratings and news for ${sym}.`,
  };
}

export default function StockSymbolLayout({ children }) {
  return children;
}
