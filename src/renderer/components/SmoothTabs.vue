<template>
  <div class="smooth-tabs">
    <!-- Tab N          visibility:
            activeTabIndex === index ||
            (isAnimating && index === previousTabIndex) ||
            (isAnimating && 
             Math.min(activeTabIndex, previousTabIndex) <= index && 
             index <= Math.max(activeTabIndex, previousTabIndex))
              ? 'visible'
              : 'hidden',tion -->
    <div class="tab-nav" ref="tabNavRef">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTabIndex === index }"
        @click="setActiveTab(index)"
        ref="tabButtons"
      >
        <i v-if="tab.icon" :class="tab.icon"></i>
        <span>{{ tab.title }}</span>
      </div>

      <!-- Active Tab Indicator -->
      <motion.div
        v-if="indicatorStyle"
        class="tab-indicator"
        :initial="{ opacity: 0, scale: 0.8 }"
        :animate="{
          ...indicatorStyle,
          opacity: 1,
          scale: 1,
        }"
        :transition="{
          type: 'spring',
          stiffness: 400,
          damping: 30,
          mass: 0.6,
          opacity: { duration: 0.2 },
          scale: { duration: 0.2 },
        }"
      />
    </div>

    <!-- Tab Content Container -->
    <div class="tab-content-container" ref="contentContainer">
      <motion.div
        v-for="(tab, index) in tabs"
        :key="`tab-${tab.id}-${index}`"
        class="tab-content"
        :class="{ active: activeTabIndex === index }"
        :initial="getInitialPosition(index)"
        :animate="getTabAnimation(index)"
        :transition="getTabTransition(index)"
        :style="{
          pointerEvents: activeTabIndex === index ? 'auto' : 'none',
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          zIndex: getTabAnimation(index).zIndex || 0,
          visibility:
            activeTabIndex === index ||
            (isAnimating && index === previousTabIndex)
              ? 'visible'
              : 'hidden',
        }"
      >
        <slot :name="tab.id" :tab="tab" :active="activeTabIndex === index" />
      </motion.div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from "vue";
import { motion } from "motion-v";

