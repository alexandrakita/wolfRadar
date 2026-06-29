import { loadUniverseSymbols } from "./universe.js";

export function getUniverseSize() {
  return loadUniverseSymbols().length;
}

/** Minimum rows required before a snapshot is treated as production-ready. */
export function getMinSnapshotRows() {
  const fromEnv = Number(process.env.MIN_SNAPSHOT_ROWS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.floor(fromEnv);
  return Math.floor(getUniverseSize() * 0.9);
}

export function isSnapshotComplete(rowCount) {
  return Number(rowCount) >= getMinSnapshotRows();
}

export function getMinSnapshotPerfRows() {
  const fromEnv = Number(process.env.MIN_SNAPSHOT_PERF_ROWS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.floor(fromEnv);
  return Math.floor(getUniverseSize() * 0.9);
}

export function isSnapshotPerfComplete(perfRowCount) {
  return Number(perfRowCount) >= getMinSnapshotPerfRows();
}

export function incompleteSnapshotMessage(rowCount) {
  const total = getUniverseSize();
  return `Snapshot incomplete (${rowCount}/${total} symbols). Re-run npm run build-snapshot then npm run publish-redis.`;
}

export function incompletePerfMessage(perfRowCount) {
  const total = getUniverseSize();
  return `Snapshot perf data incomplete (${perfRowCount}/${total} symbols with 1M/3M returns). Filters like High Momentum only scan symbols with perf data.`;
}
