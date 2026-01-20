import { describe, it, expect, beforeAll } from 'vitest';
import { getMangaAssets } from './getMangaAssets.server';
import { loadSpec } from '../../../../tests/utils/loadSpec';
import type { BlogLandingSpec } from '../../../specs/blog/types';

describe('getMangaAssets - Side Effects Layer', () => {
  let landingSpec: BlogLandingSpec;

  beforeAll(async () => {
    landingSpec = await loadSpec<BlogLandingSpec>('blog', 'landing');
  });

  describe('getMangaAssets function', () => {
    it('should return manga assets for engineer target', async () => {
      // Act
      const result = await getMangaAssets('engineer');

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return assets with correct structure', async () => {
      // Act
      const result = await getMangaAssets('engineer');

      // Assert
      result.forEach(asset => {
        expect(asset).toHaveProperty('fileName');
        expect(asset).toHaveProperty('path');
        expect(asset).toHaveProperty('order');
        expect(typeof asset.fileName).toBe('string');
        expect(typeof asset.path).toBe('string');
        expect(typeof asset.order).toBe('number');
      });
    });

    it('should return assets sorted by filename', async () => {
      // Act
      const result = await getMangaAssets('engineer');

      // Assert
      for (let i = 0; i < result.length - 1; i++) {
        const current = result[i].fileName;
        const next = result[i + 1].fileName;
        expect(current.localeCompare(next)).toBeLessThan(0);
      }
    });

    it('should return assets with sequential order numbers', async () => {
      // Act
      const result = await getMangaAssets('engineer');

      // Assert
      result.forEach((asset, index) => {
        expect(asset.order).toBe(index + 1);
      });
    });

    it('should return assets with correct path format', async () => {
      // Act
      const result = await getMangaAssets('engineer');

      // Assert
      result.forEach(asset => {
        expect(asset.path).toMatch(/^\/images\/blog\/landing\/engineer\/manga\/.+\.(webp|png|jpg|jpeg)$/);
      });
    });

    it('should filter only image files (webp, png, jpg, jpeg)', async () => {
      // Act
      const result = await getMangaAssets('engineer');

      // Assert
      result.forEach(asset => {
        const ext = asset.fileName.toLowerCase().slice(asset.fileName.lastIndexOf('.'));
        expect(['.webp', '.png', '.jpg', '.jpeg']).toContain(ext);
      });
    });

    it('should return assets within valid range', async () => {
      // Act
      const result = await getMangaAssets('engineer');

      // Assert
      expect(result.length).toBeLessThanOrEqual(
        landingSpec.business_rules.manga_panel_count.total_max
      );
    });

    it('should return empty array for non-existent target directory', async () => {
      // Act
      const result = await getMangaAssets('non-existent-target');

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return correct number of manga panels matching spec format', async () => {
      // Act
      const result = await getMangaAssets('engineer');

      // Assert
      // panel-01.webp, panel-02.webp, ... panel-08.webp = 8 files
      expect(result.length).toBe(8);
    });

    it('should include panel-01.webp as first asset', async () => {
      // Act
      const result = await getMangaAssets('engineer');

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].fileName).toBe('panel-01.webp');
      expect(result[0].order).toBe(1);
    });
  });
});
