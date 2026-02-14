import { describe, it, expect, beforeAll } from 'vitest';
import { getFallbackThumbnailUrl } from './getFallbackThumbnailUrl';
import { loadSpec, type BlogPostsSpec } from '../../../../tests/utils/loadSpec';

describe('getFallbackThumbnailUrl', () => {
  let spec: BlogPostsSpec;

  beforeAll(async () => {
    spec = await loadSpec<BlogPostsSpec>('blog', 'posts');
  });

  it('should return the correct default image object for ClaudeMix categories', () => {
    const categories = ['ClaudeMix ガイド', 'ClaudeMix 記録', 'ClaudeMix 考察'];
    const mapping = spec.thumbnail.display.default_mapping!;

    categories.forEach(category => {
      const result = getFallbackThumbnailUrl(category, spec);
      expect(result).toEqual(mapping[category]);
      expect(result).toHaveProperty('lg');
      expect(result).toHaveProperty('sm');
    });
  });

  it('should return the correct default image object for "起業" category', () => {
    const category = '起業';
    const mapping = spec.thumbnail.display.default_mapping!;
    const result = getFallbackThumbnailUrl(category, spec);
    expect(result).toEqual(mapping[category]);
    expect(result).toHaveProperty('lg');
    expect(result).toHaveProperty('sm');
  });

  it('should return the correct default image object for "インフォメーション" category', () => {
    const category = 'インフォメーション';
    const mapping = spec.thumbnail.display.default_mapping!;
    const result = getFallbackThumbnailUrl(category, spec);
    expect(result).toEqual(mapping[category]);
    expect(result).toHaveProperty('lg');
    expect(result).toHaveProperty('sm');
  });

  it('should return null for unknown category if no default mapping exists', () => {
    expect(getFallbackThumbnailUrl('Unknown', spec)).toBeNull();
  });
});
