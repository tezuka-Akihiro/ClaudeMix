/**
 * Unit tests for getActiveNavItem.ts
 * Purpose: Verify active navigation item detection logic (pure function)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getActiveNavItem } from './getActiveNavItem';
import type { NavItem, AccountCommonSpec } from '~/specs/account/types';
import { loadSpec } from '../../../../tests/utils/loadSpec';

describe('getActiveNavItem', () => {
  // Test data loaded from spec
  let navItems: NavItem[] = [];

  beforeAll(async () => {
    const spec = await loadSpec<AccountCommonSpec>('account', 'common');
    navItems = spec.navigation.menu_items;
  });

  describe('Happy Path: Active item detection', () => {
    it('should return first nav item when pathname matches', () => {
      // Arrange
      const firstItem = navItems[0];
      const currentPath = firstItem.path;

      // Act
      const result = getActiveNavItem(navItems, currentPath);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.label).toBe(firstItem.label);
      expect(result?.path).toBe(firstItem.path);
    });

    it('should return third nav item (Subscription) when pathname matches', () => {
      // Arrange
      // In common-spec.yaml, 3rd item is settings and 4th is subscription.
      // Let's find by path to be sure.
      const subscriptionItem = navItems.find(item => item.path === '/account/subscription');
      if (!subscriptionItem) throw new Error('Subscription item not found in spec');
      const currentPath = '/account/subscription';

      // Act
      const result = getActiveNavItem(navItems, currentPath);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.label).toBe(subscriptionItem.label);
      expect(result?.path).toBe('/account/subscription');
    });
  });

  describe('Exact match behavior', () => {
    it('should NOT match /account/settings/profile (partial match)', () => {
      // Arrange
      const currentPath = '/account/settings/profile';

      // Act
      const result = getActiveNavItem(navItems, currentPath);

      // Assert
      // No exact match for /account/settings/profile, should return null
      expect(result).toBeNull();
    });

    it('should NOT match /account/ with trailing slash', () => {
      // Arrange
      const currentPath = '/account/';

      // Act
      const result = getActiveNavItem(navItems, currentPath);

      // Assert
      expect(result).toBeNull(); // Exact match only
    });

    it('should match exact path even with query parameters', () => {
      // Arrange
      const currentPath = '/account?tab=overview';

      // Act - Should strip query params before matching
      const result = getActiveNavItem(navItems, currentPath);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.label).toBe('マイページ');
    });
  });

  describe('Edge Cases: Invalid or empty inputs', () => {
    it('should return null when pathname does not match any item', () => {
      // Arrange
      const currentPath = '/other-page';

      // Act
      const result = getActiveNavItem(navItems, currentPath);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when navItems is empty array', () => {
      // Arrange
      const emptyNavItems: NavItem[] = [];
      const currentPath = '/account';

      // Act
      const result = getActiveNavItem(emptyNavItems, currentPath);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when pathname is empty string', () => {
      // Arrange
      const currentPath = '';

      // Act
      const result = getActiveNavItem(navItems, currentPath);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle pathname with hash fragment', () => {
      // Arrange
      const currentPath = '/account#section';

      // Act - Should strip hash before matching
      const result = getActiveNavItem(navItems, currentPath);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.label).toBe('マイページ');
    });
  });

  describe('Case sensitivity', () => {
    it('should be case-sensitive (no match for uppercase path)', () => {
      // Arrange
      const currentPath = '/ACCOUNT';

      // Act
      const result = getActiveNavItem(navItems, currentPath);

      // Assert
      expect(result).toBeNull(); // Case-sensitive exact match
    });
  });

  describe('First match wins', () => {
    it('should return first matching item when multiple items have same path', () => {
      // Arrange
      const duplicateNavItems: NavItem[] = [
        { label: 'First', path: '/account', icon: 'home' },
        { label: 'Second', path: '/account', icon: 'home2' },
      ];
      const currentPath = '/account';

      // Act
      const result = getActiveNavItem(duplicateNavItems, currentPath);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.label).toBe('First'); // First match wins
    });
  });
});
