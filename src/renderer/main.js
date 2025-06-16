import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import router from "./router";

import Aura from "@primeuix/themes/aura";
import "primeicons/primeicons.css";
import "./assets/fonts/inter.css";
import "./main.css";
import { createPinia } from "pinia";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";

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
app.use(createPinia());
app.use(ToastService);
app.use(ConfirmationService);

app.mount("#app");
