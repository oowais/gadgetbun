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

async function loadActivities() {
    loading.value = true;
    error.value = "";
    try {
        activities.value = await rpc.request.getRecentActivities({ limit: 15 });
    } catch (e: any) {
        error.value = e.message ?? "Failed to load activities";
    } finally {
        loading.value = false;
    }
}

async function selectActivity(activity: ActivitySummary) {
    selectedGpxContent.value = null;
    selectedActivityId.value = activity.startTime;

    if (!activity.gpxTrackFilename) {
        return;
    }
    try {
        const gpxData = await rpc.request.getGpxTrack({
            filename: activity.gpxTrackFilename,
        });
        if (gpxData) {
            selectedGpxContent.value = gpxData;
        } else {
            alert(
                "Could not find or read the GPX file on the local filesystem.",
            );
        }
    } catch (e: any) {
        alert(`Error loading GPX data: ${e.message}`);
    }
}

const formatDuration = (startMillis: number, endMillis: number) => {
    // Calculate duration in seconds from millisecond timestamps
    const durationSeconds = (endMillis - startMillis) / 1000;
    if (durationSeconds < 0) return "0s";

    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    const s = Math.floor(durationSeconds % 60);

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`); // Show '0s' for very short durations

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
        default:
            return `Activity #${kind}`;
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
    <div class="activities-container">
        <div class="list-panel">
            <h2>Recent Activities</h2>
            <div v-if="loading" class="state">Loading...</div>
            <div v-else-if="error" class="state error">{{ error }}</div>
            <ul v-else class="activity-list">
                <li
                    v-for="activity in activities"
                    :key="activity.startTime"
                    @click="selectActivity(activity)"
                    :class="{
                        'has-gpx': activity.gpxTrackFilename,
                        selected: activity.startTime === selectedActivityId,
                    }"
                >
                    <div class="activity-header">
                        <strong>{{ getActivityName(activity.kind) }}</strong>
                        <span class="timestamp">
                            {{ formatDate(activity.startTime) }}
                        </span>
                    </div>
                    <div class="activity-details">
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
                            class="gpx-indicator"
                            >🗺️ Map</span
                        >
                    </div>
                </li>
            </ul>
        </div>
        <div class="map-panel">
            <ActivityMap
                v-if="selectedActivityId"
                :gpx-data="selectedGpxContent"
                :key="selectedActivityId"
            />
        </div>
    </div>
</template>

<style scoped>
.activities-container {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 16px;
    background: #1e2130;
    border: 1px solid #2d3148;
    border-radius: 12px;
    padding: 20px 24px;
    margin-top: 16px;
    min-height: 400px;
}
.list-panel h2 {
    font-size: 0.9rem;
    font-weight: 600;
    color: #cbd5e1;
    margin-bottom: 16px;
}
.activity-list {
    list-style: none;
    padding: 0;
    margin: 0;
    height: 350px;
    overflow-y: auto;
}
.activity-list li {
    padding: 10px 12px;
    border-bottom: 1px solid #2d3148;
    cursor: pointer;
    transition: background-color 0.2s;
    border-left: 3px solid transparent;
}
.activity-list li:hover {
    background-color: #2d3148;
}
.activity-list li.has-gpx {
    border-left-color: #64748b;
}
.activity-list li.selected {
    background-color: #3b82f620;
    border-left-color: #3b82f6;
}
.activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}
.activity-header strong {
    color: #e2e8f0;
}
.timestamp {
    font-size: 0.75rem;
    color: #94a3b8;
}
.activity-details {
    font-size: 0.8rem;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
}
.gpx-indicator {
    color: #10b981;
    font-weight: 500;
}
.map-panel {
    background-color: #0f1117;
    border-radius: 8px;
    padding: 0;
    overflow: hidden;
}
.state {
    padding: 20px;
    text-align: center;
    color: #94a3b8;
}
.state.error {
    color: #f87171;
}
</style>
