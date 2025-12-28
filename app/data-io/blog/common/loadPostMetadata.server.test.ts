import { describe, it, expect } from 'vitest';
import { loadPostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';

describe('loadPostMetadata - Side Effects Layer', () => {
  describe('loadPostMetadata function', () => {
    it('should return metadata for existing post', async () => {
      // Arrange
      const slug = 'hazimemasite';

      // Act
      const result = await loadPostMetadata(slug);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('author');
      expect(result?.title).toBeTruthy();
      expect(result?.title!.length).toBeGreaterThan(0);
      expect(result?.author).toBeTruthy();
      expect(result?.author!.length).toBeGreaterThan(0);
      expect(result?.description).toBeTruthy();
    });

    it('should return null for non-existing post', async () => {
      // Arrange
      const slug = 'this-post-does-not-exist-12345';

      // Act
      const result = await loadPostMetadata(slug);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for empty slug', async () => {
      // Arrange
      const slug = '';

      // Act
      const result = await loadPostMetadata(slug);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only slug', async () => {
      // Arrange
      const slug = '   ';

      // Act
      const result = await loadPostMetadata(slug);

      // Assert
      expect(result).toBeNull();
    });

    it('should use description if available', async () => {
      // Arrange - about-claudemix has description field
      const slug = 'about-claudemix';

      // Act
      const result = await loadPostMetadata(slug);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.description).toBeTruthy();
      expect(result?.description!.length).toBeGreaterThan(0);
    });

    it('should return complete metadata structure', async () => {
      // Arrange
      const slug = 'hazimemasite';

      // Act
      const result = await loadPostMetadata(slug);

      // Assert
      expect(result).not.toBeNull();
      expect(typeof result?.title).toBe('string');
      expect(typeof result?.description).toBe('string');
      expect(typeof result?.author).toBe('string');
    });
  });
});
