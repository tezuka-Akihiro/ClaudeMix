/**
 * Layer 3: Layout Structures for Landing Section (Tailwind Plugin)
 *
 * Purpose: Define layout structures (flexbox/grid) for landing page components.
 * This layer focuses on the arrangement and positioning of elements.
 *
 * Architecture Rules:
 * - Define only layout structures using addComponents
 * - Use flexbox/grid for parent-child relationships
 * - Use gap for spacing (NO margin)
 * - No visual styling (colors, fonts, etc.) - those belong in Layer 2
 * - Components should be composable with Layer 2 styling classes
 */

import plugin from "tailwindcss/plugin";

export const landingLayer3Plugin = plugin(function ({ addComponents }) {
  addComponents({
    /**
     * HeroSection Structure
     * - Vertical stack (manga panels, catch copy)
     * - Centered alignment
     */
    ".hero-section-structure": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--spacing-6)",
    },

    /**
     * ScrollSection Structure
     * - Vertical stack for animated blocks
     * - Centered alignment
     */
    ".scroll-section-structure": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "var(--spacing-8)",
    },

    /**
     * MangaPanelGrid Structure
     * - CSS Grid layout
     * - Single column layout for all devices
     */
    ".page-manga-panel-grid-structure": {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "var(--spacing-6)",
    },

    /**
     * CTASection Structure
     * - Horizontal layout (desktop) / Vertical layout (mobile)
     * - Centered alignment
     * - Responsive direction change
     */
    ".cta-section-structure": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--spacing-4)",

      "@media (min-width: 640px)": {
        flexDirection: "row",
        gap: "var(--spacing-6)",
      },
    },
    // LandingFooter uses blog-footer-structure from layer3.ts
  });
});

export default landingLayer3Plugin;
