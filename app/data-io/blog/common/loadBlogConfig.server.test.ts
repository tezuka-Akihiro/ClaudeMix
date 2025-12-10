import { describe, it, expect, beforeAll } from 'vitest';
import { loadBlogConfig } from '../../../data-io/blog/common/loadBlogConfig.server';
import { loadSpec } from '../../../../tests/utils/loadSpec';
import type { BlogCommonSpec } from '../../../specs/blog/types';

describe('loadBlogConfig - Side Effects Layer', () => {
  let spec: BlogCommonSpec;

  beforeAll(async () => {
    // Load spec.yaml dynamically to ensure tests stay in sync with spec
    spec = await loadSpec<BlogCommonSpec>('blog', 'common');
  });

  describe('loadBlogConfig function', () => {
    it('should return correct blog title', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.blogTitle).toBe(spec.blog_config.title);
    });

    it('should return valid menu items from spec.yaml', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.menuItems).toHaveLength(spec.navigation.menu_items.length);
      result.menuItems.forEach((
        item: { label: string; path: string },
        index: number,
      ) => {
        expect(item).toHaveProperty('label');
        expect(typeof item.label).toBe('string');
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.path).toMatch(/^\/blog/);
        expect(item.label).toBe(spec.navigation.menu_items[index].label);
        expect(item.path).toBe(spec.navigation.menu_items[index].path);
      });
    });

    it('should return copyright from spec.yaml', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.copyright).toBe(spec.blog_config.copyright);
    });

    it('should return complete blog config structure', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result).toHaveProperty('blogTitle');
      expect(result).toHaveProperty('menuItems');
      expect(result).toHaveProperty('copyright');
      expect(Array.isArray(result.menuItems)).toBe(true);
    });
  });
});
