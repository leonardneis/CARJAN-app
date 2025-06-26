import { createRouter, createWebHistory } from "vue-router";
import Splash from "./views/Splash.vue";
import LandingPage from "./views/LandingPage.vue";
import Dashboard from "./views/Dashboard.vue";
import CarjanEditor from "./views/CarjanEditor.vue";
import ScenarioManager from "./components/ScenarioManager.vue";
import MainMenu from "./views/MainMenu.vue";
import ScenarioSelection from "./views/ScenarioSelection.vue";
import Settings from "./views/Settings.vue";

const routes = [
  { path: "/splash", name: "Splash", component: Splash },
  { path: "/", name: "MainMenu", component: MainMenu },
  { path: "/dashboard", name: "Dashboard", component: Dashboard },
  {
    path: "/scenario-selection",
    name: "ScenarioSelection",
    component: ScenarioSelection,
  },
  { path: "/landing", name: "LandingPage", component: LandingPage },
  { path: "/carjan", name: "CarjanEditor", component: CarjanEditor },
  { path: "/scenarios", name: "ScenarioManager", component: ScenarioManager },
  { path: "/settings", name: "Settings", component: Settings },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
