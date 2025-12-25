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
     * Authentication Container Structure
     * - Full viewport height centering container
     * - Centers child content both vertically and horizontally
     */
    ".auth-container-structure": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },

    /**
     * Authentication Card Structure
     * - Vertical stack for form elements
     * - Fixed max width for readability
     */
    ".auth-card-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-4)",
    },

    /**
     * Authentication Form Structure
     * - Vertical stack of form fields
     */
    ".auth-form-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-3)",
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

    /**
     * Profile Container Structure
     * - Vertical stack of profile sections
     * - Max width for readability
     */
    ".profile-container-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-4)",
    },

    /**
     * Profile Section Structure
     * - Vertical stack of section title and content
     */
    ".profile-section-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-3)",
    },

    /**
     * Profile Info Items Structure
     * - Vertical stack of info items
     */
    ".profile-info-structure": {
      display: "flex",
      flexDirection: "column",
    },

    /**
     * Profile Actions Structure
     * - Vertical stack of action buttons
     */
    ".profile-actions-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-2)",
    },

    /**
     * Profile Modal Overlay Structure
     * - Full viewport overlay for modal backdrop
     * - Centers modal content
     */
    ".profile-modal-overlay-structure": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    /**
     * Profile Modal Structure
     * - Vertical stack of modal header, body, and footer
     */
    ".profile-modal-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-4)",
    },

    /**
     * Profile Form Field Structure
     * - Vertical stack of label, input, and error
     */
    ".profile-form-field-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-1)",
    },

    /**
     * Profile Modal Buttons Structure
     * - Horizontal layout for modal action buttons
     * - Responsive: stack on mobile
     */
    ".profile-modal-buttons-structure": {
      display: "flex",
      flexDirection: "row",
      gap: "var(--spacing-3)",
      "@media (max-width: 767px)": {
        flexDirection: "column",
      },
    },
  });
});

export default accountLayer3Plugin;
