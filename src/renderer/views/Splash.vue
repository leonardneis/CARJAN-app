<template>
  <div class="splash-container" :class="{ 'fade-out': isTransitioning }">
    <div class="splash-content">
      <div class="logo-reveal">
        <img
          src="../assets/img/carjan_alpha.png"
          class="splash-logo"
          alt="CARJAN"
        />
      </div>
      <div class="loading-indicator">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p class="loading-text">Loading CARJAN...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isTransitioning = ref(false);

onMounted(() => {
  // Show splash for longer since we have reveal animation + loading delay
  setTimeout(() => {
    isTransitioning.value = true;

    // Wait for fade-out animation to complete before navigating
    setTimeout(() => {
      router.replace({ name: "MainMenu" });
    }, 800); // Match the CSS transition duration
  }, 4000); // Increased to 4 seconds for reveal (2.5s) + loading (1.5s)
});
</script>

<style scoped>
.splash-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
  position: relative;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.8s ease-out;
}

.splash-container.fade-out {
  opacity: 0;
}

.splash-content {
  text-align: center;
  animation: slideInUp 1s ease-out;
}

.logo-reveal {
  margin-bottom: 3rem;
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.splash-logo {
  max-width: 400px;
  height: auto;
  display: block;
  filter: drop-shadow(0 0 20px rgba(74, 144, 226, 0.3));
  clip-path: inset(0 100% 0 0);
  animation: revealLogo 2.5s ease-in-out forwards;
}

.loading-indicator {
  margin-top: 2rem;
  opacity: 0;
  animation: showLoading 1s ease-in forwards;
  animation-delay: 2.5s;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 1rem;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #4a90e2;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.3s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.6s;
}

.loading-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  margin: 0;
  letter-spacing: 1px;
  animation: textFade 2s ease-in-out;
}

/* Animations */
@keyframes slideInUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes showLoading {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes revealLogo {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0% 0 0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

@keyframes textFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.7;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .splash-logo {
    max-width: 320px;
  }

  .loading-text {
    font-size: 1rem;
  }
}
</style>
