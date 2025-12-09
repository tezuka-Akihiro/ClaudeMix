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

    it('should return correct menu items', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.menuItems).toHaveLength(3);
      expect(result.menuItems[0]).toEqual({
        label: "はじめまして",
        path: "/blog/hazimemasite",
      });
      expect(result.menuItems[1]).toEqual({
        label: "hello world",
        path: "/blog/welcome",
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
