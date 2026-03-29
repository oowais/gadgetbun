<script setup lang="ts">
import type { PaiPoint } from "@/shared/types";
import { Chart, registerables } from "chart.js";
import { inject, onMounted, ref } from "vue";

Chart.register(...registerables);

const rpc = inject<any>("rpc");
const canvas = ref<HTMLCanvasElement | null>(null);
const days = ref(7);

async function draw() {
    const data: PaiPoint[] = await rpc.request.getPai({
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
                    label: "Today",
                    data: sampled.map((p) => p.today),
                    borderColor: "#10b981",
                    backgroundColor: "#10b98120",
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: "Total",
                    data: sampled.map((p) => p.total),
                    borderColor: "#f59e0b",
                    backgroundColor: "#f59e0b20",
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
                legend: { display: true, labels: { color: "#cbd5e1" } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`,
                    },
                },
            },
            scales: {
                x: {
                    ticks: { color: "#64748b", maxTicksLimit: 8 },
                    grid: { display: false },
                },
                y: {
                    ticks: { color: "#64748b" },
                    grid: { color: "#2d3148" },
                },
            },
        },
    });
}

onMounted(draw);
</script>

<template>
    <div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-sm font-semibold text-slate-300">PAI</h2>
            <select
                v-model="days"
                @change="draw"
                class="bg-slate-900 border border-slate-700 text-slate-200 rounded-md py-1 px-2 text-sm"
            >
                <option :value="7">7 days</option>
                <option :value="14">14 days</option>
                <option :value="30">30 days</option>
            </select>
        </div>
        <canvas ref="canvas" height="160" />
    </div>
</template>
