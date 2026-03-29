<script setup lang="ts">
import ActivityMap from "@/mainview/components/ActivityMap.vue";
import type { ActivitySummary } from "@/shared/types";
import { inject, onMounted, ref } from "vue";

const rpc = inject<any>("rpc");
const activities = ref<ActivitySummary[]>([]);
const loading = ref(true);
const error = ref("");
const selectedGpxContent = ref<string | null>(null);
const selectedActivityId = ref<number | null>(null);
const hasMore = ref(true);
const loadingMore = ref(false);

const BATCH_SIZE = 15;

async function loadActivities(loadMore = false) {
  if (loadMore) loadingMore.value = true;
  else {
    loading.value = true;
    activities.value = []; // Clear existing activities on a fresh load
  }
  error.value = "";

  try {
    const newActivities = await rpc.request.getRecentActivities({
      limit: BATCH_SIZE,
      offset: loadMore ? activities.value.length : 0,
    });

    if (newActivities.length < BATCH_SIZE) hasMore.value = false;

    activities.value.push(...newActivities);
  } catch (e: any) {
    error.value = e.message ?? "Failed to load activities";
  } finally {
    if (loadMore) loadingMore.value = false;
    else loading.value = false;
  }
}

async function selectActivity(activity: ActivitySummary) {
  selectedGpxContent.value = null;
  selectedActivityId.value = activity.startTime;

  if (!activity.gpxTrackFilename) return;

  try {
    const trackData = await rpc.request.getGpxTrack({
      filename: activity.gpxTrackFilename,
    });
    if (trackData) selectedGpxContent.value = trackData.gpxString;
    else alert("Could not find or read the GPX file on the local filesystem.");
  } catch (e: any) {
    alert(`Error loading GPX data: ${e.message}`);
  }
}

const formatDuration = (startMillis: number, endMillis: number) => {
  const durationSeconds = (endMillis - startMillis) / 1000;
  if (durationSeconds < 0) return "0s";
  const h = Math.floor(durationSeconds / 3600);
  const m = Math.floor((durationSeconds % 3600) / 60);
  const s = Math.floor(durationSeconds % 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
};

const getActivityName = (kind: number) => {
  switch (kind) {
    case 1:
      return "Running";
    case 2:
      return "Walking";
    case 7:
      return "Cycling";
    case 16:
      return "Generic";
    case 32:
      return "Automatic";
    default:
      return `Activity ${kind}`;
  }
};

const formatDate = (millis: number) => {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(new Date(millis));
};

onMounted(loadActivities);
</script>

<template>
  <div
    class="mt-4 grid min-h-96 grid-cols-[320px_1fr] gap-4 rounded-xl border border-slate-700 bg-slate-800 p-5"
  >
    <div>
      <h2 class="mb-4 text-sm font-semibold text-slate-300">
        Recent Activities
      </h2>
      <div
        v-if="loading && !activities.length"
        class="p-5 text-center text-slate-400"
      >
        Loading...
      </div>
      <div v-else-if="error" class="p-5 text-center text-red-400">
        {{ error }}
      </div>
      <ul v-else class="m-0 h-80 list-none overflow-y-auto p-0">
        <li
          v-for="activity in activities"
          :key="activity.startTime"
          @click="selectActivity(activity)"
          class="cursor-pointer border-b border-l-4 border-slate-700 px-3 py-2.5 transition-colors duration-200"
          :class="{
            'border-l-slate-500': activity.gpxTrackFilename,
            'border-l-blue-500 bg-blue-500/10':
              activity.startTime === selectedActivityId,
            'border-l-transparent': !activity.gpxTrackFilename,
          }"
        >
          <div class="mb-1.5 flex items-center justify-between">
            <strong class="text-slate-200">{{
              getActivityName(activity.kind)
            }}</strong>
            <span class="text-xs text-slate-400">
              {{ formatDate(activity.startTime) }}
            </span>
          </div>
          <div class="flex justify-between text-sm text-slate-400">
            <span>
              {{ formatDuration(activity.startTime, activity.endTime) }}
            </span>
            <span
              v-if="activity.gpxTrackFilename"
              class="font-medium text-emerald-500"
            >
              🗺️ Map
              <span class="ml-1 text-xs text-slate-400">
                ({{ activity.pointCount ?? "N/A" }} pts)
              </span>
            </span>
          </div>
        </li>
      </ul>
      <div class="py-2.5 text-center" v-if="!loading && hasMore">
        <button
          @click="loadActivities(true)"
          :disabled="loadingMore"
          class="cursor-pointer rounded-md border-none bg-blue-500 px-4 py-2 text-sm text-white transition-colors duration-200 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {{ loadingMore ? "Loading..." : "Load More" }}
        </button>
      </div>
    </div>
    <div class="overflow-hidden rounded-lg bg-slate-900 p-0">
      <ActivityMap
        v-if="selectedActivityId"
        :gpx-data="selectedGpxContent"
        :key="selectedActivityId"
      />
    </div>
  </div>
</template>