const props = defineProps({
  tabs: {
    type: Array,
    required: true,
    validator: (tabs) => {
      return tabs.every((tab) => tab.id && tab.title);
    },
  },
  defaultTab: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["tab-change"]);

// Reactive data
const activeTabIndex = ref(0);
const previousTabIndex = ref(0);
const tabNavRef = ref(null);
const tabButtons = ref([]);
const contentContainer = ref(null);
const indicatorStyle = ref({
  left: "0px",
  width: "0px",
  height: "0px",
});
const isAnimating = ref(false);

// Initialize active tab
onMounted(() => {
  if (props.defaultTab) {
    const defaultIndex = props.tabs.findIndex(
      (tab) => tab.id === props.defaultTab
    );
    if (defaultIndex !== -1) {
      activeTabIndex.value = defaultIndex;
      previousTabIndex.value = defaultIndex; // Initialize previous to same as active
    }
  }

  // Wait a bit longer for DOM to be fully ready
  setTimeout(() => {
    updateIndicator();
  }, 100);
});

// Watch for active tab changes
watch(activeTabIndex, (newIndex, oldIndex) => {
  previousTabIndex.value = oldIndex;
  updateIndicator();
  emit("tab-change", props.tabs[newIndex]);
});

// Update indicator position and size
const updateIndicator = () => {
  if (
    !tabButtons.value ||
    !tabButtons.value[activeTabIndex.value] ||
    !tabNavRef.value
  )
    return;

  const activeButton = tabButtons.value[activeTabIndex.value];
  const navRect = tabNavRef.value.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();

  indicatorStyle.value = {
    left: `${buttonRect.left - navRect.left}px`,
    width: `${buttonRect.width}px`,
    height: `${buttonRect.height}px`,
  };
};

// Set active tab
const setActiveTab = (index) => {
  if (
    index >= 0 &&
    index < props.tabs.length &&
    index !== activeTabIndex.value &&
    !isAnimating.value
  ) {
    isAnimating.value = true;
    activeTabIndex.value = index;

    // Reset animation flag after longer transition (to account for slow entrance)
    setTimeout(() => {
      isAnimating.value = false;
      updateIndicator();
    }, 900);
  }
};

// Calculate animation properties for each tab
const getTabAnimation = (tabIndex) => {
  const isActive = activeTabIndex.value === tabIndex;
  const wasPrevious = tabIndex === previousTabIndex.value;
  const direction = activeTabIndex.value > previousTabIndex.value ? 1 : -1; // 1 = moving right, -1 = moving left

  // Calculate the "train position" for carousel effect
  const distanceFromActive = tabIndex - activeTabIndex.value;
  const distanceFromPrevious = tabIndex - previousTabIndex.value;
  const baseOffset = distanceFromActive * 400; // Spacing for carousel

  // Determine if tab is in the transition range (between previous and active)
  const isInTransitionRange =
    Math.min(activeTabIndex.value, previousTabIndex.value) <= tabIndex &&
    tabIndex <= Math.max(activeTabIndex.value, previousTabIndex.value);

  if (isActive && !isAnimating.value) {
    // Static active tab (no animation)
    return {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      zIndex: 30,
    };
  } else if (isActive && isAnimating.value) {
    // Active tab moves slowly to center position with ease-out
    return {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      zIndex: 30,
    };
  } else if (wasPrevious && isAnimating.value) {
    // Previous tab exits quickly in OPPOSITE direction of movement
    const exitDistance = direction * -500; // Negative direction for opposite movement
    return {
      opacity: 0,
      x: exitDistance,
      filter: "blur(25px)",
      zIndex: 20,
    };
  } else if (
    isInTransitionRange &&
    isAnimating.value &&
    tabIndex !== activeTabIndex.value
  ) {
    // Intermediate tabs in carousel - swept through quickly in OPPOSITE direction
    const sweepDistance =
      direction * -400 + distanceFromPrevious * direction * -100; // Negative for opposite
    const blurAmount = Math.min(Math.abs(distanceFromPrevious) * 8, 30);
    const sweepOpacity = Math.max(
      0,
      0.4 - Math.abs(distanceFromPrevious) * 0.2
    );

    return {
      opacity: sweepOpacity,
      x: sweepDistance,
      filter: `blur(${blurAmount}px)`,
      zIndex: 15 - Math.abs(distanceFromPrevious),
    };
  } else if (isAnimating.value) {
    // All other tabs - move off screen quickly in OPPOSITE direction
    const trainPosition = baseOffset + direction * 600; // Plus instead of minus for opposite
    return {
      opacity: 0,
      x: trainPosition,
      filter: "blur(30px)",
      zIndex: 0,
    };
  } else {
    // Static hidden tabs positioned off-screen
    const farOffset = distanceFromActive * 500;
    const staticOpacity = distanceFromActive === 0 ? 1 : 0;

    return {
      opacity: staticOpacity,
      x: farOffset,
      filter: distanceFromActive === 0 ? "blur(0px)" : "blur(30px)",
      zIndex: distanceFromActive === 0 ? 30 : 0,
    };
  }
};

// Get initial position for tabs when animation starts
const getInitialPosition = (tabIndex) => {
  const distanceFromPrevious = tabIndex - previousTabIndex.value;
  const direction = activeTabIndex.value > previousTabIndex.value ? 1 : -1;

  if (tabIndex === activeTabIndex.value && isAnimating.value) {
    // New active tab starts from the appropriate side (opposite direction)
    return {
      opacity: 0,
      x: direction * -400, // Come from opposite side
      filter: "blur(8px)", // Start with some blur
    };
  } else if (tabIndex === previousTabIndex.value) {
    // Previous tab starts in center
    return {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
    };
  } else {
    // Other tabs start in their carousel positions
    const baseOffset = distanceFromPrevious * 400;
    return {
      opacity: 0,
      x: baseOffset,
      filter: "blur(30px)",
    };
  }
};

// Get transition timing for each tab
const getTabTransition = (tabIndex) => {
  const isActive = activeTabIndex.value === tabIndex;
  const wasPrevious = tabIndex === previousTabIndex.value;
  const distanceFromPrevious = Math.abs(tabIndex - previousTabIndex.value);
  const isInTransitionRange =
    Math.min(activeTabIndex.value, previousTabIndex.value) <= tabIndex &&
    tabIndex <= Math.max(activeTabIndex.value, previousTabIndex.value);

  if (isActive) {
    // Active tab: slow, smooth entrance with ease-out
    return {
      duration: 0.8, // Longer duration for smooth entrance
      ease: [0.16, 1, 0.3, 1], // Strong ease-out for gentle deceleration
      x: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1], // Smooth horizontal movement
      },
      opacity: {
        duration: 0.6, // Fade in over 0.6s
        ease: [0.4, 0, 0.2, 1], // Gentle opacity transition
      },
      filter: {
        duration: 0.7, // Blur clears over 0.7s
        ease: [0.4, 0, 0.2, 1], // Gentle blur out
      },
    };
  } else if (wasPrevious && isAnimating.value) {
    // Previous tab: quick exit
    return {
      duration: 0.3, // Fast exit
      ease: [0.55, 0.085, 0.68, 0.53], // Sharp ease-in for quick departure
      x: {
        duration: 0.3,
        ease: [0.55, 0.085, 0.68, 0.53], // Quick horizontal movement
      },
      opacity: {
        duration: 0.2, // Quick fade out
        ease: [0.55, 0.085, 0.68, 0.53],
      },
      filter: {
        duration: 0.15, // Very quick blur
        ease: [0.55, 0.085, 0.68, 0.53],
      },
    };
  } else if (
    isInTransitionRange &&
    isAnimating.value &&
    tabIndex !== activeTabIndex.value
  ) {
    // Intermediate tabs in carousel: quick sweep
    const sweepDelay = distanceFromPrevious * 0.03; // Small stagger
    return {
      duration: 0.25, // Very fast sweep
      delay: sweepDelay,
      ease: [0.76, 0, 0.24, 1], // Quick ease for sweep effect
      x: {
        duration: 0.25,
        ease: [0.76, 0, 0.24, 1],
      },
      opacity: {
        duration: 0.2,
        delay: sweepDelay,
        ease: [0.76, 0, 0.24, 1],
      },
      filter: {
        duration: 0.15,
        delay: sweepDelay,
        ease: [0.76, 0, 0.24, 1],
      },
    };
  } else if (isAnimating.value) {
    // All other tabs: instant exit
    return {
      duration: 0.2,
      ease: [0.76, 0, 0.24, 1],
      x: { duration: 0.2 },
      opacity: { duration: 0.1 },
      filter: { duration: 0.1 },
    };
  } else {
    // Static positioning
    return {
      duration: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94],
      x: { duration: 0.1 },
      opacity: { duration: 0.05 },
      filter: { duration: 0.05 },
    };
  }
};

