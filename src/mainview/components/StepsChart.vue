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
                        label: (ctx) =>
                            `${(ctx.raw as number).toLocaleString()} steps`,
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
    <div class="chart-card">
        <div class="chart-header">
            <h2>Daily Steps</h2>
            <select v-model="days" @change="draw">
                <option :value="7">7 days</option>
                <option :value="30">30 days</option>
                <option :value="90">90 days</option>
            </select>
        </div>
        <canvas ref="canvas" height="120" />
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
