import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPostsSpec } from '~/data-io/blog/posts/loadPostsSpec';

// Mock generated blog-posts module
vi.mock('~/generated/blog-posts', () => ({
  categories: [
    { id: 1, name: 'Claude Best Practices', emoji: '📚' },
    { id: 2, name: 'ClaudeMix Philosophy', emoji: '🎨' },
    { id: 3, name: 'Tutorials & Use Cases', emoji: '🚀' },
  ],
}));

describe('loadPostsSpec - Side Effects Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadPostsSpec function', () => {
    it('should load categories from generated data', async () => {
      // Act
      const result = await loadPostsSpec();

      // Assert
      expect(result).toBeDefined();
      expect(result.categories).toHaveLength(3);
      expect(result.categories[0]).toEqual({
        id: 1,
        name: 'Claude Best Practices',
        emoji: '📚',
      });
      expect(result.categories[1]).toEqual({
        id: 2,
        name: 'ClaudeMix Philosophy',
        emoji: '🎨',
      });
      expect(result.categories[2]).toEqual({
        id: 3,
        name: 'Tutorials & Use Cases',
        emoji: '🚀',
      });
    });
  });
});