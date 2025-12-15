import { describe, it, expect } from 'vitest';
import {
  GOOGLE_FONTS_CSS_URL,
  FONT_FETCH_USER_AGENT,
  OGP_FONT_CACHE_NAME,
  FONT_CONTENT_TYPE,
  FONT_CACHE_CONTROL,
  FONT_URL_REGEX,
} from '~/lib/blog/common/ogp-constants';

describe('ogp-constants - OGP image generation constants', () => {
  describe('GOOGLE_FONTS_CSS_URL', () => {
    it('should be a valid URL string', () => {
      expect(typeof GOOGLE_FONTS_CSS_URL).toBe('string');
      expect(() => new URL(GOOGLE_FONTS_CSS_URL)).not.toThrow();
    });

    it('should point to Google Fonts API', () => {
      expect(GOOGLE_FONTS_CSS_URL).toContain('fonts.googleapis.com');
    });

    it('should request Noto Sans JP font', () => {
      expect(GOOGLE_FONTS_CSS_URL).toContain('Noto+Sans+JP');
    });

    it('should specify weight 400', () => {
      expect(GOOGLE_FONTS_CSS_URL).toContain('wght@400');
    });
  });

  describe('FONT_FETCH_USER_AGENT', () => {
    it('should be a non-empty string', () => {
      expect(typeof FONT_FETCH_USER_AGENT).toBe('string');
      expect(FONT_FETCH_USER_AGENT.length).toBeGreaterThan(0);
    });

    it('should contain Mozilla identifier', () => {
      expect(FONT_FETCH_USER_AGENT).toContain('Mozilla');
    });
  });

  describe('OGP_FONT_CACHE_NAME', () => {
    it('should be a non-empty string', () => {
      expect(typeof OGP_FONT_CACHE_NAME).toBe('string');
      expect(OGP_FONT_CACHE_NAME.length).toBeGreaterThan(0);
    });

    it('should contain version identifier', () => {
      expect(OGP_FONT_CACHE_NAME).toMatch(/v\d+/);
    });
  });

  describe('FONT_CONTENT_TYPE', () => {
    it('should be a valid MIME type for TTF', () => {
      expect(FONT_CONTENT_TYPE).toBe('font/ttf');
    });
  });

  describe('FONT_CACHE_CONTROL', () => {
    it('should be a valid Cache-Control header value', () => {
      expect(typeof FONT_CACHE_CONTROL).toBe('string');
      expect(FONT_CACHE_CONTROL).toContain('public');
      expect(FONT_CACHE_CONTROL).toContain('max-age');
      expect(FONT_CACHE_CONTROL).toContain('immutable');
    });

    it('should specify long-term caching (1 year)', () => {
      expect(FONT_CACHE_CONTROL).toContain('31536000');
    });
  });

  describe('FONT_URL_REGEX', () => {
    it('should be a RegExp instance', () => {
      expect(FONT_URL_REGEX).toBeInstanceOf(RegExp);
    });

    it('should match valid font URL in CSS', () => {
      const validCSS = `@font-face { font-family: 'Test'; src: url(https://fonts.gstatic.com/s/notosansjp/v52/test.ttf) format('truetype'); }`;
      const match = validCSS.match(FONT_URL_REGEX);

      expect(match).not.toBeNull();
      expect(match![1]).toBe('https://fonts.gstatic.com/s/notosansjp/v52/test.ttf');
    });

    it('should not match URLs without .ttf extension', () => {
      const invalidCSS = `src: url(https://example.com/font.woff) format('woff');`;
      const match = invalidCSS.match(FONT_URL_REGEX);

      expect(match).toBeNull();
    });

    it('should not match non-URL strings', () => {
      const invalidCSS = `font-family: 'Arial', sans-serif;`;
      const match = invalidCSS.match(FONT_URL_REGEX);

      expect(match).toBeNull();
    });

    it('should extract HTTPS URLs only', () => {
      const httpsCSS = `url(https://fonts.gstatic.com/test.ttf)`;
      const httpCSS = `url(http://fonts.gstatic.com/test.ttf)`;

      expect(httpsCSS.match(FONT_URL_REGEX)).not.toBeNull();
      expect(httpCSS.match(FONT_URL_REGEX)).toBeNull();
    });
  });
});
