<script setup lang="ts">
import GpxParser from "gpx-parser-builder";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
    gpxData: string | null;
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let gpxLayer: L.FeatureGroup | null = null;

// Fix for default icon issues with bundlers like Vite/Webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function initializeMap() {
    if (mapContainer.value && !map) {
        // Initialize map without a default view
        map = L.map(mapContainer.value);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
    }
}

function renderGpx() {
    if (!map) return;

    // Clear previous layer if it exists
    if (gpxLayer) {
        map.removeLayer(gpxLayer);
        gpxLayer = null;
    }

    // If no new GPX data, do nothing further
    if (!props.gpxData) {
        // Optionally, reset view or show a world view
        map.setView([20, 0], 2); // Zoom out to a world view
        return;
    }

    try {
        const parser = new GpxParser(props.gpxData);
        const parsedGpx = parser.parse();

        if (parsedGpx.tracks.length === 0) return;

        const points: L.LatLngExpression[] = parsedGpx.tracks[0].points.map(
            (p: any) => [p.lat, p.lon],
        );

        if (points.length === 0) return;

        const trackLine = L.polyline(points, { color: "#ef4444", weight: 3 });
        gpxLayer = L.featureGroup([trackLine]);

        if (points.length > 1) {
            const startMarker = L.marker(points[0]);
            const endMarker = L.marker(points[points.length - 1]);
            gpxLayer.addLayer(startMarker).addLayer(endMarker);
        }

        gpxLayer.addTo(map);
        map.fitBounds(trackLine.getBounds(), { padding: [20, 20] });
    } catch (e) {
        console.error("Failed to parse or render GPX data:", e);
    }
}

onMounted(() => {
    if (typeof window !== "undefined") {
        initializeMap();
        renderGpx(); // Initial render (will show world view)
    }
});

// Watch for changes in gpxData and re-render the track
watch(() => props.gpxData, renderGpx);
</script>

<template>
    <div ref="mapContainer" class="map-view">
        <div v-if="!gpxData" class="no-track-overlay">
            <p>Select an activity with a map to view the track.</p>
        </div>
    </div>
</template>

<style scoped>
.map-view {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 350px;
    border-radius: 8px;
    background-color: #1e2130; /* Background for when map tiles are loading */
}
.no-track-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #94a3b8;
    z-index: 1000; /* Ensure it's above the map container */
}
</style>
