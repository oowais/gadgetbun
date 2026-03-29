<script setup lang="ts">
import { inject, onMounted, ref } from "vue";

const emit = defineEmits<{ refreshed: [] }>();
const rpc = inject<any>("rpc");

const path = ref("");
const status = ref<"idle" | "ok" | "err">("idle");

onMounted(async () => {
  path.value = await rpc.request.getDbPath({});
});

async function apply() {
  const ok: boolean = await rpc.request.setDbPath({ path: path.value });
  status.value = ok ? "ok" : "err";
  if (ok) emit("refreshed");
  setTimeout(() => (status.value = "idle"), 2500);
}
</script>

<template>
  <div class="flex items-center gap-2">
    <input
      v-model="path"
      placeholder="/path/to/Gadgetbridge.db"
      spellcheck="false"
      class="w-80 rounded-md border border-solid border-slate-100 bg-slate-800 px-2.5 py-1 text-sm text-slate-200"
    />
    <button
      @click="apply"
      class="cursor-pointer rounded-md border-none bg-indigo-500 px-3.5 py-1 text-sm text-white hover:bg-indigo-600"
    >
      Apply
    </button>
    <span v-if="status === 'ok'" class="text-sm text-green-400">✓</span>
    <span v-if="status === 'err'" class="text-sm text-red-400"
      >✗ not found</span
    >
  </div>
</template>
