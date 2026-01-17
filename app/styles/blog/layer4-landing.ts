/**
 * Layer 4: Structure Exceptions for Landing Section (Tailwind Plugin)
 *
 * Purpose: Define exceptional structures (animations, keyframes).
 * This layer handles scroll-driven animations for the landing page.
 *
 * Architecture Rules:
 * - Use only when Layer 3 cannot express the structure
 * - Examples: @keyframes, animation sequences
 * - Keep exceptions minimal and well-documented
 */

import plugin from "tailwindcss/plugin";

export const landingLayer4Plugin = plugin(function ({ addComponents }) {
  addComponents({
    /**
     * Animation: fadeInUp
     * - Fade in from bottom with upward movement
     * - Duration: 800ms (from spec.yaml animation.duration_ms)
     * - Easing: cubic-bezier(0.4, 0, 0.2, 1) (from spec.yaml animation.easing)
     */
    "@keyframes fadeInUp": {
      "0%": {
        opacity: "0",
        transform: "translateY(var(--spacing-8))",
      },
      "100%": {
        opacity: "1",
        transform: "translateY(0)",
      },
    },

    ".animate-fadeInUp": {
      animation: "fadeInUp 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
    },

    /**
     * Animation: slideIn
     * - Slide in from left
     * - Duration: 800ms
     * - Easing: cubic-bezier(0.4, 0, 0.2, 1)
     */
    "@keyframes slideIn": {
      "0%": {
        opacity: "0",
        transform: "translateX(-100%)",
      },
      "100%": {
        opacity: "1",
        transform: "translateX(0)",
      },
    },

    ".animate-slideIn": {
      animation: "slideIn 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
    },

    /**
     * Animation: scale
     * - Scale up from small to normal size
     * - Duration: 800ms
     * - Easing: cubic-bezier(0.4, 0, 0.2, 1)
     */
    "@keyframes scale": {
      "0%": {
        opacity: "0",
        transform: "scale(0.8)",
      },
      "100%": {
        opacity: "1",
        transform: "scale(1)",
      },
    },

    ".animate-scale": {
      animation: "scale 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
    },
  });
});

export default landingLayer4Plugin;
