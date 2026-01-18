import { describe, it, expect, beforeAll } from 'vitest';
import { loadBlogConfig } from '../../../data-io/blog/common/loadBlogConfig.server';
import { loadSpec } from '../../../../tests/utils/loadSpec';
import { loadSharedSpec } from '../../../spec-loader/specLoader.server';
import type { BlogCommonSpec } from '../../../specs/blog/types';
import type { ProjectSpec } from '../../../specs/shared/types';

describe('loadBlogConfig - Side Effects Layer', () => {
  let spec: BlogCommonSpec;
  let projectSpec: ProjectSpec;

  beforeAll(async () => {
    // Load spec.yaml dynamically to ensure tests stay in sync with spec
    spec = await loadSpec<BlogCommonSpec>('blog', 'common');
    projectSpec = loadSharedSpec<ProjectSpec>('project');
  });

  describe('loadBlogConfig function', () => {
    it('should return correct blog title', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.blogTitle).toBe(spec.blog_config.title);
    });

    it('should return valid menu items from spec.yaml', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.menuItems).toHaveLength(spec.navigation.menu_items.length);
      result.menuItems.forEach((
        item: { label: string; path: string },
        index: number,
      ) => {
        expect(item).toHaveProperty('label');
        expect(typeof item.label).toBe('string');
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.path).toMatch(/^\//);
        expect(item.label).toBe(spec.navigation.menu_items[index].label);
        expect(item.path).toBe(spec.navigation.menu_items[index].path);
      });
    });

    it('should return dynamically generated copyright with current year', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      const currentYear = new Date().getFullYear();
      const expectedCopyright = `© ${currentYear} ${projectSpec.project.name}`;
      expect(result.copyright).toBe(expectedCopyright);
      expect(result.copyright).toMatch(/^© \d{4} /);
    });

    it('should return site URL from spec.yaml', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.siteUrl).toBe(spec.blog_config.site_url);
      expect(result.siteUrl).toMatch(/^https?:\/\//);
    });

    it('should return site name from spec.yaml', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result.siteName).toBe(spec.blog_config.title);
    });

    it('should return complete blog config structure', async () => {
      // Act
      const result = await loadBlogConfig();

      // Assert
      expect(result).toHaveProperty('blogTitle');
      expect(result).toHaveProperty('menuItems');
      expect(result).toHaveProperty('copyright');
      expect(result).toHaveProperty('siteUrl');
      expect(result).toHaveProperty('siteName');
      expect(Array.isArray(result.menuItems)).toBe(true);
    });
  });
});
