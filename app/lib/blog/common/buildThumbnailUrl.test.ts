// buildThumbnailUrl.test.ts - 純粋ロジック層テスト
import { describe, it, expect } from 'vitest';
import { buildThumbnailUrl } from './buildThumbnailUrl';
import type { R2AssetsConfig } from '~/specs/blog/types';

// テスト用のR2アセット設定
const mockR2Config: R2AssetsConfig = {
  base_url: 'https://assets.example.com',
  blog_path: '/blog',
  thumbnail: {
    filename: 'thumbnail.webp',
    width: 1200,
    height: 630,
    aspect_ratio: '1200/630',
    format: 'webp',
    max_size_kb: 100,
  },
  article_images: {
    pattern: 'img-{n}.webp',
    max_count: 10,
    max_size_kb: 500,
  },
  performance: {
    loading: 'lazy',
    decoding: 'async',
  },
};

describe('buildThumbnailUrl', () => {
  describe('正常系', () => {
    it('slugからサムネイルURLを生成する', () => {
      const result = buildThumbnailUrl('my-first-post', mockR2Config);
      expect(result).toBe('https://assets.example.com/blog/my-first-post/thumbnail.webp');
    });

    it('日本語slugでもURLを生成する', () => {
      const result = buildThumbnailUrl('日本語-記事', mockR2Config);
      expect(result).toBe('https://assets.example.com/blog/日本語-記事/thumbnail.webp');
    });

    it('ハイフンを含むslugでURLを生成する', () => {
      const result = buildThumbnailUrl('my-awesome-blog-post', mockR2Config);
      expect(result).toBe('https://assets.example.com/blog/my-awesome-blog-post/thumbnail.webp');
    });

    it('数字を含むslugでURLを生成する', () => {
      const result = buildThumbnailUrl('post-2024-01-15', mockR2Config);
      expect(result).toBe('https://assets.example.com/blog/post-2024-01-15/thumbnail.webp');
    });

    it('アンダースコアを含むslugでURLを生成する', () => {
      const result = buildThumbnailUrl('my_post_title', mockR2Config);
      expect(result).toBe('https://assets.example.com/blog/my_post_title/thumbnail.webp');
    });
  });

  describe('異常系', () => {
    it('空文字のslugはnullを返す', () => {
      const result = buildThumbnailUrl('', mockR2Config);
      expect(result).toBeNull();
    });

    it('空白のみのslugはnullを返す', () => {
      const result = buildThumbnailUrl('   ', mockR2Config);
      expect(result).toBeNull();
    });

    it('前後の空白はトリムされる', () => {
      const result = buildThumbnailUrl('  my-post  ', mockR2Config);
      expect(result).toBe('https://assets.example.com/blog/my-post/thumbnail.webp');
    });
  });

  describe('設定のバリエーション', () => {
    it('異なるbase_urlで正しいURLを生成する', () => {
      const customConfig: R2AssetsConfig = {
        ...mockR2Config,
        base_url: 'https://cdn.mysite.com',
      };
      const result = buildThumbnailUrl('test-post', customConfig);
      expect(result).toBe('https://cdn.mysite.com/blog/test-post/thumbnail.webp');
    });

    it('異なるblog_pathで正しいURLを生成する', () => {
      const customConfig: R2AssetsConfig = {
        ...mockR2Config,
        blog_path: '/articles',
      };
      const result = buildThumbnailUrl('test-post', customConfig);
      expect(result).toBe('https://assets.example.com/articles/test-post/thumbnail.webp');
    });

    it('異なるfilenameで正しいURLを生成する', () => {
      const customConfig: R2AssetsConfig = {
        ...mockR2Config,
        thumbnail: {
          ...mockR2Config.thumbnail,
          filename: 'cover.jpg',
        },
      };
      const result = buildThumbnailUrl('test-post', customConfig);
      expect(result).toBe('https://assets.example.com/blog/test-post/cover.jpg');
    });

    it('末尾スラッシュなしのbase_urlでも正しく動作する', () => {
      const customConfig: R2AssetsConfig = {
        ...mockR2Config,
        base_url: 'https://assets.example.com',
        blog_path: '/blog',
      };
      const result = buildThumbnailUrl('test-post', customConfig);
      expect(result).toBe('https://assets.example.com/blog/test-post/thumbnail.webp');
    });
  });
});
