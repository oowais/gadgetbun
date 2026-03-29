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

interface ActivitySummary {
  name: string | null;
  startTime: number;
  endTime: number;
  kind: number;
  gpxTrack: string | null;
  gpxTrackFilename: string | null;
  pointCount?: number;
}

interface GpxTrackData {
  gpxString: string;
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
      getRecentActivities: {
        params: { limit: number };
        response: ActivitySummary[];
      };
      getGpxTrack: {
        params: { filename: string };
        response: GpxTrackData | null;
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
  ActivitySummary,
  AppRPC,
  DailySteps,
  DashboardSummary,
  GpxTrackData,
  HeartRatePoint,
  PaiPoint,
  RespiratoryRatePoint,
  SleepBlock,
  Spo2Point,
  StressPoint,
};
