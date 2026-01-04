import { describe, it, expect, beforeAll } from 'vitest';
import { formatCopyright } from './copyrightFormatter';
import { loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { ProjectSpec } from '~/specs/shared/types';

describe('formatCopyright - Pure Logic Layer', () => {
  let projectSpec: ProjectSpec;

  beforeAll(() => {
    projectSpec = loadSharedSpec<ProjectSpec>('project');
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
      // The function has a hardcoded default of "ClaudeMix"
      expect(result).toContain("ClaudeMix");
    });

    it('should format correctly (© YYYY ProjectName)', () => {
      // Arrange
      const currentYear = new Date().getFullYear();
      const projectName = projectSpec.project.name;

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
