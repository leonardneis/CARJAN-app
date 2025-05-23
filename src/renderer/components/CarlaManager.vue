<template>
  <div class="p-4 border rounded">
    <h2 class="text-lg font-bold">CARLA Simulation</h2>
    <p v-if="path">📁 Aktueller Pfad: {{ path }}</p>
    <button @click="selectPath" class="mt-2 btn">Pfad wählen</button>
    <button @click="startCarla" :disabled="!path" class="ml-2 btn">
      CARLA starten
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const path = ref(null);

onMounted(async () => {
  path.value = await window.electron.invoke("carla:getPath");
});

async function selectPath() {
  path.value = await window.electron.invoke("carla:selectPath");
}

async function startCarla() {
  const result = await window.electron.invoke("carla:start");
  if (!result) alert("CARLA konnte nicht gestartet werden.");
}
</script>

<style scoped>
.btn {
  background: #1f2937;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
}
</style>
