import { describe, it, expect } from 'vitest';
import { fetchPostBySlug, type Post } from '~/data-io/blog/post-detail/fetchPostBySlug.server';

describe('fetchPostBySlug - Data-IO Layer', () => {
  describe('正常系テスト', () => {
    it('有効なslugで記事データを取得できる', async () => {
      // Arrange
      const validSlug = 'about-claudemix';

      // Act
      const result = await fetchPostBySlug(validSlug);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        slug: validSlug,
        title: expect.any(String),
        author: expect.any(String),
        publishedAt: expect.any(String),
        content: expect.any(String),
      });
    });

    it('取得した記事データが正しい構造を持つ', async () => {
      // Arrange
      const validSlug = 'about-claudemix';

      // Act
      const result = await fetchPostBySlug(validSlug);

      // Assert
      expect(result).not.toBeNull();
      if (result) {
        expect(result.slug).toBe(validSlug);
        expect(result.title).toBe('このプロジェクトについて');
        expect(result.author).toBe('ClaudeMix Team');
        expect(result.publishedAt).toBe('2025-11-16');
        // contentはビルド時にHTML変換済み
        expect(result.content).toContain('<h1 id="このプロジェクトについて">このプロジェクトについて</h1>');
      }
    });
  });
});
