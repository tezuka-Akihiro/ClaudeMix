// buildThumbnailUrl.test.ts - 純粋ロジック層テスト
import { describe, it, expect, beforeAll } from 'vitest';
import { buildThumbnailUrl } from './buildThumbnailUrl';
import type { R2AssetsConfig, BlogCommonSpec } from '~/specs/blog/types';
import { loadSpec } from 'tests/utils/loadSpec';

let spec: BlogCommonSpec;
let mockR2Config: R2AssetsConfig;

describe('buildThumbnailUrl', () => {
  beforeAll(async () => {
    spec = await loadSpec<BlogCommonSpec>('blog', 'common');
    mockR2Config = spec.r2_assets;
  });

  describe('正常系', () => {
    it('slugからサムネイルURLセットを生成する', () => {
      const result = buildThumbnailUrl('my-first-post', mockR2Config);
      expect(result).toEqual({
        lg: `${mockR2Config.base_url}${mockR2Config.blog_path}/my-first-post/lg.avif`,
        sm: `${mockR2Config.base_url}${mockR2Config.blog_path}/my-first-post/sm.avif`,
      });
    });

    it('日本語slugでもURLセットを生成する', () => {
      const result = buildThumbnailUrl('日本語-記事', mockR2Config);
      expect(result).toEqual({
        lg: `${mockR2Config.base_url}${mockR2Config.blog_path}/日本語-記事/lg.avif`,
        sm: `${mockR2Config.base_url}${mockR2Config.blog_path}/日本語-記事/sm.avif`,
      });
    });

    it('ハイフンを含むslugでURLセットを生成する', () => {
      const result = buildThumbnailUrl('my-awesome-blog-post', mockR2Config);
      expect(result).toEqual({
        lg: `${mockR2Config.base_url}${mockR2Config.blog_path}/my-awesome-blog-post/lg.avif`,
        sm: `${mockR2Config.base_url}${mockR2Config.blog_path}/my-awesome-blog-post/sm.avif`,
      });
    });

    it('数字を含むslugでURLセットを生成する', () => {
      const result = buildThumbnailUrl('post-2024-01-15', mockR2Config);
      expect(result).toEqual({
        lg: `${mockR2Config.base_url}${mockR2Config.blog_path}/post-2024-01-15/lg.avif`,
        sm: `${mockR2Config.base_url}${mockR2Config.blog_path}/post-2024-01-15/sm.avif`,
      });
    });

    it('アンダースコアを含むslugでURLセットを生成する', () => {
      const result = buildThumbnailUrl('my_post_title', mockR2Config);
      expect(result).toEqual({
        lg: `${mockR2Config.base_url}${mockR2Config.blog_path}/my_post_title/lg.avif`,
        sm: `${mockR2Config.base_url}${mockR2Config.blog_path}/my_post_title/sm.avif`,
      });
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
      expect(result).toEqual({
        lg: `${mockR2Config.base_url}${mockR2Config.blog_path}/my-post/lg.avif`,
        sm: `${mockR2Config.base_url}${mockR2Config.blog_path}/my-post/sm.avif`,
      });
    });
  });

  describe('設定のバリエーション', () => {
    it('異なるbase_urlで正しいURLセットを生成する', () => {
      const customConfig: R2AssetsConfig = {
        ...mockR2Config,
        base_url: 'https://cdn.mysite.com',
      };
      const result = buildThumbnailUrl('test-post', customConfig);
      expect(result).toEqual({
        lg: `https://cdn.mysite.com${mockR2Config.blog_path}/test-post/lg.avif`,
        sm: `https://cdn.mysite.com${mockR2Config.blog_path}/test-post/sm.avif`,
      });
    });

    it('異なるblog_pathで正しいURLセットを生成する', () => {
      const customConfig: R2AssetsConfig = {
        ...mockR2Config,
        blog_path: '/articles',
      };
      const result = buildThumbnailUrl('test-post', customConfig);
      expect(result).toEqual({
        lg: `${mockR2Config.base_url}/articles/test-post/lg.avif`,
        sm: `${mockR2Config.base_url}/articles/test-post/sm.avif`,
      });
    });

    it('末尾スラッシュなしのbase_urlでも正しく動作する', () => {
      const customConfig: R2AssetsConfig = {
        ...mockR2Config,
        base_url: 'https://assets.example.com',
        blog_path: '/blog',
      };
      const result = buildThumbnailUrl('test-post', customConfig);
      expect(result).toEqual({
        lg: `https://assets.example.com/blog/test-post/lg.avif`,
        sm: `https://assets.example.com/blog/test-post/sm.avif`,
      });
    });
  });
});
