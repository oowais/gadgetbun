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
  <div class="cfg">
    <input v-model="path" placeholder="/path/to/Gadgetbridge.db" spellcheck="false" />
    <button @click="apply">Apply</button>
    <span v-if="status === 'ok'" class="ok">✓</span>
    <span v-if="status === 'err'" class="err">✗ not found</span>
  </div>
</template>

<style scoped>
.cfg { display: flex; align-items: center; gap: 8px; }
input {
  background: #1e2130; border: 1px solid #2d3148; color: #e2e8f0;
  border-radius: 6px; padding: 5px 10px; font-size: 0.8rem; width: 340px;
}
button {
  background: #6366f1; border: none; color: #fff;
  border-radius: 6px; padding: 5px 14px; font-size: 0.8rem; cursor: pointer;
}
button:hover { background: #4f46e5; }
.ok  { color: #4ade80; font-size: 0.85rem; }
.err { color: #f87171; font-size: 0.85rem; }
</style>
