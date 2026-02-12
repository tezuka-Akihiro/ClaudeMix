/**
 * Layer 4: Structure Exceptions for Blog Service (Tailwind Plugin)
 *
 * Purpose: Define exceptional structures (pseudo-elements, descendant selectors, animations).
 * This layer handles cases that cannot be expressed in Layer 3.
 *
 * Architecture Rules:
 * - Use only when Layer 3 cannot express the structure
 * - Examples: ::before, ::after, :hover animations, complex child selectors
 * - Keep exceptions minimal and well-documented
 */

import plugin from "tailwindcss/plugin";

export const blogLayer4Plugin = plugin(function ({ addComponents }) {
  addComponents({
    "@keyframes dropdownFadeIn": {
      from: {
        opacity: "0",
        transform: "translateY(calc(-1 * var(--spacing-1)))",
      },
      to: {
        opacity: "1",
        transform: "translateY(0)",
      },
    },
    ".navigation-menu": {
      animation:
        "dropdownFadeIn var(--transition-duration-fast) var(--transition-timing-function-default)",
    },
    ".category-selector__menu": {
      animation:
        "dropdownFadeIn var(--transition-duration-fast) var(--transition-timing-function-default)",
    },
  });
});

export default blogLayer4Plugin;
