import { test, expect } from '@playwright/test';

test.describe('Blog Image Optimization', () => {
  test('PostCard should have srcset and sizes for thumbnail', async ({ page }) => {
    await page.goto('http://localhost:3000/blog');
    const firstThumbnail = page.locator('[data-testid="thumbnail-image"]').first();

    // Check for attribute presence
    // We expect them to be present since buildThumbnailUrl now returns a variant set
    const srcset = await firstThumbnail.getAttribute('srcset');
    expect(srcset).toBeTruthy();
    expect(srcset).toContain('sm.avif 600w');
    expect(srcset).toContain('lg.avif 1200w');

    await expect(firstThumbnail).toHaveAttribute('sizes', '(max-width: 767px) 600px, 1200px');
  });

  test('PostDetailSection should have srcset and sizes for thumbnail', async ({ page }) => {
    await page.goto('http://localhost:3000/blog/hazimemasite');

    const detailThumbnail = page.locator('[data-testid="article-thumbnail-image"]');
    if (await detailThumbnail.isVisible()) {
      const srcset = await detailThumbnail.getAttribute('srcset');
      expect(srcset).toBeTruthy();
      expect(srcset).toContain('sm.avif 600w');
      expect(srcset).toContain('lg.avif 1200w');
      await expect(detailThumbnail).toHaveAttribute('sizes', '(max-width: 767px) 600px, 1200px');
    }
  });
});
