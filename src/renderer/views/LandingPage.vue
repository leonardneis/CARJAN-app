<template>
  <div class="landing-container">
    <h1>Willkommen bei CARJAN!</h1>
    <img
      src="../assets/img/carjan_logo_alpha.png"
      alt="CARJAN Logo"
      style="width: 200px; margin: 24px 0"
    />
    <p>Die App ist bereit.</p>

    <Button
      label="Replay animation"
      icon="pi pi-replay"
      class="glass p-4"
      @click="splashreload()"
    />
    <Card class="glass p-4" style="margin-top: 1rem">
      <template #title>Info</template>
      <template #content>
        Hier steht ein eleganter Frosted-Glass-Content
      </template>
    </Card>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import Button from "primevue/button";
import Card from "primevue/card";

const router = useRouter();

function splashreload() {
  const revealEl = document.querySelector(".reveal-mask");
  if (revealEl) {
    revealEl.style.width = "0px";
    setTimeout(() => {
      revealEl.style.width = "350px";
    }, 100);
  }
  router.push("/");
}
</script>
