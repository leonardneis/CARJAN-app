import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import Splash from "./views/Splash.vue";
import LandingPage from "./views/LandingPage.vue";
import Dashboard from "./views/Dashboard.vue";
import CarjanEditor from "./views/CarjanEditor.vue";
import ScenarioManager from "./components/ScenarioManager.vue";
import MainMenu from "./views/MainMenu.vue";
import ScenarioSelection from "./views/ScenarioSelection.vue";
import Settings from "./views/Settings.vue";

const routes = [
  { path: "/", name: "Splash", component: Splash },
  { path: "/main-menu", name: "MainMenu", component: MainMenu },
  { path: "/dashboard", name: "Dashboard", component: Dashboard },
  {
    path: "/scenario-selection",
    name: "ScenarioSelection",
    component: ScenarioSelection,
  },
  { path: "/landing", name: "LandingPage", component: LandingPage },
  { path: "/carjan", name: "CarjanEditor", component: CarjanEditor },
  { path: "/new", name: "ScenarioManager", component: ScenarioManager },
  { path: "/settings", name: "Settings", component: Settings },
  // Fallback route - redirect any unknown paths to splash
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

// Check if running in Electron
const isElectron =
  typeof window !== "undefined" && window.electronAPI?.isElectron;

const router = createRouter({
  // Use hash history for Electron, web history for browser
  history: isElectron
    ? createWebHashHistory()
    : createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Enhanced navigation logging
router.beforeEach((to, from, next) => {
  if (isElectron) {
    console.log("Electron navigation:", from.path, "->", to.path);
  }
  next();
});

export default router;
