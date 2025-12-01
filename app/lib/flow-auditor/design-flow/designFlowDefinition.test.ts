import { describe, it, expect } from 'vitest';
import {
  getCommonCheckpointDefinitions,
  getSectionCheckpointDefinitions,
  getAllCheckpointDefinitions,
  validateCheckpointDefinitions,
  type CheckpointDefinition,
} from '~/lib/flow-auditor/design-flow/designFlowDefinition';

describe('designFlowDefinition - Pure Logic Layer', () => {
  describe('getCommonCheckpointDefinitions function', () => {
    it('should return 2 common checkpoint definitions', () => {
      // Act
      const result = getCommonCheckpointDefinitions();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(cp => cp.category === 'common')).toBe(true);
    });

    it('should include required common checkpoints', () => {
      // Act
      const result = getCommonCheckpointDefinitions();
      const names = result.map(cp => cp.name);

      // Assert
      expect(names).toContain('REQUIREMENTS_ANALYSIS_PIPE.md');
      expect(names).toContain('GUIDING_PRINCIPLES.md');
    });

    it('should have correct structure for each checkpoint', () => {
      // Act
      const result = getCommonCheckpointDefinitions();

      // Assert
      result.forEach(cp => {
        expect(cp).toHaveProperty('id');
        expect(cp).toHaveProperty('name');
        expect(cp).toHaveProperty('category');
        expect(cp).toHaveProperty('pathTemplate');
        expect(typeof cp.id).toBe('string');
        expect(typeof cp.name).toBe('string');
        expect(typeof cp.pathTemplate).toBe('string');
      });
    });

    it('should use only {service} placeholder in pathTemplate', () => {
      // Act
      const result = getCommonCheckpointDefinitions();

      // Assert
      result.forEach(cp => {
        const hasInvalidPlaceholder = /\{(?!service\})[^}]+\}/.test(cp.pathTemplate);
        expect(hasInvalidPlaceholder).toBe(false);
      });
    });
  });

  describe('getSectionCheckpointDefinitions function', () => {
    it('should return 5 section checkpoint definitions', () => {
      // Act
      const result = getSectionCheckpointDefinitions();

      // Assert
      expect(result).toHaveLength(5);
      expect(result.every(cp => cp.category === 'section')).toBe(true);
    });

    it('should include required section checkpoints', () => {
      // Act
      const result = getSectionCheckpointDefinitions();
      const names = result.map(cp => cp.name);

      // Assert
      expect(names).toContain('func-spec.md');
      expect(names).toContain('uiux-spec.md');
      expect(names).toContain('spec.yaml');
      expect(names).toContain('file-list.md');
      expect(names).toContain('TDD_WORK_FLOW.md');
    });

    it('should use {service} and {section} placeholders in pathTemplate', () => {
      // Act
      const result = getSectionCheckpointDefinitions();

      // Assert
      result.forEach(cp => {
        expect(cp.pathTemplate).toContain('{service}');
        expect(cp.pathTemplate).toContain('{section}');
      });
    });
  });

  describe('getAllCheckpointDefinitions function', () => {
    it('should return all 7 checkpoint definitions (2 common + 5 section)', () => {
      // Act
      const result = getAllCheckpointDefinitions();

      // Assert
      expect(result).toHaveLength(7);
    });

    it('should include both common and section checkpoints', () => {
      // Act
      const result = getAllCheckpointDefinitions();
      const commonCount = result.filter(cp => cp.category === 'common').length;
      const sectionCount = result.filter(cp => cp.category === 'section').length;

      // Assert
      expect(commonCount).toBe(2);
      expect(sectionCount).toBe(5);
    });

    it('should be deterministic (same output on multiple calls)', () => {
      // Act
      const result1 = getAllCheckpointDefinitions();
      const result2 = getAllCheckpointDefinitions();

      // Assert
      expect(result1).toEqual(result2);
    });
  });

  describe('validateCheckpointDefinitions function', () => {
    it('should validate correct checkpoint definitions', () => {
      // Arrange
      const validDefinitions: CheckpointDefinition[] = [
        {
          id: 'test1',
          name: 'test1.md',
          category: 'common',
          pathTemplate: 'develop/{service}/test1.md',
        },
        {
          id: 'test2',
          name: 'test2.md',
          category: 'section',
          pathTemplate: 'develop/{service}/{section}/test2.md',
        },
      ];

      // Act
      const isValid = validateCheckpointDefinitions(validDefinitions);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject definitions with duplicate IDs', () => {
      // Arrange
      const invalidDefinitions: CheckpointDefinition[] = [
        {
          id: 'duplicate',
          name: 'test1.md',
          category: 'common',
          pathTemplate: 'test1.md',
        },
        {
          id: 'duplicate',
          name: 'test2.md',
          category: 'common',
          pathTemplate: 'test2.md',
        },
      ];

      // Act
      const isValid = validateCheckpointDefinitions(invalidDefinitions);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject definitions with invalid placeholders', () => {
      // Arrange
      const invalidDefinitions: CheckpointDefinition[] = [
        {
          id: 'test1',
          name: 'test1.md',
          category: 'common',
          pathTemplate: 'develop/{invalid}/test1.md',
        },
      ];

      // Act
      const isValid = validateCheckpointDefinitions(invalidDefinitions);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should accept pathTemplates with only {service} and {section} placeholders', () => {
      // Arrange
      const validDefinitions: CheckpointDefinition[] = [
        {
          id: 'test1',
          name: 'test1.md',
          category: 'common',
          pathTemplate: 'scripts/test.toml',
        },
        {
          id: 'test2',
          name: 'test2.md',
          category: 'common',
          pathTemplate: 'develop/{service}/test2.md',
        },
        {
          id: 'test3',
          name: 'test3.md',
          category: 'section',
          pathTemplate: 'develop/{service}/{section}/test3.md',
        },
      ];

      // Act
      const isValid = validateCheckpointDefinitions(validDefinitions);

      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Data Immutability', () => {
    it('should not mutate returned checkpoint definitions', () => {
      // Act
      const result1 = getCommonCheckpointDefinitions();
      const result1Copy = JSON.parse(JSON.stringify(result1));
      const result2 = getCommonCheckpointDefinitions();

      // Mutate result1
      result1[0].name = 'MODIFIED';

      // Assert: result2 should not be affected
      expect(result2).toEqual(result1Copy);
    });
  });

  describe('Performance', () => {
    it('should execute within reasonable time', () => {
      // Act
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        getAllCheckpointDefinitions();
      }
      const endTime = performance.now();

      // Assert
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // 1000回実行で100ms以内
    });
  });
});
