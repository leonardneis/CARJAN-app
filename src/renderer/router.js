import { createRouter, createWebHistory } from "vue-router";
import Splash from "./views/Splash.vue";
import LandingPage from "./views/LandingPage.vue";
import Dashboard from "./views/Dashboard.vue";

const routes = [
  { path: "/splash", name: "Splash", component: Splash },
  { path: "/", name: "Dashboard", component: Dashboard },
  { path: "/landing", name: "LandingPage", component: LandingPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
