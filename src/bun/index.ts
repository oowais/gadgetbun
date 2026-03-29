import { BrowserView, BrowserWindow, Updater } from "electrobun/bun";
import { join } from "path";
import type { AppRPC } from "../shared/types";
import { getDbPath, setDbPath } from "./db";
import {
  getDailySteps,
  getHeartRate,
  getSleepHistory,
  getSummary,
} from "./db/activity";
import {
  getPai,
  getSleepRespiratoryRate,
  getSpo2,
  getStress,
} from "./db/stress";
import { getGpxTrack, getRecentActivities } from "./db/summary";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

const DEFAULT = join(
  process.env.HOME ?? "",
  "Downloads",
  "Gadgetbridge",
  "database",
  "Gadgetbridge",
);
setDbPath(DEFAULT + ".db") || setDbPath(DEFAULT);

async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      return DEV_SERVER_URL;
    } catch {}
  }
  return "views://mainview/index.html";
}

const rpc = BrowserView.defineRPC<AppRPC>({
  maxRequestTime: 10_000,
  handlers: {
    requests: {
      getDbPath: () => getDbPath(),
      setDbPath: ({ path }) => setDbPath(path),
      getSummary: () => getSummary(),
      getDailySteps: ({ days }) => getDailySteps(days),
      getSleepHistory: ({ days }) => getSleepHistory(days),
      getHeartRate: ({ days }) => getHeartRate(days),
      getStress: ({ days }) => getStress(days),
      getSpo2: ({ days }) => getSpo2(days),
      getPai: ({ days }) => getPai(days),
      getSleepRespiratoryRate: ({ days }) => getSleepRespiratoryRate(days),
      getRecentActivities: ({ limit, offset }) =>
        getRecentActivities(limit, offset),
      getGpxTrack: ({ filename }) => getGpxTrack(filename),
    },
    messages: {},
  },
});

const url = await getMainViewUrl();

new BrowserWindow({
  title: "Gadgetbridge Dashboard",
  url,
  rpc,
  frame: { width: 1200, height: 800, x: 100, y: 100 },
  styleMask: {
    // These are the current defaults
    Borderless: true,
    Titled: true,
    Closable: true,
    Miniaturizable: true,
    Resizable: true,
    UnifiedTitleAndToolbar: false,
    FullScreen: false,
    FullSizeContentView: false,
    UtilityWindow: false,
    DocModalWindow: false,
    NonactivatingPanel: false,
    HUDWindow: false,
  },
});
