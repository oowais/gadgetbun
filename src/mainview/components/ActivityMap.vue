<script setup lang="ts">
import GPX from "gpx-parser-builder";
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
    map = L.map(mapContainer.value);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  }
}

function renderGpx() {
  if (!map) return;

  if (gpxLayer) {
    map.removeLayer(gpxLayer);
    gpxLayer = null;
  }

  if (!props.gpxData) {
    map.setView([20, 0], 2);
    return;
  }

  try {
    const gpx = GPX.parse(props.gpxData);
    console.log(gpx.trk);
    const points: L.LatLngExpression[] =
      gpx.trk?.flatMap(
        (t: any) =>
          t.trkseg?.flatMap((s: any) =>
            s.trkpt.map((p: any) => [p.$.lat, p.$.lon]),
          ) ?? [],
      ) ?? [];

    if (points.length === 0) return;

    const trackLine = L.polyline(points, { color: "#ef4444", weight: 3 });
    gpxLayer = L.featureGroup([trackLine]);

    if (points.length > 1) {
      const startMarker = L.marker(points[0]);
      const endMarker = L.marker(points[points.length - 1]);
      gpxLayer.addLayer(startMarker).addLayer(endMarker);
    }

    gpxLayer.addTo(map);

    const bounds = trackLine.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
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
  <div
    ref="mapContainer"
    class="relative h-full min-h-80 w-full rounded-lg bg-slate-800"
  >
    <div
      v-if="!gpxData"
      class="absolute inset-0 z-10 flex items-center justify-center text-slate-400"
    >
      <p>Select an activity with a map to view the track.</p>
    </div>
  </div>
</template>
