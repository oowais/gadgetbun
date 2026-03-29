import type {
  DailySteps,
  DashboardSummary,
  HeartRatePoint,
  SleepBlock,
} from "@/shared/types";
import { Database } from "bun:sqlite";

const ACTIVITY_SCHEMA = "HUAMI_EXTENDED_ACTIVITY_SAMPLE";
const HEART_RATE_RESTING_SCHEMA = "HUAMI_HEART_RATE_RESTING_SAMPLE";

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

function nowSec() {
  return Math.floor(Date.now() / 1000);
}
function daysAgo(n: number) {
  return nowSec() - n * 86400;
}
function tsToDate(ts: number) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

export function getDailySteps(days: number): DailySteps[] {
  const rows = db()
    .query<{ ts: number; steps: number }, [number]>(
      `SELECT TIMESTAMP as ts, STEPS as steps
       FROM ${ACTIVITY_SCHEMA}
       WHERE TIMESTAMP >= ? AND STEPS > 0
       ORDER BY TIMESTAMP`,
    )
    .all(daysAgo(days));

  const map = new Map<string, number>();
  for (const r of rows) {
    const d = tsToDate(r.ts);
    map.set(d, (map.get(d) ?? 0) + r.steps);
  }
  return [...map.entries()].map(([date, steps]) => ({ date, steps }));
}

export function getSleepHistory(days: number): SleepBlock[] {
  // Each row is ~1 min. SLEEP=1 means any sleep, DEEP_SLEEP=1 deep, REM_SLEEP=1 REM.
  const rows = db()
    .query<{ ts: number; sleep: number; deep: number; rem: number }, [number]>(
      `SELECT TIMESTAMP as ts, SLEEP as sleep, DEEP_SLEEP as deep, REM_SLEEP as rem
       FROM ${ACTIVITY_SCHEMA}
       WHERE TIMESTAMP >= ? AND SLEEP = 1
       ORDER BY TIMESTAMP`,
    )
    .all(daysAgo(days));

  const blocks = new Map<string, SleepBlock>();
  for (const r of rows) {
    const nightDate = tsToDate(r.ts - 6 * 3600);
    const b = blocks.get(nightDate) ?? {
      date: nightDate,
      lightMin: 0,
      deepMin: 0,
      totalMin: 0,
    };
    if (r.deep === 1) b.deepMin++;
    else b.lightMin++; // light + REM both go to light for now
    b.totalMin++;
    blocks.set(nightDate, b);
  }
  return [...blocks.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function getHeartRate(days: number): HeartRatePoint[] {
  return db()
    .query<{ timestamp: number; bpm: number }, [number]>(
      `SELECT TIMESTAMP as timestamp, HEART_RATE as bpm
       FROM ${ACTIVITY_SCHEMA}
       WHERE TIMESTAMP >= ? AND HEART_RATE > 0 AND HEART_RATE < 250
       ORDER BY TIMESTAMP`,
    )
    .all(daysAgo(days));
}

export function getSummary(): DashboardSummary {
  const todayTs = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

  const stepRow = db()
    .query<{ steps: number }, [number]>(
      `SELECT SUM(STEPS) as steps FROM ${ACTIVITY_SCHEMA}
       WHERE TIMESTAMP >= ? AND STEPS > 0`,
    )
    .get(todayTs);

  const lastNightSleep = getSleepHistory(2).at(-1) ?? null;

  const hrRow = db()
    .query<{ bpm: number }, []>(
      `SELECT HEART_RATE as bpm FROM ${HEART_RATE_RESTING_SCHEMA}
       ORDER BY TIMESTAMP DESC LIMIT 1`,
    )
    .get();

  const avgRow = db()
    .query<{ avg: number }, [number]>(
      `SELECT AVG(HEART_RATE) as avg FROM ${HEART_RATE_RESTING_SCHEMA}
       WHERE TIMESTAMP >= ?`,
    )
    .get(daysAgo(7));

  return {
    todaySteps: stepRow?.steps ?? 0,
    lastNightSleep,
    currentHR: hrRow?.bpm ?? null,
    avgHR7d: Math.round(avgRow?.avg ?? 0),
  };
}
