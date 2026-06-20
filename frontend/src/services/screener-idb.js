const DB_NAME = "wolf-radar-screener";
const DB_VERSION = 1;
const META_ID = "current";

/** @type {Promise<IDBDatabase> | null} */
let dbPromise = null;

function openDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("picks")) {
        db.createObjectStore("picks", { keyPath: "snapshotDate" });
      }
      if (!db.objectStoreNames.contains("queries")) {
        db.createObjectStore("queries", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });

  return dbPromise;
}

/**
 * @template T
 * @param {string} storeName
 * @param {IDBTransactionMode} mode
 * @param {(store: IDBObjectStore) => IDBRequest<T>} run
 */
async function withStore(storeName, mode, run) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = run(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error(`IndexedDB ${storeName} failed`));
  });
}

/** @returns {Promise<{ id: string, snapshotDate: string | null, rowCount: number, picksCount: number, syncedAt: string } | null>} */
export async function getScreenerMeta() {
  try {
    return (await withStore("meta", "readonly", (s) => s.get(META_ID))) ?? null;
  } catch {
    return null;
  }
}

/** @param {{ snapshotDate?: string | null, rowCount?: number, picksCount?: number }} patch */
export async function setScreenerMeta(patch) {
  try {
    const prev = (await getScreenerMeta()) ?? { id: META_ID };
    const next = {
      ...prev,
      id: META_ID,
      snapshotDate: patch.snapshotDate ?? prev.snapshotDate ?? null,
      rowCount: patch.rowCount ?? prev.rowCount ?? 0,
      picksCount: patch.picksCount ?? prev.picksCount ?? 0,
      syncedAt: new Date().toISOString(),
    };
    await withStore("meta", "readwrite", (s) => s.put(next));
    return next;
  } catch {
    return null;
  }
}

/** @param {string} snapshotDate @param {number} [minScore] */
export async function getCachedPicks(snapshotDate, minScore = 70) {
  if (!snapshotDate) return null;
  try {
    const row = await withStore("picks", "readonly", (s) => s.get(snapshotDate));
    if (!row || row.minScore !== minScore) return null;
    return row;
  } catch {
    return null;
  }
}

/**
 * @param {string} snapshotDate
 * @param {number} minScore
 * @param {Record<string, object>} ratings
 */
export async function setCachedPicks(snapshotDate, minScore, ratings) {
  if (!snapshotDate) return;
  try {
    await withStore("picks", "readwrite", (s) =>
      s.put({
        snapshotDate,
        minScore,
        ratings,
        syncedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // ignore storage failures
  }
}

/** @param {string} key */
export async function getCachedQuery(key) {
  try {
    return (await withStore("queries", "readonly", (s) => s.get(key))) ?? null;
  } catch {
    return null;
  }
}

/** @param {string} key @param {string} snapshotDate @param {object} payload */
export async function setCachedQuery(key, snapshotDate, payload) {
  try {
    await withStore("queries", "readwrite", (s) =>
      s.put({
        key,
        snapshotDate,
        payload,
        cachedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // ignore
  }
}

export async function clearQueryCache() {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("queries", "readwrite");
      const req = tx.objectStore("queries").clear();
      req.onsuccess = () => resolve(undefined);
      req.onerror = () => reject(req.error ?? new Error("clear queries failed"));
    });
  } catch {
    // ignore
  }
}

export async function clearPicksCache() {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("picks", "readwrite");
      const req = tx.objectStore("picks").clear();
      req.onsuccess = () => resolve(undefined);
      req.onerror = () => reject(req.error ?? new Error("clear picks failed"));
    });
  } catch {
    // ignore
  }
}

/** Invalidate cached queries/picks when the official snapshot date changes. */
export async function invalidateIfSnapshotChanged(nextSnapshotDate) {
  const meta = await getScreenerMeta();
  if (meta?.snapshotDate && nextSnapshotDate && meta.snapshotDate !== nextSnapshotDate) {
    await clearQueryCache();
    await clearPicksCache();
  }
}

/** Stable cache key for screener query params. */
export function buildScreenerQueryKey(params) {
  const {
    filters = {},
    quickFilters = [],
    q = "",
    sortField = null,
    sortOrder = null,
    page = 1,
    pageSize = 50,
  } = params ?? {};

  return JSON.stringify({
    filters,
    quickFilters: [...quickFilters].sort(),
    q,
    sort: { field: sortField, order: sortOrder },
    page,
    pageSize,
  });
}
