import { describe, it, expect } from 'vitest';
import { fetchExternalMarkdown } from '~/data-io/blog/post-detail/fetchExternalMarkdown.server';

describe('fetchExternalMarkdown - Data-IO Layer', () => {
  describe('正常系テスト', () => {
    it('有効なパス（README.md）でファイル内容を取得できる', async () => {
      // Arrange
      const validPath = '/README.md';

      // Act
      const result = await fetchExternalMarkdown(validPath);

      // Assert
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // README.mdの特徴的な文字列を確認
      expect(result).toContain('AI開発ガードレール・ボイラープレート');
    });

    it('プロジェクトルート配下の.mdファイルを読み込める', async () => {
      // Arrange
      const validPath = '/content/blog/posts/about-claudemix.md';

      // Act
      const result = await fetchExternalMarkdown(validPath);

      // Assert
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // about-claudemix.mdの特徴的な文字列を確認
      expect(result).toContain('ClaudeMix');
    });
  });

  describe('異常系テスト: ファイル不存在', () => {
    it('存在しないファイルを指定した場合エラーをthrow', async () => {
      // Arrange
      const nonExistentPath = '/non-existent-file.md';

      // Act & Assert
      await expect(fetchExternalMarkdown(nonExistentPath)).rejects.toThrow();
    });
  });

  describe('異常系テスト: 不正な拡張子', () => {
    it('.md以外の拡張子の場合エラーをthrow', async () => {
      // Arrange
      const invalidExtensionPath = '/README.txt';

      // Act & Assert
      await expect(fetchExternalMarkdown(invalidExtensionPath)).rejects.toThrow();
    });

    it('拡張子なしの場合エラーをthrow', async () => {
      // Arrange
      const noExtensionPath = '/README';

      // Act & Assert
      await expect(fetchExternalMarkdown(noExtensionPath)).rejects.toThrow();
    });
  });

  describe('異常系テスト: ディレクトリトラバーサル攻撃', () => {
    it('../を含むパスの場合エラーをthrow', async () => {
      // Arrange
      const traversalPath = '../../etc/passwd';

      // Act & Assert
      await expect(fetchExternalMarkdown(traversalPath)).rejects.toThrow();
    });

    it('..\\を含むパスの場合エラーをthrow（Windows形式）', async () => {
      // Arrange
      const traversalPath = '..\\..\\etc\\passwd';

      // Act & Assert
      await expect(fetchExternalMarkdown(traversalPath)).rejects.toThrow();
    });
  });

  describe('異常系テスト: システムパスへのアクセス', () => {
    it('/etc/を含むパスの場合エラーをthrow（Unixシステムパス）', async () => {
      // Arrange
      const systemPath = '/etc/passwd';

      // Act & Assert
      await expect(fetchExternalMarkdown(systemPath)).rejects.toThrow();
    });

    it('C:\\を含むパスの場合エラーをthrow（Windowsシステムパス）', async () => {
      // Arrange
      const systemPath = 'C:\\Windows\\System32\\config.sys';

      // Act & Assert
      await expect(fetchExternalMarkdown(systemPath)).rejects.toThrow();
    });

    it('\\\\を含むパスの場合エラーをthrow（UNCパス）', async () => {
      // Arrange
      const uncPath = '\\\\server\\share\\file.md';

      // Act & Assert
      await expect(fetchExternalMarkdown(uncPath)).rejects.toThrow();
    });
  });
});
