import Database from "better-sqlite3";
import fs from "node:fs";

import { initSchema } from "./screener-snapshot/schema.js";
import { getDataDir, getDbPath } from "./paths.js";

/** @type {import("better-sqlite3").Database | null} */
let db = null;

export { getDbPath };

export function getDb() {
  if (db) return db;
  fs.mkdirSync(getDataDir(), { recursive: true });
  db = new Database(getDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
