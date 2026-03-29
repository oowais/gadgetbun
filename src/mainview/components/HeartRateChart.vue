<script setup lang="ts">
import type { HeartRatePoint } from "@/shared/types";
import { Chart, registerables } from "chart.js";
import { inject, onMounted, ref } from "vue";

Chart.register(...registerables);

const rpc = inject<any>("rpc");
const canvas = ref<HTMLCanvasElement | null>(null);
const days = ref(1);

async function draw() {
  const data: HeartRatePoint[] = await rpc.request.getHeartRate({
    days: days.value,
  });
  if (!canvas.value || !data.length) return;

  Chart.getChart(canvas.value)?.destroy();

  const step = Math.max(1, Math.floor(data.length / 500));
  const sampled = data.filter((_, i) => i % step === 0);

  new Chart(canvas.value, {
    type: "line",
    data: {
      labels: sampled.map((p) => {
        const d = new Date(p.timestamp * 1000);
        return days.value <= 1
          ? d.toTimeString().slice(0, 5)
          : d.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
      }),
      datasets: [
        {
          label: "BPM",
          data: sampled.map((p) => p.bpm),
          borderColor: "#ef4444",
          backgroundColor: "#ef444420",
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.raw} bpm` } },
      },
      scales: {
        x: {
          ticks: { color: "#64748b", maxTicksLimit: 8 },
          grid: { display: false },
        },
        y: {
          ticks: { color: "#64748b" },
          grid: { color: "#2d3148" },
          suggestedMin: 40,
          suggestedMax: 120,
        },
      },
    },
  });
}

onMounted(draw);
</script>

<template>
  <div class="rounded-xl border border-slate-700 bg-slate-800 p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-300">Heart Rate</h2>
      <select
        v-model="days"
        @change="draw"
        class="rounded-md border border-slate-700 px-2 py-1 text-sm text-slate-700"
      >
        <option :value="1">Today</option>
        <option :value="3">3 days</option>
        <option :value="7">7 days</option>
      </select>
    </div>
    <canvas ref="canvas" height="160" />
  </div>
</template>
