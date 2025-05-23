import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import router from "./router";
import Aura from "@primeuix/themes/aura";
import "primeicons/primeicons.css";
import "./assets/fonts/inter.css";
import "./main.css";

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: "system",
    },
  },
});
app.use(router);

app.mount("#app");
