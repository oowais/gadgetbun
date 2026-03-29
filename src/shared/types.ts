import type { RPCSchema } from "electrobun/bun";

export interface DailySteps {
  date: string;
  steps: number;
}

export interface SleepBlock {
  date: string;
  lightMin: number;
  deepMin: number;
  totalMin: number;
}

export interface HeartRatePoint {
  timestamp: number;
  bpm: number;
}

export interface DashboardSummary {
  todaySteps: number;
  lastNightSleep: SleepBlock | null;
  currentHR: number | null;
  avgHR7d: number;
}

export type AppRPC = {
  bun: RPCSchema<{
    requests: {
      getDbPath:       { params: Record<string, never>; response: string };
      setDbPath:       { params: { path: string };      response: boolean };
      getSummary:      { params: Record<string, never>; response: DashboardSummary };
      getDailySteps:   { params: { days: number };      response: DailySteps[] };
      getSleepHistory: { params: { days: number };      response: SleepBlock[] };
      getHeartRate:    { params: { days: number };      response: HeartRatePoint[] };
    };
    messages: Record<string, never>;
  }>;
  webview: RPCSchema<{
    requests:  Record<string, never>;
    messages:  Record<string, never>;
  }>;
};
