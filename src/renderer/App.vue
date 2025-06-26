<template>
  <router-view />

  <!-- Global Toast Component - nur für non-editor routes -->
  <Toast v-if="!isInEditor" />
</template>

<script setup>
import { onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useScenarioStore } from "./store/scenario";
import Toast from "primevue/toast";

const route = useRoute();
const scenarioStore = useScenarioStore();

// Check if we're in the editor to avoid duplicate toasts
const isInEditor = computed(() => route.name === "CarjanEditor");

// Initialize stores on app startup
onMounted(() => {
  scenarioStore.initialize();
});
</script>
