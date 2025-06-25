<template>
  <AnimatePresence>
    <motion.div
      v-if="isVisible"
      class="warp-overlay-root"
      initial="hidden"
      animate="visible"
      exit="hidden"
      :variants="overlayVariants"
      @click="close"
    >
      <!-- Gradient Background Elements -->
      <div class="gradient-container">
        <motion.div
          class="expanding-circle"
          :variants="expandingCircleVariants"
          :style="expandingCircleStyle"
        />
        <motion.div
          class="gradient-circle top-left"
          :variants="gradientCircleVariants"
          :style="topLeftCircleStyle"
        />
        <motion.div
          class="gradient-circle bottom-right"
          :variants="gradientCircleVariants"
          :style="bottomRightCircleStyle"
        />
      </div>

      <!-- Overlay Content -->
      <motion.div
        class="overlay-content"
        :variants="contentVariants"
        :transition="{ duration: 0.35, ease: [0.59, 0, 0.35, 1] }"
      >
        <motion.div
          class="warp-content"
          :variants="warpVariants"
          :transition="springTransition"
          :style="{
            transformPerspective: 1000,
            originX: 0.5,
            originY: 0,
          }"
        >
          <div class="warp-icon">
            <i :class="iconClass" :style="{ color: iconColor }"></i>
          </div>
          <h2 class="warp-title">{{ title }}</h2>
          <p class="warp-message">{{ message }}</p>
        </motion.div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { motion, AnimatePresence, useMotionValue, animate } from "motion-v";

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "success", // 'success' or 'error'
  },
  title: {
    type: String,
    default: "Connected",
  },
  message: {
    type: String,
    default: "Successfully connected to CARLA",
  },
  autoClose: {
    type: Boolean,
    default: true,
  },
  duration: {
    type: Number,
    default: 1500,
  },
});

const emit = defineEmits(["close"]);

// Size reference for overlay calculations
const size = ref({ width: 400, height: 600 });

// Breathing animation for gradient circles
const breathe = useMotionValue(0);

// Computed properties based on type
const color = computed(() =>
  props.type === "success" ? "rgb(76, 175, 80)" : "rgb(244, 67, 54)"
);

const iconClass = computed(() =>
  props.type === "success" ? "pi pi-check-circle" : "pi pi-times-circle"
);

const iconColor = computed(() =>
  props.type === "success" ? "#4CAF50" : "#f44336"
);

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: [0.59, 0, 0.35, 1] },
  },
};

const warpVariants = {
  hidden: {
    rotateX: -15,
    skewY: -2,
    scaleY: 1.8,
    scaleX: 0.3,
    y: 120,
    opacity: 0,
  },
  visible: {
    rotateX: 0,
    skewY: 0,
    scaleY: 1,
    scaleX: 1,
    y: 0,
    opacity: 1,
  },
};

// Gradient circle variants
const expandingCircleVariants = {
  hidden: {
    scale: 0,
    opacity: 1,
  },
  visible: {
    scale: 8,
    opacity: 0.2,
    transition: {
      duration: 0.75,
      opacity: {
        duration: 0.75,
        ease: "easeInOut",
      },
    },
  },
};

const gradientCircleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 0.6,
    transition: { duration: 0.75 },
  },
};

// Dynamic styles for gradient elements
const expandingCircleStyle = computed(() => {
  const radius = size.value.width / 3;
  return {
    left: `calc(50% - ${radius / 2}px)`,
    top: "80%",
    width: `${radius}px`,
    height: `${radius}px`,
    background: color.value.replace("rgb", "rgba").replace(")", ", 0.8)"),
    transformOrigin: "center bottom",
  };
});

const topLeftCircleStyle = computed(() => ({
  width: `${size.value.width * 1.5}px`,
  height: `${size.value.width * 1.5}px`,
  top: `${-size.value.width * 0.5}px`,
  left: `${-size.value.width * 0.5}px`,
  background: color.value.replace("rgb", "rgba").replace(")", ", 0.8)"),
  scale: breathe,
}));

const bottomRightCircleStyle = computed(() => ({
  width: `${size.value.width * 1.5}px`,
  height: `${size.value.width * 1.5}px`,
  top: `${size.value.height - size.value.width * 0.5}px`,
  left: `${size.value.width * 0.2}px`,
  background: color.value.replace("rgb", "rgba").replace(")", ", 0.9)"),
  scale: breathe,
}));

const springTransition = {
  type: "spring",
  damping: 25,
  stiffness: 300,
  duration: 0.9,
};

// Auto close functionality
let autoCloseTimer = null;

const close = () => {
  emit("close");
};

// Start breathing animation when overlay becomes visible
const startBreathingAnimation = async () => {
  // Initial animation
  await animate(breathe, 1, {
    duration: 0.5,
    delay: 0.35,
    ease: [0, 0.55, 0.45, 1],
  });

  // Continuous breathing loop
  animate(breathe, [null, 0.7, 1], {
    duration: 8,
    repeat: Infinity,
    repeatType: "loop",
    ease: "easeInOut",
  });
};

// Watch for visibility changes
watch(
  () => props.isVisible,
  (newValue, oldValue) => {
    if (newValue && !oldValue) {
      startBreathingAnimation();

      if (props.autoClose) {
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        autoCloseTimer = setTimeout(() => {
          close();
        }, props.duration);
      }
    }
  }
);

onUnmounted(() => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
  }
});
</script>

<style scoped>
.warp-overlay-root {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  overflow: hidden;
  cursor: pointer;
}

.overlay-content {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.warp-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  max-width: 300px;
  text-align: center;
}

.warp-icon {
  font-size: 4rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.warp-title {
  color: white;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.warp-message {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  margin: 0;
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.gradient-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
}

.expanding-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(20px);
  transform-origin: center;
  will-change: transform;
}

.gradient-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .warp-content {
    max-width: 250px;
    gap: 1rem;
  }

  .warp-icon {
    font-size: 3rem;
  }

  .warp-title {
    font-size: 1.5rem;
  }

  .warp-message {
    font-size: 0.9rem;
  }
}
</style>
