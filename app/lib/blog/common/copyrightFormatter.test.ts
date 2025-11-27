import { describe, it, expect, beforeAll } from 'vitest';
import { formatCopyright } from '~/lib/blog/common/copyrightFormatter';
import { loadBlogPostsSpec, type BlogPostsSpec } from '../../../../tests/e2e/utils/loadSpec';

describe('formatCopyright - Pure Logic Layer', () => {
  let spec: BlogPostsSpec;

  beforeAll(async () => {
    spec = await loadBlogPostsSpec();
  });

  describe('formatCopyright function', () => {
    it('should insert current year correctly', () => {
      // Arrange
      const currentYear = new Date().getFullYear();

      // Act
      const result = formatCopyright();

      // Assert
      expect(result).toContain(currentYear.toString());
    });

    it('should insert project name correctly', () => {
      // Arrange
      const projectName = "My Test Project";

      // Act
      const result = formatCopyright(projectName);

      // Assert
      expect(result).toContain(projectName);
    });

    it('should use default project name when not provided', () => {
      // Act
      const result = formatCopyright();

      // Assert
      expect(result).toContain(spec.project.copyright_name);
    });

    it('should format correctly (© YYYY ProjectName)', () => {
      // Arrange
      const currentYear = new Date().getFullYear();
      const projectName = spec.project.copyright_name;

      // Act
      const result = formatCopyright(projectName);

      // Assert
      expect(result).toBe(`© ${currentYear} ${projectName}`);
    });

    it('should be a pure function (same input produces same output)', () => {
      // Arrange
      const projectName = "Test Project";

      // Act
      const result1 = formatCopyright(projectName);
      const result2 = formatCopyright(projectName);

      // Assert
      expect(result1).toBe(result2);
    });
  });
});
