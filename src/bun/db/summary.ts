import type { ActivitySummary, GpxTrackData } from "@/shared/types";
import { file } from "bun";
import GPX from "gpx-parser-builder";
import { basename, join } from "path";
import { db } from ".";
import { BASE_ACTIVITY_SCHEMA } from "./constants";

const GPX_FILE_LOCATIONS = join(
  process.env.HOME ?? "",
  "Downloads",
  "Gadgetbridge",
  "files",
);

function getRecentActivities(limit: number): ActivitySummary[] {
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

async function getGpxTrack(filename: string): Promise<GpxTrackData | null> {
  if (!filename) return null;

  const gpxFilePath = join(GPX_FILE_LOCATIONS, filename);

  try {
    const f = file(gpxFilePath);
    if (!(await f.exists())) {
      console.error(`GPX file not found at: ${gpxFilePath}`);
      return null;
    }

    const gpxString = await f.text();

    // Parse the GPX string to count the points
    const gpx = GPX.parse(gpxString);
    const trackCount = gpx.trk?.length ?? 0;
    const pointCount =
      trackCount.reduce(
        (acc: any, trk: any) =>
          acc + (trk.trkseg?.flatMap((s: any) => s.trkpt)?.length ?? 0),
        0,
      ) ?? 0;

    return { gpxString, pointCount };
  } catch (e) {
    console.error(`Error reading or parsing GPX file: ${e}`);
    return null;
  }
}

export { getGpxTrack, getRecentActivities };
