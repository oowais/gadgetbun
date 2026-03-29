<script setup lang="ts">
import type { DailySteps } from "@/shared/types";
import { Chart, registerables } from "chart.js";
import { inject, onMounted, ref } from "vue";

Chart.register(...registerables);

const rpc = inject<any>("rpc");
const canvas = ref<HTMLCanvasElement | null>(null);
const days = ref(30);

async function draw() {
  const data: DailySteps[] = await rpc.request.getDailySteps({
    days: days.value,
  });
  if (!canvas.value) return;

  Chart.getChart(canvas.value)?.destroy();

  new Chart(canvas.value, {
    type: "bar",
    data: {
      labels: data.map((d) => d.date.slice(5)),
      datasets: [
        {
          label: "Steps",
          data: data.map((d) => d.steps),
          backgroundColor: "#6366f1aa",
          borderColor: "#6366f1",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${(ctx.raw as number).toLocaleString()} steps`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748b", maxTicksLimit: 10 },
          grid: { display: false },
        },
        y: { ticks: { color: "#64748b" }, grid: { color: "#2d3148" } },
      },
    },
  });
}

onMounted(draw);
</script>

<template>
  <div class="rounded-xl border border-slate-700 bg-slate-800 p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-300">Daily Steps</h2>
      <select
        v-model="days"
        @change="draw"
        class="rounded-md border border-slate-700 px-2 py-1 text-sm text-slate-700"
      >
        <option :value="7">7 days</option>
        <option :value="30">30 days</option>
        <option :value="90">90 days</option>
      </select>
    </div>
    <canvas ref="canvas" height="120" />
  </div>
</template>
