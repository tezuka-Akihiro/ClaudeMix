/**
 * getActiveNavItem.ts
 * Purpose: Determine which navigation item is active based on current pathname
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility アクティブナビゲーション項目の判定（副作用なし）
 */

import type { NavItem } from '~/specs/account/types';

/**
 * Get the active navigation item based on current pathname
 *
 * Uses exact match strategy (as specified in common-spec.yaml)
 * Strips query parameters and hash fragments before matching
 *
 * @param navItems - Array of navigation items
 * @param currentPath - Current pathname (e.g., "/account/settings")
 * @returns Active NavItem or null if no match found
 */
export function getActiveNavItem(
  navItems: NavItem[],
  currentPath: string
): NavItem | null {
  // Strip query parameters and hash fragments
  const cleanPath = currentPath.split('?')[0].split('#')[0];

  // Find first exact match
  const activeItem = navItems.find((item) => item.path === cleanPath);

  return activeItem || null;
}
