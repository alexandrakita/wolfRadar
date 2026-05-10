// Large list of well-known US-listed stocks. Symbol + name + sector.
// Static numeric fields (vol/relVol/mktCap/pe/eps/epsGrowth) are derived
// deterministically so the UI is stable; live price + chg come from Finnhub.

export type StockUniverseRow = {
  sym: string;
  name: string;
  sector: string;
  price: number;
  chg: number;
  vol: string;
  relVol: number;
  mktCap: string;
  pe: number;
  eps: number;
  epsGrowth: number;
};

const RAW: { sym: string; name: string; sector: string }[] = [
  { sym: "NVDA", name: "NVIDIA Corporation", sector: "Electronic Technology" },
  { sym: "AAPL", name: "Apple Inc.", sector: "Electronic Technology" },
  { sym: "MSFT", name: "Microsoft Corporation", sector: "Technology Services" },
  { sym: "GOOGL", name: "Alphabet Inc. Class A", sector: "Technology Services" },
  { sym: "GOOG", name: "Alphabet Inc. Class C", sector: "Technology Services" },
  { sym: "AMZN", name: "Amazon.com, Inc.", sector: "Retail Trade" },
  { sym: "META", name: "Meta Platforms, Inc.", sector: "Technology Services" },
  { sym: "TSLA", name: "Tesla, Inc.", sector: "Consumer Durables" },
  { sym: "AVGO", name: "Broadcom Inc.", sector: "Electronic Technology" },
  { sym: "BRK.B", name: "Berkshire Hathaway Inc.", sector: "Finance" },
  { sym: "JPM", name: "JPMorgan Chase & Co.", sector: "Finance" },
  { sym: "V", name: "Visa Inc.", sector: "Commercial Services" },
  { sym: "MA", name: "Mastercard Incorporated", sector: "Commercial Services" },
  { sym: "UNH", name: "UnitedHealth Group", sector: "Health Services" },
  { sym: "XOM", name: "Exxon Mobil Corporation", sector: "Energy Minerals" },
  { sym: "WMT", name: "Walmart Inc.", sector: "Retail Trade" },
  { sym: "LLY", name: "Eli Lilly and Company", sector: "Health Technology" },
  { sym: "PG", name: "Procter & Gamble", sector: "Consumer Non-Durables" },
  { sym: "JNJ", name: "Johnson & Johnson", sector: "Health Technology" },
  { sym: "HD", name: "The Home Depot, Inc.", sector: "Retail Trade" },
  { sym: "ORCL", name: "Oracle Corporation", sector: "Technology Services" },
  { sym: "COST", name: "Costco Wholesale", sector: "Retail Trade" },
  { sym: "ABBV", name: "AbbVie Inc.", sector: "Health Technology" },
  { sym: "BAC", name: "Bank of America", sector: "Finance" },
  { sym: "CVX", name: "Chevron Corporation", sector: "Energy Minerals" },
  { sym: "KO", name: "The Coca-Cola Company", sector: "Consumer Non-Durables" },
  { sym: "MRK", name: "Merck & Co., Inc.", sector: "Health Technology" },
  { sym: "PEP", name: "PepsiCo, Inc.", sector: "Consumer Non-Durables" },
  { sym: "ADBE", name: "Adobe Inc.", sector: "Technology Services" },
  { sym: "NFLX", name: "Netflix, Inc.", sector: "Communications" },
  { sym: "CRM", name: "Salesforce, Inc.", sector: "Technology Services" },
  { sym: "AMD", name: "Advanced Micro Devices", sector: "Electronic Technology" },
  { sym: "TMO", name: "Thermo Fisher Scientific", sector: "Health Technology" },
  { sym: "ACN", name: "Accenture plc", sector: "Technology Services" },
  { sym: "MCD", name: "McDonald's Corporation", sector: "Consumer Services" },
  { sym: "LIN", name: "Linde plc", sector: "Process Industries" },
  { sym: "CSCO", name: "Cisco Systems, Inc.", sector: "Electronic Technology" },
  { sym: "ABT", name: "Abbott Laboratories", sector: "Health Technology" },
  { sym: "WFC", name: "Wells Fargo & Company", sector: "Finance" },
  { sym: "DIS", name: "The Walt Disney Company", sector: "Consumer Services" },
  { sym: "DHR", name: "Danaher Corporation", sector: "Health Technology" },
  { sym: "VZ", name: "Verizon Communications", sector: "Communications" },
  { sym: "INTC", name: "Intel Corporation", sector: "Electronic Technology" },
  { sym: "TXN", name: "Texas Instruments", sector: "Electronic Technology" },
  { sym: "PM", name: "Philip Morris International", sector: "Consumer Non-Durables" },
  { sym: "NKE", name: "NIKE, Inc.", sector: "Consumer Non-Durables" },
  { sym: "QCOM", name: "QUALCOMM Incorporated", sector: "Electronic Technology" },
  { sym: "INTU", name: "Intuit Inc.", sector: "Technology Services" },
  { sym: "IBM", name: "International Business Machines", sector: "Technology Services" },
  { sym: "GE", name: "General Electric Company", sector: "Producer Manufacturing" },
  { sym: "RTX", name: "RTX Corporation", sector: "Electronic Technology" },
  { sym: "CAT", name: "Caterpillar Inc.", sector: "Producer Manufacturing" },
  { sym: "SPGI", name: "S&P Global Inc.", sector: "Commercial Services" },
  { sym: "GS", name: "The Goldman Sachs Group", sector: "Finance" },
  { sym: "MS", name: "Morgan Stanley", sector: "Finance" },
  { sym: "AMGN", name: "Amgen Inc.", sector: "Health Technology" },
  { sym: "ISRG", name: "Intuitive Surgical, Inc.", sector: "Health Technology" },
  { sym: "BKNG", name: "Booking Holdings Inc.", sector: "Consumer Services" },
  { sym: "T", name: "AT&T Inc.", sector: "Communications" },
  { sym: "LOW", name: "Lowe's Companies, Inc.", sector: "Retail Trade" },
  { sym: "BA", name: "The Boeing Company", sector: "Electronic Technology" },
  { sym: "BLK", name: "BlackRock, Inc.", sector: "Finance" },
  { sym: "AXP", name: "American Express Company", sector: "Finance" },
  { sym: "DE", name: "Deere & Company", sector: "Producer Manufacturing" },
  { sym: "SBUX", name: "Starbucks Corporation", sector: "Consumer Services" },
  { sym: "GILD", name: "Gilead Sciences, Inc.", sector: "Health Technology" },
  { sym: "MDT", name: "Medtronic plc", sector: "Health Technology" },
  { sym: "PFE", name: "Pfizer Inc.", sector: "Health Technology" },
  { sym: "C", name: "Citigroup Inc.", sector: "Finance" },
  { sym: "CMCSA", name: "Comcast Corporation", sector: "Communications" },
  { sym: "ADP", name: "Automatic Data Processing", sector: "Technology Services" },
  { sym: "MDLZ", name: "Mondelez International", sector: "Consumer Non-Durables" },
  { sym: "TMUS", name: "T-Mobile US, Inc.", sector: "Communications" },
  { sym: "HON", name: "Honeywell International", sector: "Producer Manufacturing" },
  { sym: "UPS", name: "United Parcel Service", sector: "Transportation" },
  { sym: "ELV", name: "Elevance Health, Inc.", sector: "Health Services" },
  { sym: "PLD", name: "Prologis, Inc.", sector: "Finance" },
  { sym: "AMAT", name: "Applied Materials, Inc.", sector: "Producer Manufacturing" },
  { sym: "LRCX", name: "Lam Research Corporation", sector: "Producer Manufacturing" },
  { sym: "MU", name: "Micron Technology, Inc.", sector: "Electronic Technology" },
  { sym: "PANW", name: "Palo Alto Networks", sector: "Technology Services" },
  { sym: "NOW", name: "ServiceNow, Inc.", sector: "Technology Services" },
  { sym: "SHOP", name: "Shopify Inc.", sector: "Technology Services" },
  { sym: "SNOW", name: "Snowflake Inc.", sector: "Technology Services" },
  { sym: "PYPL", name: "PayPal Holdings, Inc.", sector: "Commercial Services" },
  { sym: "SQ", name: "Block, Inc.", sector: "Commercial Services" },
  { sym: "UBER", name: "Uber Technologies", sector: "Transportation" },
  { sym: "LYFT", name: "Lyft, Inc.", sector: "Transportation" },
  { sym: "ABNB", name: "Airbnb, Inc.", sector: "Consumer Services" },
  { sym: "COIN", name: "Coinbase Global, Inc.", sector: "Finance" },
  { sym: "PLTR", name: "Palantir Technologies", sector: "Technology Services" },
  { sym: "F", name: "Ford Motor Company", sector: "Consumer Durables" },
  { sym: "GM", name: "General Motors Company", sector: "Consumer Durables" },
  { sym: "RIVN", name: "Rivian Automotive, Inc.", sector: "Consumer Durables" },
  { sym: "LCID", name: "Lucid Group, Inc.", sector: "Consumer Durables" },
  { sym: "NIO", name: "NIO Inc.", sector: "Consumer Durables" },
  { sym: "BABA", name: "Alibaba Group Holding", sector: "Retail Trade" },
  { sym: "JD", name: "JD.com, Inc.", sector: "Retail Trade" },
  { sym: "PDD", name: "PDD Holdings Inc.", sector: "Retail Trade" },
  { sym: "TSM", name: "Taiwan Semiconductor", sector: "Electronic Technology" },
  { sym: "ASML", name: "ASML Holding N.V.", sector: "Producer Manufacturing" },
  { sym: "SMCI", name: "Super Micro Computer", sector: "Electronic Technology" },
  { sym: "MRVL", name: "Marvell Technology, Inc.", sector: "Electronic Technology" },
  { sym: "ARM", name: "Arm Holdings plc", sector: "Electronic Technology" },
  { sym: "DDOG", name: "Datadog, Inc.", sector: "Technology Services" },
  { sym: "MDB", name: "MongoDB, Inc.", sector: "Technology Services" },
  { sym: "NET", name: "Cloudflare, Inc.", sector: "Technology Services" },
  { sym: "ZM", name: "Zoom Communications", sector: "Technology Services" },
  { sym: "DOCU", name: "DocuSign, Inc.", sector: "Technology Services" },
  { sym: "OKTA", name: "Okta, Inc.", sector: "Technology Services" },
  { sym: "ROKU", name: "Roku, Inc.", sector: "Consumer Durables" },
  { sym: "SPOT", name: "Spotify Technology", sector: "Technology Services" },
  { sym: "PINS", name: "Pinterest, Inc.", sector: "Technology Services" },
  { sym: "SNAP", name: "Snap Inc.", sector: "Technology Services" },
  { sym: "RBLX", name: "Roblox Corporation", sector: "Technology Services" },
  { sym: "DASH", name: "DoorDash, Inc.", sector: "Consumer Services" },
  { sym: "HOOD", name: "Robinhood Markets", sector: "Finance" },
  { sym: "SOFI", name: "SoFi Technologies", sector: "Finance" },
  { sym: "AFRM", name: "Affirm Holdings, Inc.", sector: "Commercial Services" },
  { sym: "ETSY", name: "Etsy, Inc.", sector: "Retail Trade" },
  { sym: "EBAY", name: "eBay Inc.", sector: "Retail Trade" },
  { sym: "TGT", name: "Target Corporation", sector: "Retail Trade" },
  { sym: "TJX", name: "The TJX Companies", sector: "Retail Trade" },
  { sym: "BBY", name: "Best Buy Co., Inc.", sector: "Retail Trade" },
  { sym: "DLTR", name: "Dollar Tree, Inc.", sector: "Retail Trade" },
  { sym: "DG", name: "Dollar General Corp", sector: "Retail Trade" },
  { sym: "KR", name: "The Kroger Co.", sector: "Retail Trade" },
  { sym: "SYY", name: "Sysco Corporation", sector: "Distribution Services" },
  { sym: "MMM", name: "3M Company", sector: "Producer Manufacturing" },
  { sym: "LMT", name: "Lockheed Martin", sector: "Electronic Technology" },
  { sym: "NOC", name: "Northrop Grumman", sector: "Electronic Technology" },
  { sym: "GD", name: "General Dynamics", sector: "Electronic Technology" },
  { sym: "FDX", name: "FedEx Corporation", sector: "Transportation" },
  { sym: "DAL", name: "Delta Air Lines", sector: "Transportation" },
  { sym: "UAL", name: "United Airlines Holdings", sector: "Transportation" },
  { sym: "AAL", name: "American Airlines Group", sector: "Transportation" },
  { sym: "LUV", name: "Southwest Airlines", sector: "Transportation" },
  { sym: "MAR", name: "Marriott International", sector: "Consumer Services" },
  { sym: "HLT", name: "Hilton Worldwide Holdings", sector: "Consumer Services" },
  { sym: "CCL", name: "Carnival Corporation", sector: "Consumer Services" },
  { sym: "RCL", name: "Royal Caribbean Group", sector: "Consumer Services" },
  { sym: "MGM", name: "MGM Resorts International", sector: "Consumer Services" },
  { sym: "WYNN", name: "Wynn Resorts, Limited", sector: "Consumer Services" },
  { sym: "DKNG", name: "DraftKings Inc.", sector: "Consumer Services" },
  { sym: "OXY", name: "Occidental Petroleum", sector: "Energy Minerals" },
  { sym: "COP", name: "ConocoPhillips", sector: "Energy Minerals" },
  { sym: "SLB", name: "Schlumberger Limited", sector: "Industrial Services" },
  { sym: "PSX", name: "Phillips 66", sector: "Energy Minerals" },
  { sym: "MPC", name: "Marathon Petroleum", sector: "Energy Minerals" },
  { sym: "EOG", name: "EOG Resources, Inc.", sector: "Energy Minerals" },
  { sym: "DUK", name: "Duke Energy Corporation", sector: "Utilities" },
  { sym: "SO", name: "The Southern Company", sector: "Utilities" },
  { sym: "NEE", name: "NextEra Energy, Inc.", sector: "Utilities" },
  { sym: "AEP", name: "American Electric Power", sector: "Utilities" },
];

// Deterministic pseudo-random in [0,1) seeded from string
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function fmtBig(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toFixed(0);
}

export const STOCK_UNIVERSE: StockUniverseRow[] = RAW.map((r) => {
  const a = hash(r.sym);
  const b = hash(r.sym + "x");
  const c = hash(r.sym + "y");
  const price = 20 + a * 600;
  const chg = -5 + b * 10;
  const volM = 1 + c * 200;
  const mktCapNum = 1e9 + a * 3e12;
  const pe = 8 + b * 90;
  const eps = 0.5 + c * 25;
  const epsGrowth = -40 + a * 200;
  return {
    sym: r.sym,
    name: r.name,
    sector: r.sector,
    price,
    chg,
    vol: `${volM.toFixed(2)}M`,
    relVol: 0.4 + b * 1.4,
    mktCap: fmtBig(mktCapNum),
    pe,
    eps,
    epsGrowth,
  };
});
