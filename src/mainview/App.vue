<script setup lang="ts">
import type { DashboardSummary } from "@/shared/types";
import { inject, onMounted, ref } from "vue";

const rpc = inject<any>("rpc");
const summary = ref<DashboardSummary | null>(null);
const loading = ref(true);
const error = ref("");

async function loadSummary() {
    loading.value = true;
    error.value = "";
    try {
        summary.value = await rpc.request.getSummary({});
    } catch (e: any) {
        error.value = e.message ?? "Failed to load";
    } finally {
        loading.value = false;
    }
}

onMounted(loadSummary);

const fmtSteps = (n: number) => n.toLocaleString();
const fmtSleep = (min: number) => `${Math.floor(min / 60)}h ${min % 60}m`;
</script>

<template>
    <div class="app">
        <header>
            <h1>🩺 Gadgetbridge</h1>
            <DbPathConfig @refreshed="loadSummary" />
        </header>

        <div v-if="loading" class="state">Loading…</div>
        <div v-else-if="error" class="state error">
            ⚠ {{ error }}<br /><small>Set the correct DB path above.</small>
        </div>

        <template v-else>
            <section class="cards">
                <div class="card steps">
                    <div class="label">Today's Steps</div>
                    <div class="value">{{ fmtSteps(summary!.todaySteps) }}</div>
                </div>
                <div class="card hr">
                    <div class="label">Heart Rate</div>
                    <div class="value">
                        {{
                            summary!.currentHR
                                ? `${summary!.currentHR} bpm`
                                : "—"
                        }}
                    </div>
                    <div class="sub">7d avg: {{ summary!.avgHR7d }} bpm</div>
                </div>
                <div class="card sleep">
                    <div class="label">Last Night</div>
                    <div class="value">
                        {{
                            summary!.lastNightSleep
                                ? fmtSleep(summary!.lastNightSleep.totalMin)
                                : "—"
                        }}
                    </div>
                    <div class="sub" v-if="summary!.lastNightSleep">
                        Deep: {{ fmtSleep(summary!.lastNightSleep.deepMin) }} ·
                        Light: {{ fmtSleep(summary!.lastNightSleep.lightMin) }}
                    </div>
                </div>
            </section>

            <section class="charts">
                <StepsChart />
                <SleepChart />
                <HeartRateChart />
            </section>
        </template>
    </div>
</template>

<style>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}
body {
    background: #0f1117;
    color: #e2e8f0;
    font-family: system-ui, sans-serif;
}

.app {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
}

header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
}
header h1 {
    font-size: 1.4rem;
    font-weight: 600;
}

.state {
    text-align: center;
    padding: 60px;
    color: #94a3b8;
}
.state.error {
    color: #f87171;
}

.cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 28px;
}
.card {
    background: #1e2130;
    border-radius: 12px;
    padding: 20px 24px;
    border: 1px solid #2d3148;
}
.card .label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 8px;
}
.card .value {
    font-size: 2rem;
    font-weight: 700;
}
.card .sub {
    font-size: 0.8rem;
    color: #94a3b8;
    margin-top: 6px;
}
.card.steps {
    border-top: 3px solid #6366f1;
}
.card.hr {
    border-top: 3px solid #ef4444;
}
.card.sleep {
    border-top: 3px solid #3b82f6;
}

.charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}
.charts > :first-child {
    grid-column: 1 / -1;
}
</style>
