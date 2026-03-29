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
        else
            alert(
                "Could not find or read the GPX file on the local filesystem.",
            );
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
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    }).format(new Date(millis));
};

onMounted(loadActivities);
</script>

<template>
    <div
        class="grid grid-cols-[320px_1fr] gap-4 bg-slate-800 border border-slate-700 rounded-xl p-5 mt-4 min-h-[400px]"
    >
        <div>
            <h2 class="text-sm font-semibold text-slate-300 mb-4">
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
            <ul v-else class="list-none p-0 m-0 h-[350px] overflow-y-auto">
                <li
                    v-for="activity in activities"
                    :key="activity.startTime"
                    @click="selectActivity(activity)"
                    class="px-3 py-2.5 border-b border-slate-700 cursor-pointer transition-colors duration-200 border-l-4"
                    :class="{
                        'border-l-slate-500': activity.gpxTrackFilename,
                        'bg-blue-500/10 border-l-blue-500':
                            activity.startTime === selectedActivityId,
                        'border-l-transparent': !activity.gpxTrackFilename,
                    }"
                >
                    <div class="flex justify-between items-center mb-1.5">
                        <strong class="text-slate-200">{{
                            getActivityName(activity.kind)
                        }}</strong>
                        <span class="text-xs text-slate-400">
                            {{ formatDate(activity.startTime) }}
                        </span>
                    </div>
                    <div class="text-sm text-slate-400 flex justify-between">
                        <span>
                            {{
                                formatDuration(
                                    activity.startTime,
                                    activity.endTime,
                                )
                            }}
                        </span>
                        <span
                            v-if="activity.gpxTrackFilename"
                            class="text-emerald-500 font-medium"
                        >
                            🗺️ Map
                            <span class="text-xs text-slate-400 ml-1">
                                ({{ activity.pointCount ?? "N/A" }} pts)
                            </span>
                        </span>
                    </div>
                </li>
            </ul>
            <div class="text-center py-2.5" v-if="!loading && hasMore">
                <button
                    @click="loadActivities(true)"
                    :disabled="loadingMore"
                    class="bg-blue-500 text-white border-none py-2 px-4 rounded-md cursor-pointer text-sm transition-colors duration-200 hover:bg-blue-600 disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                    {{ loadingMore ? "Loading..." : "Load More" }}
                </button>
            </div>
        </div>
        <div class="bg-slate-900 rounded-lg p-0 overflow-hidden">
            <ActivityMap
                v-if="selectedActivityId"
                :gpx-data="selectedGpxContent"
                :key="selectedActivityId"
            />
        </div>
    </div>
</template>
