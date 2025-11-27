import { describe, it, expect } from 'vitest';
import {
  buildFlowGroups,
  ValidationError,
  type Checkpoint,
  type Section,
  type FlowGroup
} from '~/lib/flow-auditor/design-flow/flowGroupBuilder';
import { getCommonCheckpointDefinitions, getSectionCheckpointDefinitions } from '~/lib/flow-auditor/design-flow/designFlowDefinition';

describe('flowGroupBuilder - Pure Logic Layer', () => {
  describe('buildFlowGroups function', () => {
    it('should group common and section checkpoints correctly', () => {
      // Arrange
      const checkpoints: Checkpoint[] = [
        { id: 'requirements-analysis', name: 'REQUIREMENTS_ANALYSIS_PIPE.md', path: 'develop/flow-auditor/REQUIREMENTS_ANALYSIS_PIPE.md', exists: true, status: 'completed', flowType: 'common' },
        { id: 'func-spec', name: 'func-spec.md', path: 'develop/flow-auditor/design-flow/func-spec.md', exists: true, status: 'completed', flowType: 'branched', section: 'design-flow' },
      ];
      const sections: Section[] = [{ name: 'design-flow' }];

      // Act
      const result = buildFlowGroups(checkpoints, sections);

      // Assert
      expect(result.common).toHaveLength(1);
      expect(result.common[0].id).toBe('requirements-analysis');
      expect(result.commonSection).toHaveLength(0);
      expect(result.branched).toHaveLength(1);
      expect(result.branched[0].sectionName).toBe('design-flow');
      expect(result.branched[0].checkpoints).toHaveLength(1);
    });

    it('should handle 1-6 sections within valid range', () => {
      // Arrange
      const checkpoints: Checkpoint[] = [
        { id: 'func-spec-1', name: 'func-spec.md', path: 'develop/service/section1/func-spec.md', exists: true, status: 'completed', flowType: 'branched', section: 'section1' },
        { id: 'func-spec-2', name: 'func-spec.md', path: 'develop/service/section2/func-spec.md', exists: true, status: 'completed', flowType: 'branched', section: 'section2' },
        { id: 'func-spec-3', name: 'func-spec.md', path: 'develop/service/section3/func-spec.md', exists: true, status: 'completed', flowType: 'branched', section: 'section3' },
      ];
      const sections: Section[] = [
        { name: 'section1' },
        { name: 'section2' },
        { name: 'section3' },
      ];

      // Act
      const result = buildFlowGroups(checkpoints, sections);

      // Assert
      expect(result.branched).toHaveLength(3);
    });

    it('should throw ValidationError when section count exceeds 6', () => {
      // Arrange
      const sections: Section[] = [
        { name: 'section1' },
        { name: 'section2' },
        { name: 'section3' },
        { name: 'section4' },
        { name: 'section5' },
        { name: 'section6' },
        { name: 'section7' },
      ];
      const checkpoints: Checkpoint[] = [];

      // Act & Assert
      expect(() => buildFlowGroups(checkpoints, sections)).toThrow(ValidationError);
      expect(() => buildFlowGroups(checkpoints, sections)).toThrow(/セクション数が最大値（6）を超えています/);
    });

    it('should throw ValidationError when section names are duplicated', () => {
      // Arrange
      const sections: Section[] = [
        { name: 'design-flow' },
        { name: 'design-flow' },
      ];
      const checkpoints: Checkpoint[] = [];

      // Act & Assert
      expect(() => buildFlowGroups(checkpoints, sections)).toThrow(ValidationError);
    });

    it('should be deterministic (same input, same output)', () => {
      // Arrange
      const checkpoints: Checkpoint[] = [
        { id: 'requirements-analysis', name: 'REQUIREMENTS_ANALYSIS_PIPE.md', path: 'develop/flow-auditor/REQUIREMENTS_ANALYSIS_PIPE.md', exists: true, status: 'completed', flowType: 'common' },
      ];
      const sections: Section[] = [{ name: 'design-flow' }];

      // Act
      const result1 = buildFlowGroups(checkpoints, sections);
      const result2 = buildFlowGroups(checkpoints, sections);

      // Assert
      expect(result1).toEqual(result2);
    });

    it('should handle empty checkpoints array', () => {
      // Arrange
      const checkpoints: Checkpoint[] = [];
      const sections: Section[] = [{ name: 'design-flow' }];

      // Act
      const result = buildFlowGroups(checkpoints, sections);

      // Assert
      expect(result.common).toEqual([]);
      expect(result.commonSection).toEqual([]);
      expect(result.branched).toHaveLength(1);
      expect(result.branched[0].checkpoints).toEqual([]);
    });

    it('should maintain data immutability', () => {
      // Arrange
      const checkpoints: Checkpoint[] = [
        { id: 'requirements-analysis', name: 'REQUIREMENTS_ANALYSIS_PIPE.md', path: 'develop/flow-auditor/REQUIREMENTS_ANALYSIS_PIPE.md', exists: true, status: 'completed', flowType: 'common' },
      ];
      const sections: Section[] = [{ name: 'design-flow' }];
      const originalCheckpoints = JSON.parse(JSON.stringify(checkpoints));
      const originalSections = JSON.parse(JSON.stringify(sections));

      // Act
      buildFlowGroups(checkpoints, sections);

      // Assert
      expect(checkpoints).toEqual(originalCheckpoints);
      expect(sections).toEqual(originalSections);
    });

    it('should exclude common section from branched flow groups', () => {
      // Arrange
      const checkpoints: Checkpoint[] = [
        { id: 'common-func-spec', name: 'func-spec.md', path: 'develop/service/common/func-spec.md', exists: true, status: 'completed', flowType: 'branched', section: 'common' },
        { id: 'section1-func-spec', name: 'func-spec.md', path: 'develop/service/section1/func-spec.md', exists: true, status: 'completed', flowType: 'branched', section: 'section1' },
      ];
      const sections: Section[] = [
        { name: 'common' },
        { name: 'section1' },
      ];

      // Act
      const result = buildFlowGroups(checkpoints, sections);

      // Assert
      expect(result.commonSection).toHaveLength(1);
      expect(result.commonSection[0].id).toBe('common-func-spec');
      expect(result.commonSection[0].section).toBe('common');
      expect(result.branched).toHaveLength(1); // commonセクションは除外される
      expect(result.branched[0].sectionName).toBe('section1');
    });
  });

  describe('Performance', () => {
    it('should execute within reasonable time with 6 sections', () => {
      // Arrange
      const checkpoints: Checkpoint[] = [];
      const sections: Section[] = Array.from({ length: 6 }, (_, i) => ({ name: `section${i + 1}` }));

      // Act
      const startTime = performance.now();
      buildFlowGroups(checkpoints, sections);
      const endTime = performance.now();

      // Assert
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // 100ms以内
    });
  });
});