#!/usr/bin/env node
/**
 * Builds stock-universe-data.json from NASDAQ Trader Symbol Directory.
 * Includes exchange-listed US symbols (NASDAQ / NYSE / NYSE American / Arca / BZX / IEX).
 * OTC Pink / OTCQB-only names are not in these files.
 *
 * Run: node scripts/build-stock-universe.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../src/data/stock-universe-data.json");

const NASDAQ_LISTED =
  "http://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt";
const OTHER_LISTED =
  "http://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt";

const NASDAQ_EXCHANGE_LABEL = {
  Q: "NASDAQ Global Select",
  G: "NASDAQ Global Market",
  S: "NASDAQ Capital Market",
};

const OTHER_EXCHANGE_LABEL = {
  N: "NYSE",
  A: "NYSE American",
  P: "NYSE Arca",
  Z: "Cboe BZX",
  V: "IEX",
};

/** Rough filter: skip structured products still flagged ETF=N in feed edge cases */
function isStructuredOrNonCommonStock(name) {
  const n = name.trim();
  if (!n) return true;
  if (/\bETF\b|\bETN\b|\bETV\b/i.test(n)) return true;
  if (/\bPreferred Stock\b/i.test(n)) return true;
  if (
    / - (Units?|Warrants?|Rights?|Debentures?|Notes?)\b/i.test(n) ||
    /\bSPAC Redeemable\b/i.test(n)
  )
    return true;
  return false;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function parseNasdaqListed(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.includes("|")) continue;
    const p = line.split("|").map((s) => s.trim());
    if (p[0] === "Symbol") continue;
    if (p[0].startsWith("File Creation Time")) break;
    if (p.length < 8) continue;
    const sym = p[0];
    const name = p[1];
    const marketCat = p[2];
    const testIssue = p[3];
    const etf = p[6];
    if (testIssue !== "N" || etf !== "N") continue;
    if (isStructuredOrNonCommonStock(name)) continue;
    const sector =
      NASDAQ_EXCHANGE_LABEL[marketCat] ?? `NASDAQ (${marketCat})`;
    rows.push({ sym, name, sector });
  }
  return rows;
}

function parseOtherListed(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.includes("|")) continue;
    const p = line.split("|").map((s) => s.trim());
    if (p[0] === "ACT Symbol") continue;
    if (p[0].startsWith("File Creation Time")) break;
    if (p.length < 8) continue;
    const actSym = p[0];
    const name = p[1];
    const exch = p[2];
    const etf = p[4];
    const testIssue = p[6];
    const nasdaqSym = p[7];
    if (testIssue !== "N" || etf !== "N") continue;
    if (isStructuredOrNonCommonStock(name)) continue;
    const sym =
      nasdaqSym && nasdaqSym !== actSym && nasdaqSym.length > 0
        ? nasdaqSym
        : actSym;
    const sector =
      OTHER_EXCHANGE_LABEL[exch] ?? `Listed US (exchange ${exch})`;
    rows.push({ sym, name, sector });
  }
  return rows;
}

function mergeUnique(bySym, row) {
  const prev = bySym.get(row.sym);
  if (!prev) {
    bySym.set(row.sym, row);
    return;
  }
  const prevMain =
    /\bCommon Stock\b/i.test(prev.name) ? 1 : 0;
  const nextMain = /\bCommon Stock\b/i.test(row.name) ? 1 : 0;
  if (nextMain > prevMain) bySym.set(row.sym, row);
}

async function main() {
  const [nasdaqTxt, otherTxt] = await Promise.all([
    fetchText(NASDAQ_LISTED),
    fetchText(OTHER_LISTED),
  ]);
  const combined = [...parseNasdaqListed(nasdaqTxt), ...parseOtherListed(otherTxt)];
  const bySym = new Map();
  for (const r of combined) mergeUnique(bySym, r);
  const list = [...bySym.values()].sort((a, b) =>
    a.sym.localeCompare(b.sym, "en")
  );
  writeFileSync(OUT, JSON.stringify(list, null, 0) + "\n", "utf8");
  console.error(`Wrote ${list.length} symbols → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
