import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { fetchAvailableFilters } from './fetchAvailableFilters.server';
import { loadPostsSpec } from './loadPostsSpec.server';
import { groupTags } from '~/lib/blog/posts/groupTagsByCategory';
import { loadSpec, type BlogPostsSpec } from '../../../../tests/utils/loadSpec';

// Mock dependencies
vi.mock('./loadPostsSpec.server', () => ({
  loadPostsSpec: vi.fn(),
}));
vi.mock('~/lib/blog/posts/groupTagsByCategory', () => ({
  groupTags: vi.fn(),
}));

describe('fetchAvailableFilters - Side Effects Layer', () => {
  let spec: BlogPostsSpec;

  beforeAll(async () => {
    // Load spec.yaml dynamically to ensure tests stay in sync with spec
    spec = await loadSpec('blog', 'posts');
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to a default behavior - use spec.yaml values
    vi.mocked(loadPostsSpec).mockReturnValue({
      categories: spec.categories,
      tags: spec.tags,
      tag_groups: { order: spec.tag_groups.order },
    } as any);
    vi.mocked(groupTags).mockReturnValue([]);
  });

  describe('fetchAvailableFilters function', () => {
    it('should return all categories defined in spec.yaml', async () => {
      // Arrange - spec.yamlに定義されている全カテゴリを期待値として使用
      const expectedCategories = spec.categories.map(cat => cat.name);

      // Act
      const result = await fetchAvailableFilters();

      // Assert
      expect(result.categories).toEqual(expectedCategories);
      expect(result.categories).toContain('起業'); // 新しく追加されたカテゴリを確認
    });

    it('should return all tags defined in spec.yaml sorted alphabetically', async () => {
      // Arrange - spec.yamlに定義されている全タグを期待値として使用
      const expectedTags = spec.tags.map(t => t.name).sort();

      // Act
      const result = await fetchAvailableFilters();

      // Assert
      expect(result.tags).toEqual(expectedTags);
    });

    it('should return categories and tags from spec.yaml regardless of actual post content', async () => {
      // Arrange
      const expectedCategories = spec.categories.map(cat => cat.name);
      const expectedTags = spec.tags.map(t => t.name).sort();

      // Act
      const result = await fetchAvailableFilters();

      // Assert
      // カテゴリとタグは spec.yaml で定義されているすべて（記事の内容に関係なく）
      expect(result.categories).toEqual(expectedCategories);
      expect(result.tags).toEqual(expectedTags);
    });

    it('should call groupTags and return its result as tagGroups', async () => {
      // Arrange
      const mockTagsSpec = [
        { name: 'Remix', group: 'Remix' },
        { name: 'SSR', group: 'Remix' },
      ];
      const mockGroupedTags = [{ group: 'Remix', tags: ['Remix', 'SSR'] }];

      vi.mocked(loadPostsSpec).mockReturnValue({
        categories: spec.categories,
        tags: mockTagsSpec,
        tag_groups: { order: spec.tag_groups.order },
      } as any);
      vi.mocked(groupTags).mockReturnValue(mockGroupedTags);

      // Act
      const result = await fetchAvailableFilters();

      // Assert
      // Verify that dependencies were called correctly
      expect(loadPostsSpec).toHaveBeenCalled();
      expect(groupTags).toHaveBeenCalledWith(
        ['Remix', 'SSR'], // Note: sorted alphabetically
        mockTagsSpec,
        spec.tag_groups.order
      );

      // Verify the final output
      expect(result.tagGroups).toEqual(mockGroupedTags);
      expect(result.tagGroups).toHaveLength(1);
    });

    it('should throw error when loadPostsSpec throws', async () => {
      // Arrange
      vi.mocked(loadPostsSpec).mockImplementation(() => {
        throw new Error('Failed to load spec');
      });

      // Act & Assert
      await expect(fetchAvailableFilters()).rejects.toThrow('Failed to fetch available filters');
    });
  });
});
