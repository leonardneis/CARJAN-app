<template>
  <div class="landing-container">
    <div class="logo-layer image">
      <div class="reveal-mask">
        <img src="../assets/img/carjan_alpha.png" class="logo-img" />
        <div style="background-color: black"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { createTimeline, animate } from "animejs";

const timeline = createTimeline({ autoplay: false });
const router = useRouter();

onMounted(async () => {
  await nextTick();

  const revealEl = document.querySelector(".reveal-mask");

  if (!revealEl) {
    console.error("[Splash] .reveal-mask nicht gefunden");
    setTimeout(() => router.replace({ name: "LandingPage" }), 2000);
    return;
  }

  timeline.sync(
    animate(".reveal-mask", {
      width: ["0px", "350px"],
      duration: 2000,
      ease: "out(3)",

      onComplete: () => {
        console.log("[Splash] Reveal Animation abgeschlossen");
        setTimeout(() => router.replace({ name: "LandingPage" }), 500);
      },
    })
  );

  timeline.play();
});
</script>

<style scoped>
.logo-layer.image {
  width: 400px;
  height: auto;
  /* outline: auto; */
  position: relative;
}

.reveal-mask {
  overflow: hidden;
  width: 0;
  height: auto;
  position: relative;
  /* background-color: red; */
}

.logo-img {
  width: 400px;
  height: auto;
  display: block;
}

.landing-container {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 40% 40%, #2c2f35 0%, #141619 100%);
  color: #fff;
}
</style>
