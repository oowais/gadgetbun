<script setup lang="ts">
import type { SleepBlock } from "@/shared/types";
import { Chart, registerables } from "chart.js";
import { inject, onMounted, ref } from "vue";

Chart.register(...registerables);

const rpc = inject<any>("rpc");
const canvas = ref<HTMLCanvasElement | null>(null);
const days = ref(14);

async function draw() {
    const data: SleepBlock[] = await rpc.request.getSleepHistory({
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
                    label: "Deep",
                    data: data.map((d) => +(d.deepMin / 60).toFixed(2)),
                    backgroundColor: "#1d4ed8bb",
                    borderRadius: 4,
                },
                {
                    label: "Light",
                    data: data.map((d) => +(d.lightMin / 60).toFixed(2)),
                    backgroundColor: "#3b82f6aa",
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "#94a3b8", font: { size: 11 } },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const h = Math.floor(ctx.raw as number);
                            const m = Math.round(
                                ((ctx.raw as number) - h) * 60,
                            );
                            return `${ctx.dataset.label}: ${h}h ${m}m`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: "#64748b" },
                    grid: { display: false },
                },
                y: {
                    stacked: true,
                    ticks: { color: "#64748b", callback: (v) => `${v}h` },
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
            <h2>Sleep</h2>
            <select v-model="days" @change="draw">
                <option :value="7">7 nights</option>
                <option :value="14">14 nights</option>
                <option :value="30">30 nights</option>
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
