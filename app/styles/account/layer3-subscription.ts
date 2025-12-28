/**
 * layer3-subscription.ts
 * Purpose: Subscription section layout structures (flexbox/grid only)
 *
 * @layer Layer 3 (フレックスとグリッド構造のみ)
 * @responsibility display, flex-direction, gap, grid properties ONLY
 */

export const subscriptionLayer3 = {
  // Button group layout
  '.subscription-button-group': {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: 'var(--spacing-3)',
  },

  // Responsive: Stack buttons on mobile
  '@media (max-width: 768px)': {
    '.subscription-button-group': {
      flexDirection: 'column' as const,
      gap: 'var(--spacing-2)',
    },
  },
};
