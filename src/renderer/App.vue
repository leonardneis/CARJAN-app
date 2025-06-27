<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="getTransitionName(route)" mode="out-in" appear>
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>

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

// Define transition names based on route navigation
const getTransitionName = (currentRoute) => {
  // Use simple fade transitions for all routes
  return "fade";
};

// Initialize stores on app startup
onMounted(() => {
  scenarioStore.initialize();
});
</script>

<style>
/* Slide Expand Animation (main-menu → scenario-selection) */
.slide-expand-enter-active {
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-expand-leave-active {
  transition: all 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.slide-expand-enter-from {
  transform: translateX(100%) scale(0.8);
  opacity: 0;
  filter: blur(8px);
}

.slide-expand-leave-to {
  transform: translateX(-30%) scale(1.1);
  opacity: 0;
  filter: blur(4px);
}

/* Slide Contract Animation (scenario-selection → main-menu) */
.slide-contract-enter-active {
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-contract-leave-active {
  transition: all 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.slide-contract-enter-from {
  transform: translateX(-100%) scale(1.2);
  opacity: 0;
  filter: blur(8px);
}

.slide-contract-leave-to {
  transform: translateX(30%) scale(0.8);
  opacity: 0;
  filter: blur(4px);
}

/* Fade Slide Animation (scenario-selection → new scenario) */
.fade-slide-enter-active {
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.6, 1);
}

.fade-slide-enter-from {
  transform: translateY(50px) scale(0.95);
  opacity: 0;
  filter: blur(6px);
}

.fade-slide-leave-to {
  transform: translateY(-30px) scale(1.05);
  opacity: 0;
  filter: blur(3px);
}

/* Default Fade Animation */
.fade-enter-active {
  transition: all 0.5s ease;
}

.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Global animation improvements */
.slide-expand-enter-active,
.slide-contract-enter-active,
.fade-slide-enter-active {
  z-index: 10;
}

.slide-expand-leave-active,
.slide-contract-leave-active,
.fade-slide-leave-active {
  z-index: 5;
}
</style>
