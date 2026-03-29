import type {
  DailySteps,
  DashboardSummary,
  HeartRatePoint,
  SleepBlock,
} from "@/shared/types";
import { db } from ".";
import { ACTIVITY_SCHEMA, HEART_RATE_RESTING_SCHEMA } from "./constants";
import { daysAgo, tsToDate } from "./util";

function getDailySteps(days: number): DailySteps[] {
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

function getSleepHistory(days: number): SleepBlock[] {
  const rows = db()
    .query<{ ts: number; sleep: number; deep: number; rem: number }, [number]>(
      `SELECT TIMESTAMP as ts, SLEEP as sleep, DEEP_SLEEP as deep, REM_SLEEP as rem
       FROM HUAMI_EXTENDED_ACTIVITY_SAMPLE
       WHERE TIMESTAMP >= ? AND RAW_KIND = 120
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
      remMin: 0,
      totalMin: 0,
    };
    const rem = r.rem & 127;
    const deep = r.deep & 127;
    if (rem > 55) b.remMin++;
    else if (deep > 42) b.deepMin++;
    else b.lightMin++;
    b.totalMin++;
    blocks.set(nightDate, b);
  }
  return [...blocks.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function getHeartRate(days: number): HeartRatePoint[] {
  return db()
    .query<{ timestamp: number; bpm: number }, [number]>(
      `SELECT TIMESTAMP as timestamp, HEART_RATE as bpm
       FROM ${ACTIVITY_SCHEMA}
       WHERE TIMESTAMP >= ? AND HEART_RATE > 0 AND HEART_RATE < 250
       ORDER BY TIMESTAMP`,
    )
    .all(daysAgo(days));
}

function getSummary(): DashboardSummary {
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

export { getDailySteps, getHeartRate, getSleepHistory, getSummary };
