import { describe, it, expect, beforeAll } from 'vitest';
import { filterPosts, type FilterOptions } from './filterPosts';
import type { PostSummary } from '../../../data-io/blog/posts/fetchPosts.server';
import { loadSpec, type BlogPostsSpec } from '../../../../tests/utils/loadSpec';

describe('filterPosts - Pure Logic Layer', () => {
  let spec: BlogPostsSpec;
  let mockPosts: PostSummary[];

  beforeAll(async () => {
    spec = await loadSpec('blog','posts');
    // spec.yamlのtest_dataを使用
    mockPosts = spec.test_data.posts.map(post => ({
      slug: post.slug,
      title: post.title,
      publishedAt: post.publishedAt,
      category: post.category,
      description: post.description,
      tags: post.tags,
    }));
  });

  describe('Category Filter', () => {
    it('should filter posts by category', () => {
      // Arrange - Use first test post's category from spec.yaml
      const testPost = spec.test_data.posts[0];
      const filters: FilterOptions = { category: testPost.category };

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(testPost.category);
      expect(result[0].slug).toBe(testPost.slug);
    });

    it('should return all posts when category is empty string', () => {
      // Arrange
      const filters: FilterOptions = { category: '' };

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(spec.test_data.posts.length);
    });

    it('should return all posts when category is undefined', () => {
      // Arrange
      const filters: FilterOptions = {};

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(spec.test_data.posts.length);
    });
  });

  describe('Tag Filter (AND condition)', () => {
    it('should filter posts by single tag', () => {
      // Arrange - Find a tag that appears in multiple posts
      const commonTag = 'TypeScript';
      const filters: FilterOptions = { tags: [commonTag] };

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      const expectedCount = mockPosts.filter(p => p.tags?.includes(commonTag)).length;
      expect(result).toHaveLength(expectedCount);
      expect(result.every(post => post.tags?.includes(commonTag))).toBe(true);
    });

    it('should filter posts by multiple tags (AND condition)', () => {
      // Arrange - Use first test post's tags from spec.yaml
      const testPost = spec.test_data.posts[0]; // remix-tips-2024
      const filters: FilterOptions = { tags: [testPost.tags[0], testPost.tags[1]] };

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe(testPost.slug);
      expect(result[0].tags).toContain(testPost.tags[0]);
      expect(result[0].tags).toContain(testPost.tags[1]);
    });

    it('should return all posts when tags is empty array', () => {
      // Arrange
      const filters: FilterOptions = { tags: [] };

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(spec.test_data.posts.length);
    });

    it('should return all posts when tags is undefined', () => {
      // Arrange
      const filters: FilterOptions = {};

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(spec.test_data.posts.length);
    });
  });

  describe('Combined Filter', () => {
    it('should filter posts by category and tags', () => {
      // Arrange - Use second test post from spec.yaml
      const testPost = spec.test_data.posts[1]; // claude-code-guide
      const filters: FilterOptions = {
        category: testPost.category,
        tags: [testPost.tags[0]], // First tag
      };

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(testPost.category);
      expect(result[0].tags).toContain(testPost.tags[0]);
      expect(result[0].slug).toBe(testPost.slug);
    });

    it('should return empty array when combined filters do not match any post', () => {
      // Arrange - Intentional mismatch: first post's category with second post's tag
      const filters: FilterOptions = {
        category: spec.test_data.posts[0].category, // Tutorials & Use Cases
        tags: [spec.test_data.posts[1].tags[0]], // AI (doesn't exist in first post)
      };

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('Boundary Cases', () => {
    it('should return empty array when filtering empty posts array', () => {
      // Arrange
      const emptyPosts: PostSummary[] = [];
      const filters: FilterOptions = { category: 'Some Category' };

      // Act
      const result = filterPosts(emptyPosts, filters);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no posts match the filter', () => {
      // Arrange
      const filters: FilterOptions = { category: 'Nonexistent Category' };

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should return empty array when tags filter has no matches', () => {
      // Arrange
      const filters: FilterOptions = { tags: ['NonexistentTag'] };

      // Act
      const result = filterPosts(mockPosts, filters);

      // Assert
      expect(result).toHaveLength(0);
    });
  });
});
