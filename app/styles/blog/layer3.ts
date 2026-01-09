/**
 * Layer 3: Layout Structures for Blog Service (Tailwind Plugin)
 *
 * Purpose: Define layout structures (flexbox/grid) for blog components.
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

export const blogLayer3Plugin = plugin(function ({ addComponents }) {
  addComponents({
    /**
     * BlogLayout Structure
     * - Vertical stack (header, content, footer)
     * - Full viewport height handled in Layer 2
     */
    ".blog-layout-structure": {
      display: "flex",
      flexDirection: "column",
    },

    /**
     * BlogHeader Structure
     * - Horizontal layout with two areas
     * - Left: Title area
     * - Right: Menu button area
     * - Uses justify-between for left/right alignment
     */
    ".blog-header-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--spacing-3)",
    },

    /**
     * BlogHeader Actions Structure
     * - Horizontal layout for theme button and menu button
     * - Items aligned center with gap
     */
    ".blog-header__actions": {
      display: "flex",
      alignItems: "center",
      gap: "var(--spacing-2)",
    },

    /**
     * BlogHeader Theme Button Structure
     * - Centered layout for theme icon
     * - Icon centered both vertically and horizontally
     */
    ".blog-header__theme-button": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    /**
     * NavigationMenu Structure
     * - Vertical stack of menu items
     * - Items arranged in column
     */
    ".navigation-menu-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-1)",
    },

    /**
     * BlogFooter Structure
     * - Vertical stack layout
     * - Centered content
     */
    ".blog-footer-structure": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--spacing-2)",
    },

    /**
     * BlogFooter Links Structure
     * - Horizontal layout for footer links
     * - Wraps to next line when needed
     * - Centered alignment
     */
    ".blog-footer__links-structure": {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--spacing-4)",
    },

    /**
     * Main Content Area Structure
     * - Flexible height to fill available space
     * - Pushes footer to bottom
     */
    ".blog-main-content-structure": {
      flex: "1",
      display: "flex",
      flexDirection: "column",
    },

    /**
     * PostDetailSection Structure
     * - Vertical stack layout
     * - Metadata area on top, content area below
     */
    ".post-detail-section-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-3)",
    },

    /**
     * Article Metadata Container Structure
     * - Vertical stack of metadata items (title, author, date)
     */
    ".post-detail-section__meta-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-2)",
    },

    /**
     * Article Content Container Structure
     * - Single column layout for prose content
     * - No explicit flex needed as prose content flows naturally
     */
    ".post-detail-section__content-structure": {
      // No structural properties needed
      // Content flows naturally with prose styling
    },

    /**
     * Mermaid Diagram Container Structure
     * - Centered horizontal layout for diagrams
     * - Used within post detail content area
     */
    ".post-detail-section__content .mermaid": {
      display: "flex",
      justifyContent: "center",
    },

    /**
     * PostCardGrid Structure
     * - Responsive grid layout for post cards
     * - Mobile (< 768px): 1 column
     * - Tablet (768px ~ 1024px): 2 columns
     * - Desktop (> 1024px): 3 columns
     */
    ".post-card-grid": {
      display: "grid",
      gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
      gap: "var(--spacing-3)",
      "@media (min-width: 768px)": {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      },
      "@media (min-width: 1024px)": {
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      },
    },

    /**
     * PostCard Structure
     * - Vertical layout with two areas
     * - Top: Category emoji
     * - Bottom: Card content (title and date)
     */
    ".post-card-structure": {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "var(--spacing-3)",
    },

    /**
     * PostCard Content Structure
     * - Vertical stack of title and date
     */
    ".post-card__content-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-2)",
      flex: "1",
    },

    /**
     * LoadMoreButton Container Structure
     * - Centered layout for load more button
     * - Button positioned at the center
     */
    ".load-more-container-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    /**
     * FilterPanel Content Structure
     * - Vertical stack of filter components
     * - Order: CategorySelector, TagGrid, FilterSubmitButton
     */
    ".filter-panel-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-4)",
    },

    /**
     * TagGrid Structure
     * - Grid layout for tag buttons
     * - Columns: Configurable via CSS variable (default: 3)
     * - Responsive: adjusts based on container width
     */
    ".tag-grid-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-4)", // グループ間のマージン
    },

    /**
     * TagGroupContainer Structure
     * - Vertical stack of group header and tag grid
     */
    ".tag-group-container-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-2)", // ヘッダーとグリッドの間隔
    },

    /**
     * TagGroupGrid Structure
     * - Flex layout for tags within a group
     * - Tags will size according to their text content
     * - Center aligned for visual balance
     */
    ".tag-group-grid-structure": {
      display: "flex",
      flexWrap: "wrap",
      gap: "var(--spacing-2)",
      justifyContent: "left",
    },

    /**
     * Tag Badge List Structure
     * - Horizontal layout for displaying multiple tag badges
     * - Wraps to next line when needed
     * - Used in PostCard and Post Detail
     */
    ".tag-list-structure": {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: "var(--spacing-2)",
    },

    /**
     * CategorySelector Button Structure
     * - Horizontal layout for button content
     * - Text on left, icon on right
     */
    ".category-selector__button-structure": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },

    /**
     * CategorySelector Item Structure
     * - Horizontal layout for menu items
     * - Centered vertically
     */
    ".category-selector__item-structure": {
      display: "flex",
      alignItems: "center",
    },

    /**
     * LegalModal Overlay Structure
     * - Full screen overlay
     * - Centers the modal dialog
     */
    ".legal-modal__overlay-structure": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    /**
     * LegalModal Dialog Structure
     * - Vertical stack layout for dialog content
     */
    ".legal-modal__dialog-structure": {
      display: "flex",
      flexDirection: "column",
    },

    /**
     * LegalModal Header Structure
     * - Horizontal layout for header
     * - Title on left, close button on right
     */
    ".legal-modal__header-structure": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },

    /**
     * LegalModal Close Button Structure
     * - Centered layout for close button icon
     */
    ".legal-modal__close-button-structure": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    /**
     * Subscription Plans Structure
     * - Vertical stack layout for subscription plans
     */
    ".subscription-plans-structure": {
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-2)",
    },

    /**
     * Subscription Plan Structure
     * - Horizontal layout for plan details
     * - Duration on left, price on right
     */
    ".subscription-plan-structure": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
  });
});

export default blogLayer3Plugin;
