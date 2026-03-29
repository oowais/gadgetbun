import { Database } from "bun:sqlite";
import { ACTIVITY_SCHEMA } from "./constants";

let _db: Database | null = null;
let _dbPath = "";

export function setDbPath(path: string): boolean {
  try {
    _db = new Database(path, { readonly: true });
    _dbPath = path;
    _db.query(`SELECT 1 FROM ${ACTIVITY_SCHEMA} LIMIT 1`).get();
    return true;
  } catch {
    _db = null;
    return false;
  }
}

export function getDbPath() {
  return _dbPath;
}

function db(): Database {
  if (!_db) throw new Error("DB not configured");
  return _db;
}

export { db };
