import { describe, it, expect, beforeAll } from 'vitest';
import { getCategoryEmoji } from '~/lib/blog/posts/categoryUtils';
import { loadBlogPostsSpec, type BlogPostsSpec } from '../../../../tests/e2e/utils/loadSpec';

describe('categoryUtils', () => {
  let spec: BlogPostsSpec;

  beforeAll(async () => {
    spec = await loadBlogPostsSpec();
  });

  describe('getCategoryEmoji', () => {
    it('should return correct emoji for each category from spec.yaml', () => {
      // Arrange & Act & Assert
      spec.categories.forEach(category => {
        const emoji = getCategoryEmoji(category.name);
        expect(emoji).toBe(category.emoji);
      });
    });

    it('should return default emoji for unknown category', async () => {
      // Act
      const emoji = getCategoryEmoji('Unknown Category');

      // Assert
      expect(emoji).toBe(spec.business_rules.display.default_category_emoji);
    });

    it('should handle empty string', async () => {
      // Act
      const emoji = getCategoryEmoji('');

      // Assert
      expect(emoji).toBe(spec.business_rules.display.default_category_emoji);
    });
  });
});
