import type { ActivitySummary } from "@/shared/types";
import { file } from "bun";
import { basename, join } from "path";
import { db } from ".";
import { BASE_ACTIVITY_SCHEMA } from "./constants";

const GPX_FILE_LOCATIONS = join(
  process.env.HOME ?? "",
  "Downloads",
  "Gadgetbridge",
  "files",
);

export function getRecentActivities(limit: number): ActivitySummary[] {
  const rows = db()
    .query<
      {
        name: string | null;
        startTime: number;
        endTime: number;
        kind: number;
        gpxTrack: string | null;
      },
      [number]
    >(
      `SELECT NAME as name, START_TIME as startTime, END_TIME as endTime, ACTIVITY_KIND as kind, GPX_TRACK as gpxTrack
       FROM ${BASE_ACTIVITY_SCHEMA}
       ORDER BY START_TIME DESC
       LIMIT ?`,
    )
    .all(limit);

  return rows.map((r) => ({
    name: r.name,
    startTime: r.startTime,
    endTime: r.endTime,
    kind: r.kind,
    gpxTrack: r.gpxTrack,
    gpxTrackFilename: r.gpxTrack ? basename(r.gpxTrack) : null,
  }));
}

export async function getGpxTrack(filename: string): Promise<string | null> {
  if (!filename) return null;

  const gpxFilePath = join(GPX_FILE_LOCATIONS, filename);

  try {
    const f = file(gpxFilePath);
    if (await f.exists()) return await f.text();
    console.error(`GPX file not found at: ${gpxFilePath}`);
    return null;
  } catch (e) {
    console.error(`Error reading GPX file: ${e}`);
    return null;
  }
}
