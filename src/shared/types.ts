import type { RPCSchema } from "electrobun/bun";

interface DailySteps {
  date: string;
  steps: number;
}

interface SleepBlock {
  date: string;
  lightMin: number;
  deepMin: number;
  remMin: number;
  totalMin: number;
}

interface HeartRatePoint {
  timestamp: number;
  bpm: number;
}

interface DashboardSummary {
  todaySteps: number;
  lastNightSleep: SleepBlock | null;
  currentHR: number | null;
  avgHR7d: number;
}

interface StressPoint {
  timestamp: number;
  value: number;
}

interface Spo2Point {
  timestamp: number;
  value: number;
}

interface PaiPoint {
  timestamp: number;
  total: number;
  today: number;
}

interface RespiratoryRatePoint {
  timestamp: number;
  rate: number;
}

type AppRPC = {
  bun: RPCSchema<{
    requests: {
      getDbPath: { params: Record<string, never>; response: string };
      setDbPath: { params: { path: string }; response: boolean };
      getSummary: { params: Record<string, never>; response: DashboardSummary };
      getDailySteps: { params: { days: number }; response: DailySteps[] };
      getSleepHistory: { params: { days: number }; response: SleepBlock[] };
      getHeartRate: { params: { days: number }; response: HeartRatePoint[] };
      getStress: { params: { days: number }; response: StressPoint[] };
      getSpo2: { params: { days: number }; response: Spo2Point[] };
      getPai: { params: { days: number }; response: PaiPoint[] };
      getSleepRespiratoryRate: {
        params: { days: number };
        response: RespiratoryRatePoint[];
      };
    };
    messages: Record<string, never>;
  }>;
  webview: RPCSchema<{
    requests: Record<string, never>;
    messages: Record<string, never>;
  }>;
};

export type {
  AppRPC,
  DailySteps,
  DashboardSummary,
  HeartRatePoint,
  PaiPoint,
  RespiratoryRatePoint,
  SleepBlock,
  Spo2Point,
  StressPoint,
};
