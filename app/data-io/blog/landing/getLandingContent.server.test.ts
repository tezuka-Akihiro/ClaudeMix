import { describe, it, expect, beforeAll } from 'vitest';
import { getLandingContent } from './getLandingContent.server';
import { loadSpec } from '../../../../tests/utils/loadSpec';
import type { BlogLandingSpec } from '../../../specs/blog/types';

describe('getLandingContent - Side Effects Layer', () => {
  let landingSpec: BlogLandingSpec;

  beforeAll(async () => {
    landingSpec = await loadSpec<BlogLandingSpec>('blog', 'landing');
  });

  describe('getLandingContent function', () => {
    it('should load content.yaml for engineer target', async () => {
      // Act
      const result = await getLandingContent('engineer');

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('targetSlug');
      expect(result).toHaveProperty('catchCopy');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('ctaButtonText');
      expect(result).toHaveProperty('ctaLinks');
      expect(result).toHaveProperty('mangaPanelCount');
    });

    it('should return correct target slug', async () => {
      // Act
      const result = await getLandingContent('engineer');

      // Assert
      expect(result.targetSlug).toBe('engineer');
    });

    it('should return non-empty catch copy', async () => {
      // Act
      const result = await getLandingContent('engineer');

      // Assert
      expect(result.catchCopy).toBeTruthy();
      expect(result.catchCopy.length).toBeGreaterThan(0);
    });

    it('should return non-empty description', async () => {
      // Act
      const result = await getLandingContent('engineer');

      // Assert
      expect(result.description).toBeTruthy();
      expect(result.description.length).toBeGreaterThan(0);
    });

    it('should return CTA button text', async () => {
      // Act
      const result = await getLandingContent('engineer');

      // Assert
      expect(result.ctaButtonText).toBeTruthy();
      expect(result.ctaButtonText.length).toBeGreaterThan(0);
    });

    it('should return CTA links array with correct structure', async () => {
      // Act
      const result = await getLandingContent('engineer');

      // Assert
      expect(Array.isArray(result.ctaLinks)).toBe(true);
      expect(result.ctaLinks.length).toBeGreaterThan(0);

      result.ctaLinks.forEach(link => {
        expect(link).toHaveProperty('label');
        expect(link).toHaveProperty('url');
        expect(link).toHaveProperty('aria_label');
        expect(typeof link.label).toBe('string');
        expect(typeof link.url).toBe('string');
        expect(typeof link.aria_label).toBe('string');
        expect(link.label.length).toBeGreaterThan(0);
        expect(link.url.length).toBeGreaterThan(0);
      });
    });

    it('should return manga panel count within valid range', async () => {
      // Act
      const result = await getLandingContent('engineer');

      // Assert
      expect(result.mangaPanelCount).toBeGreaterThan(0);
      expect(result.mangaPanelCount).toBeLessThanOrEqual(
        landingSpec.business_rules.manga_panel_count.total_max
      );
    });

    it('should throw error for non-existent target', async () => {
      // Act & Assert
      await expect(getLandingContent('non-existent-target')).rejects.toThrow(
        'Landing content file not found'
      );
    });

    it('should return correct number of CTA links matching spec', async () => {
      // Act
      const result = await getLandingContent('engineer');

      // Assert
      expect(result.ctaLinks).toHaveLength(landingSpec.cta.buttons.length);
    });

    it('should convert snake_case YAML keys to camelCase', async () => {
      // Act
      const result = await getLandingContent('engineer');

      // Assert - camelCase properties should exist
      expect(result).toHaveProperty('targetSlug');
      expect(result).toHaveProperty('catchCopy');
      expect(result).toHaveProperty('ctaButtonText');
      expect(result).toHaveProperty('mangaPanelCount');

      // snake_case properties should NOT exist
      expect(result).not.toHaveProperty('target_slug');
      expect(result).not.toHaveProperty('catch_copy');
      expect(result).not.toHaveProperty('cta_button_text');
      expect(result).not.toHaveProperty('manga_panel_count');
    });
  });
});
