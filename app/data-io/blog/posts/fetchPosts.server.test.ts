import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { fetchPosts } from '~/data-io/blog/posts/fetchPosts.server';
import { getAllPosts } from '~/generated/blog-posts';
import { loadBlogPostsSpec, type BlogPostsSpec } from '../../../../tests/e2e/utils/loadSpec';

// Mock getAllPosts
vi.mock('~/generated/blog-posts', () => ({
  getAllPosts: vi.fn(),
}));

describe('fetchPosts - Side Effects Layer', () => {
  let spec: BlogPostsSpec;

  beforeAll(async () => {
    spec = await loadBlogPostsSpec();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPosts function', () => {
    it('should parse markdown frontmatter correctly', async () => {
      // Arrange
      vi.mocked(getAllPosts).mockReturnValue([
        {
          slug: 'post1',
          frontmatter: { title: 'Test Post 1', publishedAt: '2024-05-01', category: 'Claude Best Practices' },
        } as any,
        {
          slug: 'post2',
          frontmatter: { title: 'Test Post 2', publishedAt: '2024-04-01', category: 'ClaudeMix Philosophy' },
        } as any,
      ]);

      // Act
      const result = await fetchPosts();

      // Assert
      expect(result.posts).toHaveLength(2);
      expect(result.posts[0]).toMatchObject({
        slug: 'post1',
        title: 'Test Post 1',
        publishedAt: '2024-05-01',
        category: 'Claude Best Practices',
      });
      expect(result.posts[1]).toMatchObject({
        slug: 'post2',
        title: 'Test Post 2',
        publishedAt: '2024-04-01',
        category: 'ClaudeMix Philosophy',
      });
      expect(result.total).toBe(2);
    });

    it('should return PostSummary[] format', async () => {
      // Arrange
      vi.mocked(getAllPosts).mockReturnValue([
        {
          slug: 'test',
          frontmatter: { title: 'Test', publishedAt: '2024-05-01', category: 'Claude Best Practices' },
        } as any,
      ]);

      // Act
      const result = await fetchPosts();

      // Assert
      expect(Array.isArray(result.posts)).toBe(true);
      expect(result.posts[0]).toHaveProperty('slug');
      expect(result.posts[0]).toHaveProperty('title');
      expect(result.posts[0]).toHaveProperty('publishedAt');
      expect(result.posts[0]).toHaveProperty('category');
      expect(result).toHaveProperty('total');
    });

    it('should sort posts by publishedAt in descending order', async () => {
      // Arrange
      // getAllPosts() already returns posts sorted by publishedAt descending
      vi.mocked(getAllPosts).mockReturnValue([
        {
          slug: 'post2',
          frontmatter: { title: 'Post 2', publishedAt: '2024-05-01', category: 'ClaudeMix Philosophy' },
        } as any,
        {
          slug: 'post3',
          frontmatter: { title: 'Post 3', publishedAt: '2024-04-01', category: 'Tutorials & Use Cases' },
        } as any,
        {
          slug: 'post1',
          frontmatter: { title: 'Post 1', publishedAt: '2024-03-01', category: 'Claude Best Practices' },
        } as any,
      ]);

      // Act
      const result = await fetchPosts();

      // Assert
      expect(result.posts[0].publishedAt).toBe('2024-05-01');
      expect(result.posts[1].publishedAt).toBe('2024-04-01');
      expect(result.posts[2].publishedAt).toBe('2024-03-01');
    });

    it('should throw error when getAllPosts throws', async () => {
      // Arrange
      vi.mocked(getAllPosts).mockImplementation(() => {
        throw new Error('Failed to get posts');
      });

      // Act & Assert
      await expect(fetchPosts()).rejects.toThrow('Failed to fetch posts');
    });
  });

  describe('fetchPosts - Pagination', () => {
    it('should return first page with configured limit', async () => {
      // Arrange
      const postsPerPage = spec.business_rules.pagination.posts_per_page;
      const totalPosts = 15;
      const mockPosts = Array.from({ length: totalPosts }, (_, i) => ({
        slug: `post${i + 1}`,
        frontmatter: {
          title: `Post ${i + 1}`,
          publishedAt: `2024-${String(i + 1).padStart(2, '0')}-01`,
          category: spec.categories[0].name,
        },
      })) as any;

      vi.mocked(getAllPosts).mockReturnValue(mockPosts);

      // Act
      const { posts, total } = await fetchPosts({ limit: postsPerPage, offset: 0 });

      // Assert
      expect(posts).toHaveLength(postsPerPage);
      expect(total).toBe(totalPosts);
    });

    it('should return second page with configured limit', async () => {
      // Arrange
      const postsPerPage = spec.business_rules.pagination.posts_per_page;
      const totalPosts = 15;
      const mockPosts = Array.from({ length: totalPosts }, (_, i) => ({
        slug: `post${i + 1}`,
        frontmatter: {
          title: `Post ${i + 1}`,
          publishedAt: `2024-${String(i + 1).padStart(2, '0')}-01`,
          category: spec.categories[0].name,
        },
      })) as any;

      vi.mocked(getAllPosts).mockReturnValue(mockPosts);

      // Act
      const { posts, total } = await fetchPosts({ limit: postsPerPage, offset: postsPerPage });

      // Assert
      expect(posts).toHaveLength(totalPosts - postsPerPage);
      expect(total).toBe(totalPosts);
    });

    it('should return total count correctly', async () => {
      // Arrange
      const mockPosts = Array.from({ length: 3 }, (_, i) => ({
        slug: `post${i + 1}`,
        frontmatter: { title: 'Test', publishedAt: '2024-05-01', category: 'Claude Best Practices' },
      })) as any;

      vi.mocked(getAllPosts).mockReturnValue(mockPosts);

      // Act
      const { total: total1 } = await fetchPosts({ limit: 5 });
      const { total: total2 } = await fetchPosts({ limit: 10 });

      // Assert
      expect(total1).toBe(total2); // totalは常に同じ
      expect(total1).toBe(3);
    });
  });

  describe('fetchPosts - Metadata Enhancement', () => {
    it('should return posts with description and tags', async () => {
      // Arrange
      vi.mocked(getAllPosts).mockReturnValue([
        {
          slug: 'post1',
          frontmatter: {
            title: 'Test Post',
            publishedAt: '2024-05-01',
            category: 'Claude Best Practices',
            description: 'Test description',
            tags: ['AI', 'Claude'],
          },
        } as any,
      ]);

      // Act
      const result = await fetchPosts();

      // Assert
      expect(result.posts[0]).toHaveProperty('description', 'Test description');
      expect(result.posts[0]).toHaveProperty('tags');
      expect(result.posts[0].tags).toEqual(['AI', 'Claude']);
    });
  });

  describe('fetchPosts - Filter Feature', () => {
    beforeEach(() => {
      // Setup common mock data
      vi.mocked(getAllPosts).mockReturnValue([
        {
          slug: 'remix-tips-2024',
          frontmatter: {
            title: 'Remix Tips',
            publishedAt: '2024-05-01',
            category: 'Tutorials & Use Cases',
            description: 'Remix guide',
            tags: ['Remix', 'TypeScript'],
          },
        } as any,
        {
          slug: 'claude-code-guide',
          frontmatter: {
            title: 'Claude Guide',
            publishedAt: '2024-04-15',
            category: 'Claude Best Practices',
            description: 'Claude guide',
            tags: ['AI', 'Claude'],
          },
        } as any,
        {
          slug: 'typescript-best-practices',
          frontmatter: {
            title: 'TypeScript Best Practices',
            publishedAt: '2024-03-20',
            category: 'ClaudeMix Philosophy',
            description: 'TypeScript guide',
            tags: ['TypeScript', 'Architecture'],
          },
        } as any,
      ]);
    });

    it('should filter posts by category', async () => {
      // Act
      const result = await fetchPosts({ category: 'Tutorials & Use Cases' });

      // Assert
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].category).toBe('Tutorials & Use Cases');
      expect(result.posts[0].title).toBe('Remix Tips');
    });

    it('should filter posts by tags (AND condition)', async () => {
      // Act
      const result = await fetchPosts({ tags: ['TypeScript'] });

      // Assert
      expect(result.posts).toHaveLength(2);
      expect(result.posts.every(post => post.tags?.includes('TypeScript'))).toBe(true);
    });

    it('should filter posts by category and tags (combined filter)', async () => {
      // Act
      const result = await fetchPosts({
        category: 'Claude Best Practices',
        tags: ['AI'],
      });

      // Assert
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].category).toBe('Claude Best Practices');
      expect(result.posts[0].tags).toContain('AI');
      expect(result.posts[0].title).toBe('Claude Guide');
    });

    it('should return empty array when no posts match filter', async () => {
      // Act
      const result = await fetchPosts({ category: 'Nonexistent Category' });

      // Assert
      expect(result.posts).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
