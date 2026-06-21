/** @returns {"sqlite" | "redis" | "both"} */
export function getSnapshotStoreMode() {
  const mode = String(process.env.SNAPSHOT_STORE ?? "sqlite").toLowerCase();
  if (mode === "redis" || mode === "both") return mode;
  return "sqlite";
}

export function useRedisSnapshotRead() {
  const mode = getSnapshotStoreMode();
  return mode === "redis" || mode === "both";
}

export function useSqliteSnapshotWrite() {
  const mode = getSnapshotStoreMode();
  return mode === "sqlite" || mode === "both";
}

export function useRedisSnapshotWrite() {
  const mode = getSnapshotStoreMode();
  return mode === "redis" || mode === "both" || process.env.PUBLISH_REDIS === "1";
}
