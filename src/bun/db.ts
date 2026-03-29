import type {
  DailySteps,
  DashboardSummary,
  HeartRatePoint,
  SleepBlock,
} from "@/shared/types";
import { Database } from "bun:sqlite";

const SLEEP_LIGHT = new Set([80, 96, 112]);
const SLEEP_DEEP = new Set([121, 122]);

let _db: Database | null = null;
let _dbPath = "";

export function setDbPath(path: string): boolean {
  try {
    _db = new Database(path, { readonly: true });
    _dbPath = path;
    _db.query("SELECT 1 FROM MI_BAND_ACTIVITY_SAMPLE LIMIT 1").get();
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
       FROM MI_BAND_ACTIVITY_SAMPLE
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
  const rows = db()
    .query<{ ts: number; kind: number }, [number]>(
      `SELECT TIMESTAMP as ts, RAW_KIND as kind
       FROM MI_BAND_ACTIVITY_SAMPLE
       WHERE TIMESTAMP >= ? AND RAW_KIND IN (80,96,112,121,122)
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
    if (SLEEP_LIGHT.has(r.kind)) b.lightMin++;
    else b.deepMin++;
    b.totalMin++;
    blocks.set(nightDate, b);
  }
  return [...blocks.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function getHeartRate(days: number): HeartRatePoint[] {
  return db()
    .query<{ timestamp: number; bpm: number }, [number]>(
      `SELECT TIMESTAMP as timestamp, HEART_RATE as bpm
       FROM MI_BAND_ACTIVITY_SAMPLE
       WHERE TIMESTAMP >= ? AND HEART_RATE > 0 AND HEART_RATE < 250
       ORDER BY TIMESTAMP`,
    )
    .all(daysAgo(days));
}

export function getSummary(): DashboardSummary {
  const todayTs = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

  const stepRow = db()
    .query<{ steps: number }, [number]>(
      `SELECT SUM(STEPS) as steps FROM MI_BAND_ACTIVITY_SAMPLE
       WHERE TIMESTAMP >= ? AND STEPS > 0`,
    )
    .get(todayTs);

  const lastNightSleep = getSleepHistory(2).at(-1) ?? null;

  const hrRow = db()
    .query<{ bpm: number }, []>(
      `SELECT HEART_RATE as bpm FROM MI_BAND_ACTIVITY_SAMPLE
       WHERE HEART_RATE > 0 AND HEART_RATE < 250
       ORDER BY TIMESTAMP DESC LIMIT 1`,
    )
    .get();

  const avgRow = db()
    .query<{ avg: number }, [number]>(
      `SELECT AVG(HEART_RATE) as avg FROM MI_BAND_ACTIVITY_SAMPLE
       WHERE TIMESTAMP >= ? AND HEART_RATE > 0 AND HEART_RATE < 250`,
    )
    .get(daysAgo(7));

  return {
    todaySteps: stepRow?.steps ?? 0,
    lastNightSleep,
    currentHR: hrRow?.bpm ?? null,
    avgHR7d: Math.round(avgRow?.avg ?? 0),
  };
}
