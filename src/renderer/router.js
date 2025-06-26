import { createRouter, createWebHistory } from "vue-router";
import Splash from "./views/Splash.vue";
import LandingPage from "./views/LandingPage.vue";
import Dashboard from "./views/Dashboard.vue";
import CarjanEditor from "./views/CarjanEditor.vue";

const routes = [
  { path: "/splash", name: "Splash", component: Splash },
  { path: "/", name: "Dashboard", component: Dashboard },
  { path: "/landing", name: "LandingPage", component: LandingPage },
  { path: "/carjan", name: "CarjanEditor", component: CarjanEditor },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
