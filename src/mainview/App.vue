<script setup lang="ts">
import DbPathConfig from "@/mainview/components/DbPathConfig.vue";
import HeartRateChart from "@/mainview/components/HeartRateChart.vue";
import PaiChart from "@/mainview/components/PaiChart.vue";
import RecentActivities from "@/mainview/components/RecentActivities.vue";
import RespiratoryRateChart from "@/mainview/components/RespiratoryRateChart.vue";
import SleepChart from "@/mainview/components/SleepChart.vue";
import Spo2Chart from "@/mainview/components/Spo2Chart.vue";
import StepsChart from "@/mainview/components/StepsChart.vue";
import StressChart from "@/mainview/components/StressChart.vue";
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
  <div class="mx-auto max-w-7xl p-4">
    <header class="mb-7 flex items-center justify-between">
      <p class="text-4xl font-semibold text-shadow-cyan-700">🩺 Gadgetbun</p>
      <DbPathConfig @refreshed="loadSummary" />
    </header>

    <div v-if="loading" class="p-15 text-center text-slate-400">Loading…</div>
    <div v-else-if="error" class="p-15 text-center text-red-400">
      ⚠ {{ error }}<br /><small>Set the correct DB path above.</small>
    </div>

    <template v-else>
      <section class="mb-7 grid grid-cols-3 gap-4">
        <div
          class="rounded-xl border border-t-4 border-slate-700 border-t-indigo-500 bg-slate-800 p-5"
        >
          <div class="mb-2 text-xs tracking-widest text-slate-500 uppercase">
            Today's Steps
          </div>
          <div class="text-3xl font-bold">
            {{ fmtSteps(summary!.todaySteps) }}
          </div>
        </div>
        <div
          class="rounded-xl border border-t-4 border-slate-700 border-t-red-500 bg-slate-800 p-5"
        >
          <div class="mb-2 text-xs tracking-widest text-slate-500 uppercase">
            Heart Rate
          </div>
          <div class="text-3xl font-bold">
            {{ summary!.currentHR ? `${summary!.currentHR} bpm` : "—" }}
          </div>
          <div class="mt-1.5 text-sm text-slate-400">
            7d avg: {{ summary!.avgHR7d }} bpm
          </div>
        </div>
        <div
          class="rounded-xl border border-t-4 border-slate-700 border-t-blue-500 bg-slate-800 p-5"
        >
          <div class="mb-2 text-xs tracking-widest text-slate-500 uppercase">
            Last Night
          </div>
          <div class="text-3xl font-bold">
            {{
              summary!.lastNightSleep
                ? fmtSleep(summary!.lastNightSleep.totalMin)
                : "—"
            }}
          </div>
          <div
            class="mt-1.5 text-sm text-slate-400"
            v-if="summary!.lastNightSleep"
          >
            Deep: {{ fmtSleep(summary!.lastNightSleep.deepMin) }} · REM:
            {{ fmtSleep(summary!.lastNightSleep.remMin) }} · Light:
            {{ fmtSleep(summary!.lastNightSleep.lightMin) }}
          </div>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-4">
        <StepsChart class="col-span-2" />
        <SleepChart class="col-span-2" />
        <HeartRateChart />
        <StressChart />
        <Spo2Chart />
        <PaiChart />
        <RespiratoryRateChart />
      </section>

      <section class="mt-4">
        <RecentActivities />
      </section>
    </template>
  </div>
</template>

<style>
body {
  background: #0f1117;
  color: #e2e8f0;
  font-family: system-ui, sans-serif;
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
</style>
