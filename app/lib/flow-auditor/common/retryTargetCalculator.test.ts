// retryTargetCalculator.test.ts - 純粋ロジック層: ユニットテスト
// リトライ時の影響範囲計算ロジックのテスト

import { describe, it, expect } from 'vitest';
import { calculateRetryTargets } from './retryTargetCalculator';
import type { Checkpoint } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';

describe('retryTargetCalculator', () => {
  const mockCheckpoints: Checkpoint[] = [
    {
      id: 'guiding-principles',
      name: 'GUIDING_PRINCIPLES.md',
      path: 'develop/flow-auditor/GUIDING_PRINCIPLES.md',
      exists: true,
      status: 'completed',
      flowType: 'common',
    },
    {
      id: 'common-func-spec',
      name: 'func-spec.md',
      path: 'develop/flow-auditor/common/func-spec.md',
      exists: true,
      status: 'completed',
      flowType: 'branched',
      section: 'common',
    },
    {
      id: 'common-uiux-spec',
      name: 'uiux-spec.md',
      path: 'develop/flow-auditor/common/uiux-spec.md',
      exists: true,
      status: 'completed',
      flowType: 'branched',
      section: 'common',
    },
    {
      id: 'common-spec-yaml',
      name: 'spec.yaml',
      path: 'develop/flow-auditor/common/spec.yaml',
      exists: false,
      status: 'pending',
      flowType: 'branched',
      section: 'common',
    },
    {
      id: 'common-tdd-workflow',
      name: 'TDD_WORK_FLOW.md',
      path: 'develop/flow-auditor/common/TDD_WORK_FLOW.md',
      exists: true,
      status: 'completed',
      flowType: 'branched',
      section: 'common',
    },
  ];

  describe('基本動作', () => {
    it('指定されたチェックポイントID以降のファイルをリストアップする', () => {
      const result = calculateRetryTargets('common-func-spec', mockCheckpoints);

      expect(result).toContain('develop/flow-auditor/common/func-spec.md');
      expect(result).toContain('develop/flow-auditor/common/uiux-spec.md');
      expect(result).toContain('develop/flow-auditor/common/TDD_WORK_FLOW.md');
      expect(result).not.toContain('develop/flow-auditor/GUIDING_PRINCIPLES.md'); // これより前
      expect(result).not.toContain('develop/flow-auditor/common/spec.yaml'); // exists: false
    });

    it('存在しないファイル(exists: false)は結果に含まれない', () => {
      const result = calculateRetryTargets('common-uiux-spec', mockCheckpoints);

      // spec.yamlはexists:falseなので含まれない
      expect(result).not.toContain('develop/flow-auditor/common/spec.yaml');
      // uiux-spec以降の存在するファイルのみ
      expect(result).toContain('develop/flow-auditor/common/uiux-spec.md');
      expect(result).toContain('develop/flow-auditor/common/TDD_WORK_FLOW.md');
    });

    it('最後のチェックポイントを選択した場合、そのファイルのみを返す', () => {
      const result = calculateRetryTargets('common-tdd-workflow', mockCheckpoints);

      expect(result).toEqual(['develop/flow-auditor/common/TDD_WORK_FLOW.md']);
    });
  });

  describe('エッジケース', () => {
    it('存在しないチェックポイントIDの場合、空配列を返す', () => {
      const result = calculateRetryTargets('non-existent-id', mockCheckpoints);

      expect(result).toEqual([]);
    });

    it('チェックポイント配列が空の場合、空配列を返す', () => {
      const result = calculateRetryTargets('any-id', []);

      expect(result).toEqual([]);
    });

    it('すべてのチェックポイントがexists:falseの場合、空配列を返す', () => {
      const allPendingCheckpoints: Checkpoint[] = mockCheckpoints.map(cp => ({
        ...cp,
        exists: false,
        status: 'pending' as const,
      }));

      const result = calculateRetryTargets('common-func-spec', allPendingCheckpoints);

      expect(result).toEqual([]);
    });
  });

  describe('順序保証', () => {
    it('返されるファイルパス配列が元のチェックポイント順序を保持する', () => {
      const result = calculateRetryTargets('guiding-principles', mockCheckpoints);

      // 元の順序: guiding-principles → func-spec → uiux-spec → (spec.yaml skip) → tdd-workflow
      expect(result).toEqual([
        'develop/flow-auditor/GUIDING_PRINCIPLES.md',
        'develop/flow-auditor/common/func-spec.md',
        'develop/flow-auditor/common/uiux-spec.md',
        'develop/flow-auditor/common/TDD_WORK_FLOW.md',
      ]);
    });
  });
});