/**
 * Layer 3: Layout Structures for Account Service (Tailwind Plugin)
 *
 * Purpose: Define layout structures (flexbox/grid) for account components.
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

export const accountLayer3Plugin = plugin(function ({ addComponents }) {
  addComponents({
    /**
     * AccountLayout Structure
     * - Vertical stack (nav, content)
     * - Full viewport height handled in Layer 2
     */
    ".account-layout-structure": {
      display: "flex",
      flexDirection: "column",
    },

    /**
     * AccountNav Structure
     * - Horizontal layout for navigation items
     * - Items aligned center with gap
     * - Responsive: switches to vertical on mobile
     */
    ".account-nav-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "var(--spacing-3)",
      "@media (max-width: 767px)": {
        flexDirection: "column",
        alignItems: "stretch",
      },
    },

    /**
     * FormField Structure
     * - Vertical stack of label, input, and error message
     * - Items arranged in column
     */
    ".form-field-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-1)",
    },

    /**
     * FormField Group Structure
     * - Vertical stack of multiple form fields
     * - Used for grouping related form fields
     */
    ".form-field-group-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-3)",
    },

    /**
     * Button Group Structure
     * - Horizontal layout for multiple buttons
     * - Items aligned center with gap
     * - Responsive: switches to vertical on mobile
     */
    ".button-group-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "var(--spacing-2)",
      "@media (max-width: 767px)": {
        flexDirection: "column",
        alignItems: "stretch",
      },
    },

    /**
     * Modal Container Structure
     * - Vertical stack of header, body, and footer
     * - Items arranged in column
     */
    ".modal-container-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-4)",
    },

    /**
     * Modal Header Structure
     * - Horizontal layout with title and close button
     * - Title on left, close button on right
     */
    ".modal-header-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--spacing-3)",
    },

    /**
     * FlashMessage Structure
     * - Horizontal layout with icon, text, and close button
     * - Items aligned center with gap
     */
    ".flash-message-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "var(--spacing-3)",
    },

    /**
     * ErrorMessage Structure
     * - Horizontal layout with icon and text
     * - Items aligned center with gap
     */
    ".error-message-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "var(--spacing-2)",
    },

    /**
     * Account Main Content Structure
     * - Flexible height to fill available space
     * - Pushes footer to bottom if needed
     */
    ".account-main-content-structure": {
      flex: "1",
      display: "flex",
      flexDirection: "column",
    },
  });
});

export default accountLayer3Plugin;
