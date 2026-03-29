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
    <div class="chart-card">
        <div class="chart-header">
            <h2>PAI</h2>
            <select v-model="days" @change="draw">
                <option :value="7">7 days</option>
                <option :value="14">14 days</option>
                <option :value="30">30 days</option>
            </select>
        </div>
        <canvas ref="canvas" height="160" />
    </div>
</template>

<style scoped>
.chart-card {
    background: #1e2130;
    border: 1px solid #2d3148;
    border-radius: 12px;
    padding: 20px 24px;
}
.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}
h2 {
    font-size: 0.9rem;
    font-weight: 600;
    color: #cbd5e1;
}
select {
    background: #0f1117;
    border: 1px solid #2d3148;
    color: #e2e8f0;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 0.8rem;
}
</style>
