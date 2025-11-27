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
     * - Centered content
     * - Uses flex-grow on main content to push footer to bottom
     */
    ".blog-footer-structure": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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
     * - Horizontal layout with two areas
     * - Left: Category emoji
     * - Right: Card content (title and date)
     */
    ".post-card-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
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
     * Pagination Structure
     * - Horizontal layout with centered alignment
     * - Left: Previous button
     * - Center: Page numbers
     * - Right: Next button
     */
    ".pagination-nav-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--spacing-4)",
    },

    /**
     * Pagination Numbers Container Structure
     * - Horizontal layout for page numbers
     * - Numbers arranged in a row with gap
     */
    ".pagination-numbers-structure": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "var(--spacing-2)",
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
      display: "grid",
      gridTemplateColumns: "repeat(var(--tag-grid-columns, 3), minmax(0, 1fr))",
      gap: "var(--spacing-2)",
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
  });
});

export default blogLayer3Plugin;