// Expose methods
defineExpose({
  setActiveTab,
  activeTabIndex: () => activeTabIndex.value,
  activeTab: () => props.tabs[activeTabIndex.value],
});
</script>

<style scoped>
.smooth-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.tab-nav {
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.tab-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 450ms
    linear(
      0,
      0.2459,
      0.6526,
      0.9468,
      1.0764,
      1.0915,
      1.0585,
      1.0219,
      0.9993,
      0.9914,
      0.9921,
      0.9957,
      0.9988,
      1.0004,
      1
    );
  z-index: 2;
  white-space: nowrap;
  user-select: none;
  border-radius: 6px 6px 0 0;
}

.tab-button i {
  font-size: 0.85rem;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.tab-button:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}

.tab-button:hover i {
  opacity: 1;
  transform: scale(1.1);
}

.tab-button.active {
  color: white;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 600;
}

.tab-button.active i {
  opacity: 1;
  color: rgba(255, 255, 255, 0.9);
}

.tab-indicator {
  position: absolute;
  top: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(12px);
  border-radius: 6px 6px 0 0;
  z-index: 1;
  pointer-events: none;
  border-bottom: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.tab-content-container {
  position: relative;
  flex: 1;
  background: transparent;
  overflow: hidden;
  transform: translateZ(0); /* Force GPU acceleration */
  perspective: 1000px; /* Enable 3D transforms for better performance */
  /* Allow for carousel overflow during animations */
  contain: layout style;
}

.tab-content {
  width: 100%;
  height: 100%;
  background: transparent;
  color: white;
  transform-origin: center center; /* Center anchor point for horizontal movement */
  will-change: opacity, filter, transform;
  overflow: hidden; /* Prevent content from leaking during animation */
  display: flex;
  align-items: center; /* Ensure content is vertically centered */
}

.tab-content.active {
  position: relative !important;
  visibility: visible !important;
  z-index: 30 !important;
}

/* Ensure smooth hardware acceleration for horizontal movement */
.tab-content {
  backface-visibility: hidden;
  perspective: 1000px;
  transform-style: preserve-3d;
}

/* Enhanced blur effects */
@supports (backdrop-filter: blur(1px)) {
  .tab-nav {
    backdrop-filter: blur(16px);
  }

  .tab-indicator {
    backdrop-filter: blur(12px);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .tab-button {
    padding: 10px 14px;
    font-size: 0.85rem;
    gap: 6px;
  }

  .tab-button span {
    display: none;
  }

  .tab-button i {
    font-size: 1rem;
  }

  .tab-indicator {
    border-bottom-width: 2px;
  }
}

/* Performance optimizations */
.smooth-tabs {
  contain: layout style paint;
}

.tab-content-container {
  transform: translateZ(0); /* Force GPU acceleration */
}

/* Dark theme specific adjustments */
@media (prefers-color-scheme: dark) {
  .tab-nav {
    background: rgba(10, 10, 15, 0.9);
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  .tab-indicator {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 100%
    );
    border-bottom-color: rgba(255, 255, 255, 0.6);
  }
}
</style>
