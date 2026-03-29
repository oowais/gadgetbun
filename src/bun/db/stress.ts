import {
  PaiPoint,
  RespiratoryRatePoint,
  Spo2Point,
  StressPoint,
} from "@/shared/types";
import { db } from ".";
import {
  PAI_SCHEMA,
  SLEEP_RESPIRATORY_RATE_SCHEMA,
  SPO2_SCHEMA,
  STRESS_SCHEMA,
} from "./constants";
import { daysAgo } from "./util";

function getStress(days: number): StressPoint[] {
  return db()
    .query<{ timestamp: number; value: number }, [number]>(
      `SELECT TIMESTAMP as timestamp, STRESS as value
       FROM ${STRESS_SCHEMA}
       WHERE TIMESTAMP >= ? AND STRESS > 0
       ORDER BY TIMESTAMP`,
    )
    .all(daysAgo(days));
}

function getSpo2(days: number): Spo2Point[] {
  return db()
    .query<{ timestamp: number; value: number }, [number]>(
      `SELECT TIMESTAMP as timestamp, SPO2 as value
       FROM ${SPO2_SCHEMA}
       WHERE TIMESTAMP >= ? AND SPO2 > 0
       ORDER BY TIMESTAMP`,
    )
    .all(daysAgo(days));
}

function getPai(days: number): PaiPoint[] {
  return db()
    .query<{ timestamp: number; total: number; today: number }, [number]>(
      `SELECT TIMESTAMP as timestamp, PAI_TOTAL as total, PAI_TODAY as today
       FROM ${PAI_SCHEMA}
       WHERE TIMESTAMP >= ?
       ORDER BY TIMESTAMP`,
    )
    .all(daysAgo(days));
}

function getSleepRespiratoryRate(days: number): RespiratoryRatePoint[] {
  return db()
    .query<{ timestamp: number; rate: number }, [number]>(
      `SELECT TIMESTAMP as timestamp, RATE as rate
       FROM ${SLEEP_RESPIRATORY_RATE_SCHEMA}
       WHERE TIMESTAMP >= ?
       ORDER BY TIMESTAMP`,
    )
    .all(daysAgo(days));
}

export { getPai, getSleepRespiratoryRate, getSpo2, getStress };
