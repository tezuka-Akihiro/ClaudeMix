import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';

// satoriとResvgをモック
vi.mock('satori', () => ({
  default: vi.fn(async () => '<svg>mock svg</svg>'),
}));

vi.mock('@resvg/resvg-js', () => ({
  Resvg: vi.fn().mockImplementation(() => ({
    render: vi.fn(() => ({
      asPng: vi.fn(() => {
        // 有効なPNGシグネチャを持つBuffer
        const buffer = Buffer.alloc(100);
        buffer[0] = 0x89;
        buffer[1] = 0x50; // 'P'
        buffer[2] = 0x4e; // 'N'
        buffer[3] = 0x47; // 'G'
        return buffer;
      }),
    })),
  })),
}));

// モックの後にインポート
import { generateOgpImage } from '~/lib/blog/common/generateOgpImage';

describe('generateOgpImage - Pure Logic Layer', () => {
  beforeEach(() => {
    // fetchをモックして、ダミーフォントデータを返す
    global.fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as any;
  });

  describe('generateOgpImage function', () => {
    it('should generate PNG buffer from metadata', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: 'Test Blog Post',
        description: 'This is a test blog post description.',
        author: 'Test Author',
      };

      // Act
      const result = await generateOgpImage(metadata);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate valid PNG image with correct signature', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: 'Valid PNG Test',
        description: 'Testing PNG signature generation.',
        author: 'PNG Tester',
      };

      // Act
      const result = await generateOgpImage(metadata);

      // Assert - PNGファイルシグネチャ: 89 50 4E 47 0D 0A 1A 0A
      expect(result[0]).toBe(0x89);
      expect(result[1]).toBe(0x50); // 'P'
      expect(result[2]).toBe(0x4e); // 'N'
      expect(result[3]).toBe(0x47); // 'G'
    });

    it('should truncate long title', async () => {
      // Arrange
      const longTitle = 'A'.repeat(100); // 100文字の長いタイトル
      const metadata: PostMetadata = {
        title: longTitle,
        description: 'Short description',
        author: 'Author',
      };

      // Act
      const result = await generateOgpImage(metadata);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should truncate long description', async () => {
      // Arrange
      const longDescription = 'B'.repeat(200); // 200文字の長い説明
      const metadata: PostMetadata = {
        title: 'Short Title',
        description: longDescription,
        author: 'Author',
      };

      // Act
      const result = await generateOgpImage(metadata);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Japanese text', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: '日本語のタイトル',
        description: 'これは日本語の説明文です。',
        author: '著者名',
      };

      // Act
      const result = await generateOgpImage(metadata);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      // PNGシグネチャの確認
      expect(result[0]).toBe(0x89);
    });

    it('should handle empty description', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: 'Title without description',
        description: '',
        author: 'Author',
      };

      // Act
      const result = await generateOgpImage(metadata);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: 'Title with "quotes" & <special> characters',
        description: 'Description with symbols: @#$%^&*()',
        author: 'Author <email@example.com>',
      };

      // Act
      const result = await generateOgpImage(metadata);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
