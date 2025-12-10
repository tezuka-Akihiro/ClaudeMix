import { describe, it, expect } from 'vitest';
import { loadBlogConfig } from '~/data-io/blog/common/loadBlogConfig.server';

describe('loadBlogConfig - Side Effects Layer', () => {
  describe('loadBlogConfig function', () => {
    it('should return correct blog title', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.blogTitle).toBe("ClaudeMix Blog");
    });

    it('should return valid menu items', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.menuItems).toHaveLength(3);
      result.menuItems.forEach((item) => {
        expect(item).toHaveProperty('label');
        expect(typeof item.label).toBe('string');
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.path).toMatch(/^\/blog\//);
      });
    });

    it('should return copyright with current year', async () => {
      // Arrange
      const currentYear = new Date().getFullYear();

      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.copyright).toBe(`© ${currentYear} ClaudeMix`);
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
