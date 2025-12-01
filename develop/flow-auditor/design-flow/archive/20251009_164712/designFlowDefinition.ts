// designFlowDefinition - 🧠 純粋ロジック層
// 設計フローのチェックポイント定義を提供する
// 副作用なし、テスタブルなビジネスロジック

export interface Checkpoint {
  id: string;
  label: string;
  emoji: string;
  filePath: string;
  phase: 'registration' | 'design' | 'planning';
  section?: string; // セクション名（全セクション共通の場合はundefined）
}

export interface PhaseDefinition {
  phase: 'registration' | 'design' | 'planning';
  title: string;
  emoji: string;
  checkpoints: Checkpoint[];
}

/**
 * Design Flow の全チェックポイント定義を返す
 * @returns チェックポイント定義の配列
 */
export function designFlowDefinition(): Checkpoint[] {
  return [
    // Step 0: サービス登録
    {
      id: 'project-toml',
      label: 'project.toml',
      emoji: '💭',
      filePath: 'scripts/project.toml',
      phase: 'registration',
    },
    {
      id: 'start-dev',
      label: 'start-dev.js 実行',
      emoji: '🏗️',
      filePath: 'scripts/start-dev.js',
      phase: 'registration',
    },
    {
      id: 'requirements-analysis-pipe',
      label: 'REQUIREMENTS_ANALYSIS_PIPE.md',
      emoji: '▶️',
      filePath: 'develop/flow-auditor/REQUIREMENTS_ANALYSIS_PIPE.md',
      phase: 'registration',
    },

    // Step 1: 設計フェーズ
    {
      id: 'guiding-principles',
      label: 'GUIDING_PRINCIPLES.md',
      emoji: '🗾',
      filePath: 'develop/flow-auditor/GUIDING_PRINCIPLES.md',
      phase: 'design',
    },
    {
      id: 'requirements-operation',
      label: 'func-spec.md',
      emoji: '📚',
      filePath: 'develop/flow-auditor/operation/func-spec.md',
      phase: 'design',
      section: 'operation',
    },
    {
      id: 'requirements-design-flow',
      label: 'func-spec.md',
      emoji: '📚',
      filePath: 'develop/flow-auditor/design-flow/func-spec.md',
      phase: 'design',
      section: 'design-flow',
    },
    {
      id: 'requirements-implementation-flow',
      label: 'func-spec.md',
      emoji: '📚',
      filePath: 'develop/flow-auditor/implementation-flow/func-spec.md',
      phase: 'design',
      section: 'implementation-flow',
    },
    {
      id: 'uiux-spec-operation',
      label: 'uiux-spec.md',
      emoji: '🖼️',
      filePath: 'develop/flow-auditor/operation/uiux-spec.md',
      phase: 'design',
      section: 'operation',
    },
    {
      id: 'uiux-spec-design-flow',
      label: 'uiux-spec.md',
      emoji: '🖼️',
      filePath: 'develop/flow-auditor/design-flow/uiux-spec.md',
      phase: 'design',
      section: 'design-flow',
    },
    {
      id: 'uiux-spec-implementation-flow',
      label: 'uiux-spec.md',
      emoji: '🖼️',
      filePath: 'develop/flow-auditor/implementation-flow/uiux-spec.md',
      phase: 'design',
      section: 'implementation-flow',
    },

    // Step 2: 実装計画
    {
      id: 'file-list-operation',
      label: 'file-list.md',
      emoji: '📝',
      filePath: 'develop/flow-auditor/operation/file-list.md',
      phase: 'planning',
      section: 'operation',
    },
    {
      id: 'file-list-design-flow',
      label: 'file-list.md',
      emoji: '📝',
      filePath: 'develop/flow-auditor/design-flow/file-list.md',
      phase: 'planning',
      section: 'design-flow',
    },
    {
      id: 'file-list-implementation-flow',
      label: 'file-list.md',
      emoji: '📝',
      filePath: 'develop/flow-auditor/implementation-flow/file-list.md',
      phase: 'planning',
      section: 'implementation-flow',
    },
    {
      id: 'generate-requests-operation',
      label: 'generate-requests.md',
      emoji: '🤖',
      filePath: 'develop/flow-auditor/operation/generate-requests.md',
      phase: 'planning',
      section: 'operation',
    },
    {
      id: 'generate-requests-design-flow',
      label: 'generate-requests.md',
      emoji: '🤖',
      filePath: 'develop/flow-auditor/design-flow/generate-requests.md',
      phase: 'planning',
      section: 'design-flow',
    },
    {
      id: 'generate-requests-implementation-flow',
      label: 'generate-requests.md',
      emoji: '🤖',
      filePath: 'develop/flow-auditor/implementation-flow/generate-requests.md',
      phase: 'planning',
      section: 'implementation-flow',
    },
    {
      id: 'tdd-work-flow-operation',
      label: 'TDD_WORK_FLOW.md',
      emoji: '⛏️',
      filePath: 'develop/flow-auditor/operation/TDD_WORK_FLOW.md',
      phase: 'planning',
      section: 'operation',
    },
    {
      id: 'tdd-work-flow-design-flow',
      label: 'TDD_WORK_FLOW.md',
      emoji: '⛏️',
      filePath: 'develop/flow-auditor/design-flow/TDD_WORK_FLOW.md',
      phase: 'planning',
      section: 'design-flow',
    },
    {
      id: 'tdd-work-flow-implementation-flow',
      label: 'TDD_WORK_FLOW.md',
      emoji: '⛏️',
      filePath: 'develop/flow-auditor/implementation-flow/TDD_WORK_FLOW.md',
      phase: 'planning',
      section: 'implementation-flow',
    },
  ];
}

/**
 * フェーズ定義を返す
 */
export function getPhaseDefinitions(): PhaseDefinition[] {
  return [
    {
      phase: 'registration',
      title: 'Step 0: サービス登録',
      emoji: '🏗️',
      checkpoints: [],
    },
    {
      phase: 'design',
      title: 'Step 1: 設計フェーズ',
      emoji: '📋',
      checkpoints: [],
    },
    {
      phase: 'planning',
      title: 'Step 2: 実装計画',
      emoji: '✒️',
      checkpoints: [],
    },
  ];
}
