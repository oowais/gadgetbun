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

export async function getRecentActivities(
  limit: number,
): Promise<ActivitySummary[]> {
  const rows = db()
    .query<
      Omit<ActivitySummary, "pointCount" | "gpxTrackFilename"> & {
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

  const activities: ActivitySummary[] = rows.map((r) => ({
    name: r.name,
    startTime: r.startTime,
    endTime: r.endTime,
    kind: r.kind,
    gpxTrack: r.gpxTrack,
    gpxTrackFilename: r.gpxTrack ? basename(r.gpxTrack) : null,
  }));

  // Now, iterate and enrich with point counts
  for (const activity of activities) {
    if (activity.gpxTrackFilename) {
      const gpxFilePath = join(GPX_FILE_LOCATIONS, activity.gpxTrackFilename);
      try {
        const f = file(gpxFilePath);
        if (await f.exists()) {
          const gpxString = await f.text();
          const gpx = GPX.parse(gpxString);
          const trackPointCount =
            gpx.trk?.reduce(
              (acc: any, trk: any) =>
                acc + (trk.trkseg?.flatMap((s: any) => s.trkpt)?.length ?? 0),
              0,
            ) ?? 0;
          activity.pointCount = trackPointCount;
        }
      } catch (e) {
        console.error(
          `Could not process GPX for ${activity.gpxTrackFilename}:`,
          e,
        );
        activity.pointCount = 0;
      }
    }
  }

  return activities;
}

// This function is now only for fetching the content for the map
export async function getGpxTrack(
  filename: string,
): Promise<GpxTrackData | null> {
  if (!filename) return null;
  const gpxFilePath = join(GPX_FILE_LOCATIONS, filename);
  try {
    const f = file(gpxFilePath);
    if (await f.exists()) {
      const gpxString = await f.text();
      return { gpxString };
    }
    return null;
  } catch (e) {
    console.error(`Error reading GPX file: ${e}`);
    return null;
  }
}
