import { BrowserView, BrowserWindow, Updater } from "electrobun/bun";
import { join } from "path";
import type { AppRPC } from "../shared/types";
import {
  getDailySteps,
  getDbPath,
  getHeartRate,
  getSleepHistory,
  getSummary,
  setDbPath,
} from "./db";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Try default Syncthing path on startup
const DEFAULT = join(process.env.HOME ?? "", "Downloads", "Gadgetbridge");
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
});
