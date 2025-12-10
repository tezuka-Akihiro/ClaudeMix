import { describe, it, expect, beforeAll } from 'vitest';
import { getCategoryEmoji } from '~/lib/blog/posts/categoryUtils';
import { loadSpec, type BlogPostsSpec } from '../../../../tests/utils/loadSpec';

describe('categoryUtils', () => {
  let spec: BlogPostsSpec;

  beforeAll(async () => {
    spec = await loadSpec('blog','posts');
  });

  describe('getCategoryEmoji', () => {
    it('should return correct emoji for each category from spec.yaml', () => {
      // Arrange & Act & Assert
      spec.categories.forEach(category => {
        const emoji = getCategoryEmoji(
          category.name,
          spec.categories,
          spec.business_rules.display.default_category_emoji
        );
        expect(emoji).toBe(category.emoji);
      });
    });

    it('should return default emoji for unknown category', async () => {
      // Act
      const emoji = getCategoryEmoji(
        'Unknown Category',
        spec.categories,
        spec.business_rules.display.default_category_emoji
      );

      // Assert
      expect(emoji).toBe(spec.business_rules.display.default_category_emoji);
    });

    it('should handle empty string', async () => {
      // Act
      const emoji = getCategoryEmoji(
        '',
        spec.categories,
        spec.business_rules.display.default_category_emoji
      );

      // Assert
      expect(emoji).toBe(spec.business_rules.display.default_category_emoji);
    });
  });
});
