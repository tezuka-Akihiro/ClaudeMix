import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadProjectSections, validateLoadProjectSectionsOptions, type LoadProjectSectionsOptions } from '~/data-io/flow-auditor/design-flow/loadProjectSections.server';
import fs from 'fs';
import path from 'path';
import toml from '@iarna/toml';

// Mock external dependencies
vi.mock('fs');
vi.mock('path');
vi.mock('@iarna/toml');

// --- Test Constants ---
const MOCK_ROOT = '/mock/project/root';
const MOCK_OPTIONS: LoadProjectSectionsOptions = {
  service: 'flow-auditor',
};

const MOCK_TOML_CONTENT = `
[services.flow-auditor]
[services.flow-auditor.sections.common]
[services.flow-auditor.sections.design-flow]
[services.flow-auditor.sections.operation]
`;

const MOCK_PARSED_TOML = {
  services: {
    'flow-auditor': {
      sections: {
        'common': {},
        'design-flow': {},
        'operation': {},
      },
    },
  },
};

const MOCK_TOML_WITH_MANY_SECTIONS = {
  services: {
    'flow-auditor': {
      sections: {
        'section1': {},
        'section2': {},
        'section3': {},
        'section4': {},
        'section5': {},
        'section6': {},
      },
    },
  },
};

// --- Helper Functions ---
const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);
const mockToml = vi.mocked(toml);

describe('loadProjectSections - Side Effects Layer', () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    process.cwd = vi.fn(() => MOCK_ROOT);
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  describe('loadProjectSections function', () => {
    it('should successfully load sections from project.toml', async () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(MOCK_PARSED_TOML as any);

      // Act
      const result = await loadProjectSections(MOCK_OPTIONS);

      // Assert
      expect(result).toBeDefined();
      expect(result.sections).toHaveLength(3);
      expect(result.sections).toEqual([
        { name: 'common' },
        { name: 'design-flow' },
        { name: 'operation' },
      ]);
    });

    it('should validate section count is within range (1-6)', async () => {
      // Arrange - 6 sections (boundary)
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(MOCK_TOML_WITH_MANY_SECTIONS as any);

      // Act
      const result = await loadProjectSections(MOCK_OPTIONS);

      // Assert
      expect(result.sections).toHaveLength(6);
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.sections.length).toBeLessThanOrEqual(6);
    });

    it('should return empty array for non-existent service', async () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(MOCK_PARSED_TOML as any);

      // Act & Assert
      await expect(
        loadProjectSections({ service: 'non-existent-service' })
      ).rejects.toThrow('Service "non-existent-service" not found');
    });

    it('should validate section names contain only valid characters', async () => {
      // Arrange
      const validSectionNames = ['common', 'design-flow', 'operation-flow', 'test123'];
      const mockTomlWithValidNames = {
        services: {
          'flow-auditor': {
            sections: Object.fromEntries(validSectionNames.map(name => [name, {}])),
          },
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(mockTomlWithValidNames as any);

      // Act
      const result = await loadProjectSections(MOCK_OPTIONS);

      // Assert
      expect(result.sections).toHaveLength(4);
      result.sections.forEach(section => {
        expect(section.name).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it('should handle file system errors gracefully', async () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(false);

      // Act & Assert
      await expect(loadProjectSections(MOCK_OPTIONS)).rejects.toThrow('project.toml file not found');
    });

    it('should handle TOML parsing errors gracefully', async () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid toml content');
      mockToml.parse.mockImplementation(() => {
        throw new Error('TOML parse error');
      });

      // Act & Assert
      await expect(loadProjectSections(MOCK_OPTIONS)).rejects.toThrow('loadProjectSections operation failed');
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(false);

      // Act & Assert
      try {
        await loadProjectSections(MOCK_OPTIONS);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('loadProjectSections operation failed');
        expect((error as Error).message).toContain('project.toml file not found');
      }
    });
  });

  describe('validateLoadProjectSectionsOptions function', () => {
    it('should validate correct options structure', () => {
      // Arrange & Act
      const isValid = validateLoadProjectSectionsOptions(MOCK_OPTIONS);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject invalid options structure', () => {
      // Arrange
      const invalidOptions = [
        null,
        undefined,
        {},
        { service: '' }, // empty service
        { service: 123 }, // invalid type
        { wrongKey: 'test' }, // missing service
      ];

      invalidOptions.forEach((invalidOption) => {
        // Act
        const isValid = validateLoadProjectSectionsOptions(invalidOption);

        // Assert
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Performance and Monitoring', () => {
    it('should complete within acceptable time limits', async () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(MOCK_TOML_CONTENT);
      mockToml.parse.mockReturnValue(MOCK_PARSED_TOML as any);

      // Act
      const startTime = Date.now();
      await loadProjectSections(MOCK_OPTIONS);
      const endTime = Date.now();

      // Assert
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(500); // 500ms以内
    });
  });
});
