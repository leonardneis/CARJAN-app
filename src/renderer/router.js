import { createRouter, createWebHistory } from "vue-router";
import Splash from "./views/Splash.vue";
import LandingPage from "./views/LandingPage.vue";

const routes = [
  { path: "/", name: "Splash", component: Splash },
  { path: "/landing", name: "LandingPage", component: LandingPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
