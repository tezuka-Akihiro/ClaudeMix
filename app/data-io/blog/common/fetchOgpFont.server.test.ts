import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { load } from 'js-yaml';
import type { BlogCommonSpec } from '~/specs/blog/types';

// 実際の spec ファイルを読み込む
const specPath = join(process.cwd(), 'app/specs/blog/common-spec.yaml');
const specContent = readFileSync(specPath, 'utf-8');
const actualSpec = load(specContent) as BlogCommonSpec;

// loadSpecをモック（実際の spec データを返す）
vi.mock('~/spec-loader/specLoader.server', () => ({
  loadSpec: vi.fn((): BlogCommonSpec => actualSpec),
}));

// モックの後にインポート
import { fetchOgpFont } from '~/data-io/blog/common/fetchOgpFont.server';

describe('fetchOgpFont - Data-IO Layer', () => {
  beforeEach(() => {
    // Cache APIをモック
    const mockCache = {
      match: vi.fn(async () => undefined), // デフォルトはキャッシュミス
      put: vi.fn(async () => {}),
    };
    global.caches = {
      open: vi.fn(async () => mockCache),
    } as any;

    // fetchをモック
    global.fetch = vi.fn(async (url: string) => {
      if (typeof url === 'string' && url.includes('fonts.googleapis.com/css2')) {
        // Google Fonts API CSSレスポンス
        return {
          ok: true,
          text: async () => `@font-face { font-family: 'Noto Sans JP'; src: url(https://fonts.gstatic.com/s/notosansjp/v52/test.ttf) format('truetype'); }`,
        };
      } else {
        // TTFファイルレスポンス
        return {
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(8),
        };
      }
    }) as any;
  });

  describe('fetchOgpFont function', () => {
    it('should fetch font from Google Fonts API on cache miss', async () => {
      // Act
      const fontData = await fetchOgpFont();

      // Assert
      expect(fontData).toBeInstanceOf(ArrayBuffer);
      expect(fontData.byteLength).toBeGreaterThan(0);
      expect(global.fetch).toHaveBeenCalledWith(
        actualSpec.ogp.font.fetch.apiUrl,
        expect.objectContaining({
          headers: {
            'User-Agent': actualSpec.ogp.font.fetch.userAgent,
          },
        })
      );
    });

    it('should return cached font data when available', async () => {
      // Arrange
      const cachedFontBuffer = new ArrayBuffer(16);
      const mockCachedResponse = {
        arrayBuffer: async () => cachedFontBuffer,
      };
      const mockCache = {
        match: vi.fn(async () => mockCachedResponse),
        put: vi.fn(async () => {}),
      };
      global.caches = {
        open: vi.fn(async () => mockCache),
      } as any;

      // Act
      const fontData = await fetchOgpFont();

      // Assert
      expect(fontData).toBe(cachedFontBuffer);
      expect(fontData.byteLength).toBe(16);
      // フォントダウンロードのfetchは呼ばれない（CSSのfetchのみ）
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should cache font data in background when ExecutionContext provided', async () => {
      // Arrange
      const mockCtx = {
        waitUntil: vi.fn(),
      } as unknown as ExecutionContext;

      const mockCache = {
        match: vi.fn(async () => undefined),
        put: vi.fn(async () => {}),
      };
      global.caches = {
        open: vi.fn(async () => mockCache),
      } as any;

      // Act
      await fetchOgpFont(mockCtx);

      // Assert
      expect(mockCtx.waitUntil).toHaveBeenCalled();
    });

    it('should extract TTF URL from CSS correctly', async () => {
      // Act
      const fontData = await fetchOgpFont();

      // Assert
      expect(fontData).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('fonts.gstatic.com'),
      );
    });

    it('should throw error when CSS fetch fails', async () => {
      // Arrange
      global.fetch = vi.fn(async (url: string) => {
        if (typeof url === 'string' && url.includes('fonts.googleapis.com/css2')) {
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
          };
        }
        return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
      }) as any;

      // Act & Assert
      await expect(fetchOgpFont()).rejects.toThrow('Failed to fetch font CSS: 500 Internal Server Error');
    });

    it('should throw error when CSS does not contain font URL', async () => {
      // Arrange
      global.fetch = vi.fn(async (url: string) => {
        if (typeof url === 'string' && url.includes('fonts.googleapis.com/css2')) {
          return {
            ok: true,
            text: async () => `/* No font URL here */`,
          };
        }
        return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
      }) as any;

      // Act & Assert
      await expect(fetchOgpFont()).rejects.toThrow('Failed to extract font URL from CSS');
    });

    it('should throw error when font file fetch fails', async () => {
      // Arrange
      global.fetch = vi.fn(async (url: string) => {
        if (typeof url === 'string' && url.includes('fonts.googleapis.com/css2')) {
          return {
            ok: true,
            text: async () => `@font-face { font-family: 'Noto Sans JP'; src: url(https://fonts.gstatic.com/s/notosansjp/test.ttf) format('truetype'); }`,
          };
        } else {
          // TTFファイルのフェッチが失敗
          return {
            ok: false,
            status: 404,
            statusText: 'Not Found',
          };
        }
      }) as any;

      // Act & Assert
      await expect(fetchOgpFont()).rejects.toThrow('Failed to fetch font file: 404 Not Found');
    });
  });
});
