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
        expect(result.publishedAt).toBe('2025-01-16');
        // contentはビルド時にHTML変換済み
        expect(result.content).toContain('<h1 id="このプロジェクトについて">このプロジェクトについて</h1>');
      }
    });
  });

  describe('参照機能テスト', () => {
    it('sourceプロパティがある記事の場合、外部ファイルの内容がcontentとして返される', async () => {
      // Arrange
      const referenceSlug = 'readme';

      // Act
      const result = await fetchPostBySlug(referenceSlug);

      // Assert
      expect(result).not.toBeNull();
      if (result) {
        expect(result.slug).toBe(referenceSlug);
        expect(result.title).toBe('README参照記事');
        expect(result.author).toBe('技術太郎');
        // contentにはREADME.mdの内容が含まれている
        expect(result.content).toContain('AI開発ガードレール・ボイラープレート');
        expect(result.content).toContain('Remix');
      }
    });
  });

  describe('異常系テスト', () => {
    it('無効なslugでnullを返す', async () => {
      // Arrange
      const invalidSlug = 'non-existent-article-xyz';

      // Act
      const result = await fetchPostBySlug(invalidSlug);

      // Assert
      expect(result).toBeNull();
    });

    it('空文字列のslugでnullを返す', async () => {
      // Arrange
      const emptySlug = '';

      // Act
      const result = await fetchPostBySlug(emptySlug);

      // Assert
      expect(result).toBeNull();
    });
  });
});
