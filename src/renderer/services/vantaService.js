// vantaService.js - Plain JavaScript Vanta.js initialization
import * as THREE from "three";

// Global THREE setup for Vanta.js
window.THREE = THREE;

let vantaEffect = null;

export const initVantaDots = (element) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure element exists
      if (!element) {
        throw new Error("Element not found");
      }

      // Import DOTS dynamically to ensure proper loading
      import("vanta/dist/vanta.dots.min")
        .then((DOTS) => {
          try {
            // Initialize DOTS effect like in CodePen
            vantaEffect = DOTS.default({
              el: element,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 50.0,
              minWidth: 50.0,
              scale: 1.0,
              scaleMobile: 1.0,
              color: 0xfafafa, // Blue dots
              backgroundColor: 0x0a0a0a, // Dark background
              size: 2,
              spacing: 15.0,
              showLines: false,
            });

            console.log("DOTS effect initialized successfully!");
            resolve(vantaEffect);
          } catch (dotsError) {
            console.warn("DOTS failed, trying NET fallback:", dotsError);

            // Fallback to NET
            import("vanta/dist/vanta.net.min").then((NET) => {
              try {
                vantaEffect = NET.default({
                  el: element,
                  mouseControls: true,
                  touchControls: true,
                  gyroControls: false,
                  minHeight: 200.0,
                  minWidth: 200.0,
                  scale: 1.0,
                  scaleMobile: 1.0,
                  color: 0x4a90e2,
                  backgroundColor: 0x0a0a0a,
                  points: 8.0,
                  maxDistance: 25.0,
                  spacing: 20.0,
                });

                console.log("NET fallback initialized!");
                resolve(vantaEffect);
              } catch (netError) {
                console.warn("NET also failed, using CSS fallback:", netError);

                // CSS fallback
                createCSSDotsEffect(element);
                resolve(null);
              }
            });
          }
        })
        .catch((importError) => {
          console.warn("Failed to import DOTS, trying NET:", importError);

          // Try NET if DOTS import fails
          import("vanta/dist/vanta.net.min")
            .then((NET) => {
              vantaEffect = NET.default({
                el: element,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                color: 0x4a90e2,
                backgroundColor: 0x0a0a0a,
              });

              console.log("NET fallback (import error) initialized!");
              resolve(vantaEffect);
            })
            .catch(() => {
              createCSSDotsEffect(element);
              resolve(null);
            });
        });
    } catch (error) {
      console.error("Vanta initialization failed:", error);
      createCSSDotsEffect(element);
      resolve(null);
    }
  });
};

const createCSSDotsEffect = (element) => {
  if (!element) return;

  element.innerHTML = `
    <div class="custom-dots-background">
      ${Array.from(
        { length: 50 },
        (_, i) =>
          `<div class="css-dot" style="
          left: ${Math.random() * 100}%; 
          top: ${Math.random() * 100}%; 
          animation-delay: ${Math.random() * 3}s;
        "></div>`
      ).join("")}
    </div>
  `;

  element.style.background =
    "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)";

  // Add CSS styles dynamically
  if (!document.getElementById("css-dots-style")) {
    const style = document.createElement("style");
    style.id = "css-dots-style";
    style.textContent = `
      .custom-dots-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      
      .css-dot {
        position: absolute;
        width: 3px;
        height: 3px;
        background: #4a90e2;
        border-radius: 50%;
        animation: floatDot 6s ease-in-out infinite;
        opacity: 0.8;
      }
      
      @keyframes floatDot {
        0%, 100% {
          transform: translateY(0px) scale(1);
          opacity: 0.8;
        }
        50% {
          transform: translateY(-20px) scale(1.2);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  console.log("CSS dots fallback created!");
};

export const pauseVantaEffect = () => {
  if (vantaEffect) {
    // Try to pause the animation if the method exists
    if (typeof vantaEffect.pause === "function") {
      vantaEffect.pause();
    } else if (vantaEffect.uniforms) {
      // For some Vanta effects, we can stop animation by setting time scale to 0
      if (vantaEffect.uniforms.uTime) {
        vantaEffect.options.speed = 0;
      }
    }
  }
};

export const destroyVantaEffect = () => {
  if (vantaEffect && typeof vantaEffect.destroy === "function") {
    vantaEffect.destroy();
    vantaEffect = null;
  }
};

export default {
  initVantaDots,
  pauseVantaEffect,
  destroyVantaEffect,
};
