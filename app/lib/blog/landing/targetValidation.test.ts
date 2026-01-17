import { describe, it, expect, beforeAll } from 'vitest';
import { validateTarget, isValidTarget } from './targetValidation';
import { loadSpec } from '../../../../tests/utils/loadSpec';
import type { BlogLandingSpec } from '../../../specs/blog/types';

describe('targetValidation - Logic Layer', () => {
  let landingSpec: BlogLandingSpec;

  beforeAll(async () => {
    landingSpec = await loadSpec<BlogLandingSpec>('blog', 'landing');
  });

  describe('validateTarget function', () => {
    it('should return valid target as-is', () => {
      // Arrange
      const target = 'engineer';

      // Act
      const result = validateTarget(
        target,
        landingSpec.targets.supported,
        landingSpec.targets.default
      );

      // Assert
      expect(result).toBe('engineer');
    });

    it('should return default target for invalid value', () => {
      // Arrange
      const invalidTarget = 'invalid-target';

      // Act
      const result = validateTarget(
        invalidTarget,
        landingSpec.targets.supported,
        landingSpec.targets.default
      );

      // Assert
      expect(result).toBe(landingSpec.targets.default);
    });

    it('should return default target for empty string', () => {
      // Arrange
      const emptyTarget = '';

      // Act
      const result = validateTarget(
        emptyTarget,
        landingSpec.targets.supported,
        landingSpec.targets.default
      );

      // Assert
      expect(result).toBe(landingSpec.targets.default);
    });

    it('should return default target for undefined', () => {
      // Arrange
      const undefinedTarget = undefined;

      // Act
      const result = validateTarget(
        undefinedTarget,
        landingSpec.targets.supported,
        landingSpec.targets.default
      );

      // Assert
      expect(result).toBe(landingSpec.targets.default);
    });

    it('should return default target for whitespace-only string', () => {
      // Arrange
      const whitespaceTarget = '   ';

      // Act
      const result = validateTarget(
        whitespaceTarget,
        landingSpec.targets.supported,
        landingSpec.targets.default
      );

      // Assert
      expect(result).toBe(landingSpec.targets.default);
    });

    it('should handle case-insensitive matching', () => {
      // Arrange
      const uppercaseTarget = 'ENGINEER';

      // Act
      const result = validateTarget(
        uppercaseTarget,
        landingSpec.targets.supported,
        landingSpec.targets.default
      );

      // Assert
      expect(result).toBe('ENGINEER'); // 元の文字列のケースを保持
    });

    it('should trim whitespace from target', () => {
      // Arrange
      const targetWithWhitespace = '  engineer  ';

      // Act
      const result = validateTarget(
        targetWithWhitespace,
        landingSpec.targets.supported,
        landingSpec.targets.default
      );

      // Assert
      expect(result).toBe('engineer'); // トリムされた値を返す
    });

    it('should validate all supported targets from spec', () => {
      // Act & Assert
      landingSpec.targets.supported.forEach(target => {
        const result = validateTarget(
          target,
          landingSpec.targets.supported,
          landingSpec.targets.default
        );
        expect(result).toBe(target);
      });
    });
  });

  describe('isValidTarget function', () => {
    it('should return true for valid target', () => {
      // Arrange
      const target = 'engineer';

      // Act
      const result = isValidTarget(target, landingSpec.targets.supported);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid target', () => {
      // Arrange
      const invalidTarget = 'invalid-target';

      // Act
      const result = isValidTarget(invalidTarget, landingSpec.targets.supported);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      // Arrange
      const emptyTarget = '';

      // Act
      const result = isValidTarget(emptyTarget, landingSpec.targets.supported);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      // Arrange
      const undefinedTarget = undefined;

      // Act
      const result = isValidTarget(undefinedTarget, landingSpec.targets.supported);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle case-insensitive matching', () => {
      // Arrange
      const uppercaseTarget = 'ENGINEER';

      // Act
      const result = isValidTarget(uppercaseTarget, landingSpec.targets.supported);

      // Assert
      expect(result).toBe(true);
    });

    it('should validate all supported targets from spec', () => {
      // Act & Assert
      landingSpec.targets.supported.forEach(target => {
        const result = isValidTarget(target, landingSpec.targets.supported);
        expect(result).toBe(true);
      });
    });
  });
});
