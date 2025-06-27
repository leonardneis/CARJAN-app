<template>
  <div class="main-menu" :class="{ 'fade-in': isLoaded, leaving: isLeaving }">
    <!-- Vanta.js Background -->
    <div ref="vantaRef" class="vanta-background"></div>

    <div class="menu-background">
      <!-- Logo/Title Section -->
      <div class="game-title">
        <img
          src="../assets/img/carjan_alpha.png"
          class="logo-img"
          alt="CARLA"
        />
      </div>

      <!-- Main Menu Buttons -->
      <div class="main-buttons">
        <Button
          label="Editor"
          @click="goToScenarios"
          class="menu-button secondary-button"
          size="large"
        />
        <Button
          label="Maps"
          @click="showMapsComingSoon"
          class="menu-button secondary-button"
          size="large"
        />
        <Button
          label="Carla"
          @click="goToCarla"
          class="menu-button secondary-button"
          size="large"
        />
        <div class="button-separator"></div>
        <div class="bottom-buttons">
          <Button
            label="Settings"
            @click="goToSettings"
            class="menu-button settings-button"
            size="large"
          />
          <Button
            label="Quit"
            @click="quitApplication"
            class="menu-button quit-button"
            size="large"
          />
        </div>
      </div>

      <!-- Bottom Info -->
      <div class="bottom-left-info" tabindex="-1" role="presentation">
        <span class="version-info">CARJAN pre-alpha</span>
      </div>
      <div class="bottom-right-info" tabindex="-1" role="presentation">
        <span class="copyright">© 2025 Leonard Neis</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import {
  initVantaDots,
  pauseVantaEffect,
  destroyVantaEffect,
} from "../services/vantaService.js";

const router = useRouter();
const toast = useToast();

// Vanta.js setup
const vantaRef = ref(null);
const isLeaving = ref(false);
const isLoaded = ref(false);

onMounted(async () => {
  // Trigger fade-in animation
  setTimeout(() => {
    isLoaded.value = true;
  }, 100);

  // Wait a bit for the DOM to be ready
  setTimeout(async () => {
    if (vantaRef.value) {
      try {
        await initVantaDots(vantaRef.value);
      } catch (error) {
        console.error("Failed to initialize Vanta effect:", error);
      }
    }
  }, 200);
});

// Handle route leaving to gracefully stop VantaJS
onBeforeRouteLeave((to, from, next) => {
  isLeaving.value = true;
  // Allow the navigation to proceed immediately
  next();
});

onUnmounted(() => {
  // Only destroy vanta if we're actually leaving
  if (isLeaving.value) {
    // Delay vanta destruction to allow for transition
    setTimeout(() => {
      destroyVantaEffect();
    }, 400); // A bit longer than the fade-leave-active (300ms)
  } else {
    // Immediate destruction if component is being destroyed for other reasons
    destroyVantaEffect();
  }
});

const goToScenarios = () => {
  isLeaving.value = true;
  // Small delay to allow the leaving animation to start
  setTimeout(() => {
    router.push("/scenario-selection");
  }, 50);
};

const goToCarla = () => {
  //   router.push("/carjan");
  toast.add({
    severity: "success",
    summary: "Coming Soon",
    detail: "Carla functionality is coming soon!",
    life: 3000,
  });
};

const goToSettings = () => {
  isLeaving.value = true;
  setTimeout(() => {
    router.push("/settings");
  }, 50);
};

const showMapsComingSoon = () => {
  toast.add({
    severity: "info",
    summary: "Coming Soon",
    detail: "Map editor functionality is coming soon!",
    life: 3000,
  });
};

const quitApplication = () => {
  // For Electron app, we would close the window
  if (window.electronAPI) {
    window.electronAPI.closeApp();
  } else {
    // Fallback for web version
    window.close();
  }
};
</script>

<style scoped>
.main-menu {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transition: opacity 1s ease-in;
}

.main-menu.fade-in {
  opacity: 1;
}

.main-menu.leaving {
  transition: all 0.3s ease;
}

.main-menu.leaving .vanta-background {
  transition: opacity 0.3s ease;
  opacity: 0;
}

.main-menu.leaving .menu-background {
  transition: opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
}

.vanta-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.menu-background {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  z-index: 1;
  position: relative;
}

.game-title {
  text-align: center;
}

.logo-img {
  height: auto;
  filter: drop-shadow(0 0 15px rgba(74, 144, 226, 0.4))
    drop-shadow(0 0 30px rgba(74, 144, 226, 0.2));
  transition: filter 0.3s ease;
}

.logo-img:hover {
  filter: drop-shadow(0 0 20px rgba(74, 144, 226, 0.6))
    drop-shadow(0 0 40px rgba(74, 144, 226, 0.3));
}

.title-text {
  font-size: 4rem;
  font-weight: bold;
  color: white;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3),
    0 0 20px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1);
  letter-spacing: 4px;
}

.subtitle-text {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0.5rem 0 0 0;
  letter-spacing: 2px;
}

.main-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 300px;
}

.bottom-buttons {
  display: flex;
  gap: 1rem;
}

.menu-button {
  height: 48px;
  font-size: 1.2rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.settings-button {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  backdrop-filter: blur(10px);
  flex: 1;
}

.settings-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.primary-button {
  background: linear-gradient(145deg, #4a90e2, #357abd) !important;
  border: 2px solid #357abd !important;
  color: white !important;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}

.primary-button:hover {
  background: linear-gradient(145deg, #5ba0f2, #4a8acd) !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
}

.secondary-button {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  backdrop-filter: blur(10px);
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.quit-button {
  background: rgba(220, 53, 69, 0.8) !important;
  border: 2px solid #dc3545 !important;
  color: white !important;
  flex: 1;
}

.quit-button:hover {
  background: rgba(220, 53, 69, 1) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);
}

.button-separator {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  margin: 0.5rem 0;
}

.bottom-left-info {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 10;
  pointer-events: none;
  user-select: none;
}

.bottom-right-info {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 10;
  pointer-events: none;
  user-select: none;
}

.version-info,
.copyright {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  pointer-events: none;
  user-select: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .title-text {
    font-size: 3rem;
  }

  .main-buttons {
    min-width: 250px;
  }

  .menu-button {
    height: 44px;
    font-size: 1rem;
  }
}
</style>
