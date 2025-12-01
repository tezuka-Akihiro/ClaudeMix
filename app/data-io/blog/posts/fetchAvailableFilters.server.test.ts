import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAvailableFilters } from './fetchAvailableFilters.server';
import { getAllPosts } from '~/generated/blog-posts';
import { loadPostsSpec } from './loadPostsSpec.server';
import { groupTags } from '~/lib/blog/posts/groupTagsByCategory';

// Mock dependencies
vi.mock('~/generated/blog-posts', () => ({
  getAllPosts: vi.fn(),
}));
vi.mock('./loadPostsSpec.server', () => ({
  loadPostsSpec: vi.fn(),
}));
vi.mock('~/lib/blog/posts/groupTagsByCategory', () => ({
  groupTags: vi.fn(),
}));

describe('fetchAvailableFilters - Side Effects Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to a default behavior
    vi.mocked(loadPostsSpec).mockReturnValue({
      tags: { current: [], recommended: [] },
    } as any);
    vi.mocked(groupTags).mockReturnValue([]);
  });

  describe('fetchAvailableFilters function', () => {
    it('should return unique categories sorted alphabetically', async () => {
      // Arrange
      vi.mocked(getAllPosts).mockReturnValue([
        {
          slug: 'post1',
          frontmatter: { title: 'Post 1', publishedAt: '2024-05-01', category: 'Tutorials & Use Cases' },
        } as any,
        {
          slug: 'post2',
          frontmatter: { title: 'Post 2', publishedAt: '2024-04-15', category: 'Claude Best Practices' },
        } as any,
        {
          slug: 'post3',
          frontmatter: { title: 'Post 3', publishedAt: '2024-03-20', category: 'ClaudeMix Philosophy' },
        } as any,
        {
          slug: 'post4',
          frontmatter: { title: 'Post 4', publishedAt: '2024-02-10', category: 'Claude Best Practices' },
        } as any,
      ]);

      // Act
      const result = await fetchAvailableFilters();

      // Assert
      expect(result.categories).toEqual([
        'Claude Best Practices',
        'ClaudeMix Philosophy',
        'Tutorials & Use Cases',
      ]);
    });

    it('should return unique tags sorted alphabetically', async () => {
      // Arrange
      vi.mocked(getAllPosts).mockReturnValue([
        {
          slug: 'post1',
          frontmatter: {
            title: 'Post 1',
            publishedAt: '2024-05-01',
            category: 'Tutorials & Use Cases',
            tags: ['Remix', 'TypeScript', 'Cloudflare'],
          },
        } as any,
        {
          slug: 'post2',
          frontmatter: {
            title: 'Post 2',
            publishedAt: '2024-04-15',
            category: 'Claude Best Practices',
            tags: ['AI', 'Claude', 'TDD'],
          },
        } as any,
        {
          slug: 'post3',
          frontmatter: {
            title: 'Post 3',
            publishedAt: '2024-03-20',
            category: 'ClaudeMix Philosophy',
            tags: ['TypeScript', 'Architecture'],
          },
        } as any,
      ]);

      // Act
      const result = await fetchAvailableFilters();

      // Assert
      expect(result.tags).toEqual([
        'AI',
        'Architecture',
        'Claude',
        'Cloudflare',
        'Remix',
        'TDD',
        'TypeScript',
      ]);
    });

    it('should handle posts without tags', async () => {
      // Arrange
      vi.mocked(getAllPosts).mockReturnValue([
        {
          slug: 'post1',
          frontmatter: {
            title: 'Post 1',
            publishedAt: '2024-05-01',
            category: 'Tutorials & Use Cases',
          },
        } as any,
        {
          slug: 'post2',
          frontmatter: {
            title: 'Post 2',
            publishedAt: '2024-04-15',
            category: 'Claude Best Practices',
            tags: ['AI'],
          },
        } as any,
      ]);

      // Act
      const result = await fetchAvailableFilters();

      // Assert
      expect(result.tags).toEqual(['AI']);
    });

    it('should return empty arrays when no posts exist', async () => {
      // Arrange
      vi.mocked(getAllPosts).mockReturnValue([]);

      // Act
      const result = await fetchAvailableFilters();

      // Assert
      expect(result.categories).toEqual([]);
      expect(result.tags).toEqual([]);
    });

    it('should call groupTagsByCategory and return its result as tagGroups', async () => {
      // Arrange
      const mockPosts = [
        { frontmatter: { tags: ['Remix', 'SSR'] } },
      ];
      const mockTagsSpec = [
        { name: 'Remix', group: 'Remix' },
        { name: 'SSR', group: 'Remix' },
      ];
      const mockGroupedTags = [{ group: 'Remix', tags: ['Remix', 'SSR'] }];

      vi.mocked(getAllPosts).mockReturnValue(mockPosts as any);
      vi.mocked(loadPostsSpec).mockReturnValue({
        tags: { current: mockTagsSpec, recommended: [] },
      } as any);
      vi.mocked(groupTags).mockReturnValue(mockGroupedTags);

      // Act
      const result = await fetchAvailableFilters();

      // Assert
      // Verify that dependencies were called correctly
      expect(loadPostsSpec).toHaveBeenCalled();
      expect(groupTags).toHaveBeenCalledWith(
        ['Remix', 'SSR'], // Note: sorted alphabetically
        mockTagsSpec
      );

      // Verify the final output
      expect(result.tagGroups).toEqual(mockGroupedTags);
      expect(result.tagGroups).toHaveLength(1);
    });

    it('should throw error when getAllPosts throws', async () => {
      // Arrange
      vi.mocked(getAllPosts).mockImplementation(() => {
        throw new Error('Failed to get posts');
      });

      // Act & Assert
      await expect(fetchAvailableFilters()).rejects.toThrow('Failed to fetch available filters');
    });
  });
});
