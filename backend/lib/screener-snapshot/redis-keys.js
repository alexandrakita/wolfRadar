const PREFIX = "wolfradar";

export function currentDateKey() {
  return `${PREFIX}:current_date`;
}

export function metaKey(snapshotDate) {
  return `${PREFIX}:meta:${snapshotDate}`;
}

export function rowsKey(snapshotDate) {
  return `${PREFIX}:rows:${snapshotDate}`;
}

export function ratingKey(snapshotDate, symbol) {
  return `${PREFIX}:rating:${snapshotDate}:${String(symbol).toUpperCase()}`;
}

export function picksKey(snapshotDate) {
  return `${PREFIX}:picks:${snapshotDate}`;
}
