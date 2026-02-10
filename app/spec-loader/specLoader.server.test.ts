import { describe, it, expect } from 'vitest';
import { loadSpec, loadSharedSpec } from './specLoader.server';
import type { ValidationSpec, ResponsiveSpec, ServerSpec } from '~/specs/shared/types';

describe('specLoader', () => {
  describe('loadSharedSpec', () => {
    it('validation specを正しくロードできる', () => {
      const spec = loadSharedSpec<ValidationSpec>('validation');

      expect(spec.metadata.feature_name).toBe('shared-validation');
      expect(spec.email.pattern).toBeDefined();
      expect(spec.password.min_length).toBe(8);
    });

    it('responsive specを正しくロードできる', () => {
      const spec = loadSharedSpec<ResponsiveSpec>('responsive');

      expect(spec.breakpoints.mobile).toBe(768);
      expect(spec.breakpoints.tablet).toBe(1024);
      expect(spec.grid_columns.desktop).toBe(3);
    });

    it('server specを正しくロードできる', () => {
      const spec = loadSharedSpec<ServerSpec>('server');

      expect(spec.loader.timeout).toBe(5000);
      expect(spec.action.timeout).toBe(10000);
      expect(spec.security.bcrypt_rounds).toBe(10);
    });

    it('存在しないspec名でエラーを投げる', () => {
      expect(() => {
        loadSharedSpec('nonexistent');
      }).toThrow('Shared spec not found: nonexistent');
    });
  });

  describe('loadSpec (既存)', () => {
    it('blog/posts specを正しくロードできる', () => {
      const spec = loadSpec('blog/posts');
      expect(spec).toBeDefined();
    });
  });
});
