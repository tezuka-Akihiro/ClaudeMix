import { describe, it, expect, beforeAll } from 'vitest';
import {
  shouldTriggerAnimation,
  isFullyVisible,
  isPartiallyVisible,
  calculateScrollProgress,
} from './scrollAnimation';
import { loadSpec } from '../../../../tests/utils/loadSpec';
import type { BlogLandingSpec } from '../../../specs/blog/types';

describe('scrollAnimation - Logic Layer', () => {
  let landingSpec: BlogLandingSpec;

  beforeAll(async () => {
    landingSpec = await loadSpec<BlogLandingSpec>('blog', 'landing');
  });

  describe('shouldTriggerAnimation function', () => {
    it('should return true when element bottom exceeds threshold position', () => {
      // Arrange
      const elementTop = 100;
      const elementBottom = 200;
      const viewportHeight = 1000;
      const threshold = landingSpec.animation.viewport_threshold; // 0.7

      // Act
      const result = shouldTriggerAnimation(
        elementTop,
        elementBottom,
        viewportHeight,
        threshold
      );

      // Assert
      // threshold position = 1000 * 0.7 = 700
      // elementBottom (200) < threshold position (700) → false
      expect(result).toBe(false);
    });

    it('should return false when element bottom is below threshold position', () => {
      // Arrange
      const elementTop = 500;
      const elementBottom = 600;
      const viewportHeight = 1000;
      const threshold = 0.7;

      // Act
      const result = shouldTriggerAnimation(
        elementTop,
        elementBottom,
        viewportHeight,
        threshold
      );

      // Assert
      // threshold position = 1000 * 0.7 = 700
      // elementBottom (600) < threshold position (700) → false
      expect(result).toBe(false);
    });

    it('should return true when element bottom exceeds 70% threshold', () => {
      // Arrange
      const elementTop = 600;
      const elementBottom = 750;
      const viewportHeight = 1000;
      const threshold = 0.7;

      // Act
      const result = shouldTriggerAnimation(
        elementTop,
        elementBottom,
        viewportHeight,
        threshold
      );

      // Assert
      // threshold position = 1000 * 0.7 = 700
      // elementBottom (750) > threshold position (700) → true
      expect(result).toBe(true);
    });

    it('should handle negative elementTop correctly', () => {
      // Arrange
      const elementTop = -100;
      const elementBottom = 800;
      const viewportHeight = 1000;
      const threshold = 0.7;

      // Act
      const result = shouldTriggerAnimation(
        elementTop,
        elementBottom,
        viewportHeight,
        threshold
      );

      // Assert
      // elementBottom (800) > threshold position (700) → true
      expect(result).toBe(true);
    });

    it('should throw error for invalid threshold (< 0)', () => {
      // Arrange
      const elementTop = 100;
      const elementBottom = 200;
      const viewportHeight = 1000;
      const invalidThreshold = -0.1;

      // Act & Assert
      expect(() =>
        shouldTriggerAnimation(elementTop, elementBottom, viewportHeight, invalidThreshold)
      ).toThrow('Threshold must be between 0 and 1');
    });

    it('should throw error for invalid threshold (> 1)', () => {
      // Arrange
      const elementTop = 100;
      const elementBottom = 200;
      const viewportHeight = 1000;
      const invalidThreshold = 1.1;

      // Act & Assert
      expect(() =>
        shouldTriggerAnimation(elementTop, elementBottom, viewportHeight, invalidThreshold)
      ).toThrow('Threshold must be between 0 and 1');
    });

    it('should use spec viewport_threshold value', () => {
      // Arrange
      const elementTop = 600;
      const elementBottom = 750;
      const viewportHeight = 1000;

      // Act
      const result = shouldTriggerAnimation(
        elementTop,
        elementBottom,
        viewportHeight,
        landingSpec.animation.viewport_threshold
      );

      // Assert
      expect(result).toBe(true);
      expect(landingSpec.animation.viewport_threshold).toBe(0.7);
    });
  });

  describe('isFullyVisible function', () => {
    it('should return true when element is fully visible', () => {
      // Arrange
      const elementTop = 100;
      const elementBottom = 200;
      const viewportHeight = 1000;

      // Act
      const result = isFullyVisible(elementTop, elementBottom, viewportHeight);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when element top is above viewport', () => {
      // Arrange
      const elementTop = -50;
      const elementBottom = 200;
      const viewportHeight = 1000;

      // Act
      const result = isFullyVisible(elementTop, elementBottom, viewportHeight);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when element bottom is below viewport', () => {
      // Arrange
      const elementTop = 100;
      const elementBottom = 1100;
      const viewportHeight = 1000;

      // Act
      const result = isFullyVisible(elementTop, elementBottom, viewportHeight);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when element exactly fits viewport', () => {
      // Arrange
      const elementTop = 0;
      const elementBottom = 1000;
      const viewportHeight = 1000;

      // Act
      const result = isFullyVisible(elementTop, elementBottom, viewportHeight);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isPartiallyVisible function', () => {
    it('should return true when element is partially visible (top cut off)', () => {
      // Arrange
      const elementTop = -50;
      const elementBottom = 100;
      const viewportHeight = 1000;

      // Act
      const result = isPartiallyVisible(elementTop, elementBottom, viewportHeight);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when element is fully visible', () => {
      // Arrange
      const elementTop = 100;
      const elementBottom = 200;
      const viewportHeight = 1000;

      // Act
      const result = isPartiallyVisible(elementTop, elementBottom, viewportHeight);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when element is completely above viewport', () => {
      // Arrange
      const elementTop = -200;
      const elementBottom = -50;
      const viewportHeight = 1000;

      // Act
      const result = isPartiallyVisible(elementTop, elementBottom, viewportHeight);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when element is completely below viewport', () => {
      // Arrange
      const elementTop = 1100;
      const elementBottom = 1200;
      const viewportHeight = 1000;

      // Act
      const result = isPartiallyVisible(elementTop, elementBottom, viewportHeight);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when element is partially visible (bottom cut off)', () => {
      // Arrange
      const elementTop = 900;
      const elementBottom = 1100;
      const viewportHeight = 1000;

      // Act
      const result = isPartiallyVisible(elementTop, elementBottom, viewportHeight);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('calculateScrollProgress function', () => {
    it('should return 0.0 at top of page', () => {
      // Arrange
      const scrollTop = 0;
      const scrollHeight = 2000;
      const viewportHeight = 1000;

      // Act
      const result = calculateScrollProgress(scrollTop, scrollHeight, viewportHeight);

      // Assert
      expect(result).toBe(0.0);
    });

    it('should return 1.0 at bottom of page', () => {
      // Arrange
      const scrollTop = 1000;
      const scrollHeight = 2000;
      const viewportHeight = 1000;

      // Act
      const result = calculateScrollProgress(scrollTop, scrollHeight, viewportHeight);

      // Assert
      expect(result).toBe(1.0);
    });

    it('should return 0.5 at middle of page', () => {
      // Arrange
      const scrollTop = 500;
      const scrollHeight = 2000;
      const viewportHeight = 1000;

      // Act
      const result = calculateScrollProgress(scrollTop, scrollHeight, viewportHeight);

      // Assert
      expect(result).toBe(0.5);
    });

    it('should return 1.0 when content is shorter than viewport', () => {
      // Arrange
      const scrollTop = 0;
      const scrollHeight = 500;
      const viewportHeight = 1000;

      // Act
      const result = calculateScrollProgress(scrollTop, scrollHeight, viewportHeight);

      // Assert
      expect(result).toBe(1.0);
    });

    it('should clamp progress to 0.0 minimum', () => {
      // Arrange
      const scrollTop = -100;
      const scrollHeight = 2000;
      const viewportHeight = 1000;

      // Act
      const result = calculateScrollProgress(scrollTop, scrollHeight, viewportHeight);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0.0);
      expect(result).toBe(0.0);
    });

    it('should clamp progress to 1.0 maximum', () => {
      // Arrange
      const scrollTop = 1500;
      const scrollHeight = 2000;
      const viewportHeight = 1000;

      // Act
      const result = calculateScrollProgress(scrollTop, scrollHeight, viewportHeight);

      // Assert
      expect(result).toBeLessThanOrEqual(1.0);
      expect(result).toBe(1.0);
    });
  });
});
