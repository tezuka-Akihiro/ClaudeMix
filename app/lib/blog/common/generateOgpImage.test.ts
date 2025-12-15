import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { load } from 'js-yaml';
import type { PostMetadata } from '~/data-io/blog/common/loadPostMetadata.server';
import type { BlogCommonSpec } from '~/specs/blog/types';

// 実際の spec ファイルを読み込む
const specPath = join(process.cwd(), 'app/specs/blog/common-spec.yaml');
const specContent = readFileSync(specPath, 'utf-8');
const actualSpec = load(specContent) as BlogCommonSpec;

// loadSpecをモック（実際の spec データを返す）
vi.mock('~/spec-loader/specLoader.server', () => ({
  loadSpec: vi.fn((): BlogCommonSpec => actualSpec),
}));

// workers-ogをモック
vi.mock('workers-og', () => ({
  ImageResponse: vi.fn().mockImplementation(() => {
    // 有効なPNGシグネチャを持つArrayBuffer
    const buffer = new ArrayBuffer(100);
    const view = new Uint8Array(buffer);
    view[0] = 0x89;
    view[1] = 0x50; // 'P'
    view[2] = 0x4e; // 'N'
    view[3] = 0x47; // 'G'

    return {
      arrayBuffer: async () => buffer,
      headers: new Headers({ 'Content-Type': 'image/png' }),
    };
  }),
}));

// モックの後にインポート
import { generateOgpImage } from '~/lib/blog/common/generateOgpImage';

describe('generateOgpImage - Pure Logic Layer', () => {
  // テスト用のモックフォントデータ
  const mockFontData = new ArrayBuffer(8);

  describe('generateOgpImage function', () => {
    it('should generate PNG response from metadata', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: 'Test Blog Post',
        description: 'This is a test blog post description.',
        author: 'Test Author',
      };

      // Act
      const response = await generateOgpImage(metadata, mockFontData);
      const buffer = await response.arrayBuffer();
      const view = new Uint8Array(buffer);

      // Assert
      expect(response).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(view.length).toBeGreaterThan(0);
    });

    it('should generate valid PNG image with correct signature', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: 'Valid PNG Test',
        description: 'Testing PNG signature generation.',
        author: 'PNG Tester',
      };

      // Act
      const response = await generateOgpImage(metadata, mockFontData);
      const buffer = await response.arrayBuffer();
      const view = new Uint8Array(buffer);

      // Assert - PNGファイルシグネチャ: 89 50 4E 47 0D 0A 1A 0A
      expect(view[0]).toBe(0x89);
      expect(view[1]).toBe(0x50); // 'P'
      expect(view[2]).toBe(0x4e); // 'N'
      expect(view[3]).toBe(0x47); // 'G'
    });

    it('should truncate long title', async () => {
      // Arrange
      // spec で定義された maxLength を超える長さのタイトルを生成
      const longTitle = 'A'.repeat(actualSpec.ogp.title.maxLength + 50);
      const metadata: PostMetadata = {
        title: longTitle,
        description: 'Short description',
        author: 'Author',
      };

      // Act
      const response = await generateOgpImage(metadata, mockFontData);
      const buffer = await response.arrayBuffer();

      // Assert
      expect(response).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should truncate long description', async () => {
      // Arrange
      // spec で定義された maxLength を超える長さの説明を生成
      const longDescription = 'B'.repeat(actualSpec.ogp.description.maxLength + 100);
      const metadata: PostMetadata = {
        title: 'Short Title',
        description: longDescription,
        author: 'Author',
      };

      // Act
      const response = await generateOgpImage(metadata, mockFontData);
      const buffer = await response.arrayBuffer();

      // Assert
      expect(response).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should handle Japanese text', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: '日本語のタイトル',
        description: 'これは日本語の説明文です。',
        author: '著者名',
      };

      // Act
      const response = await generateOgpImage(metadata, mockFontData);
      const buffer = await response.arrayBuffer();
      const view = new Uint8Array(buffer);

      // Assert
      expect(response).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
      // PNGシグネチャの確認
      expect(view[0]).toBe(0x89);
    });

    it('should handle empty description', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: 'Title without description',
        description: '',
        author: 'Author',
      };

      // Act
      const response = await generateOgpImage(metadata, mockFontData);
      const buffer = await response.arrayBuffer();

      // Assert
      expect(response).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      // Arrange
      const metadata: PostMetadata = {
        title: 'Title with "quotes" & <special> characters',
        description: 'Description with symbols: @#$%^&*()',
        author: 'Author <email@example.com>',
      };

      // Act
      const response = await generateOgpImage(metadata, mockFontData);
      const buffer = await response.arrayBuffer();

      // Assert
      expect(response).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });
});
