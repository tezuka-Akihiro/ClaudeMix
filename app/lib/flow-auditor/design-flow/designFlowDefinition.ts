// designFlowDefinition - 純粋ロジック層
// チェックポイント定義（共通/セクション別）
// 副作用なし、テスタブルなビジネスロジック

/**
 * チェックポイント定義
 */
export interface CheckpointDefinition {
  id: string;
  name: string;
  category: 'common' | 'section';
  pathTemplate: string;
}

/**
 * 共通チェックポイント定義を取得
 */
export function getCommonCheckpointDefinitions(): CheckpointDefinition[] {
  return [
    {
      id: 'requirements-analysis',
      name: 'REQUIREMENTS_ANALYSIS_PIPE.md',
      category: 'common',
      pathTemplate: 'develop/{service}/REQUIREMENTS_ANALYSIS_PIPE.md',
    },
    {
      id: 'guiding-principles',
      name: 'GUIDING_PRINCIPLES.md',
      category: 'common',
      pathTemplate: 'develop/{service}/GUIDING_PRINCIPLES.md',
    },
  ];
}

/**
 * セクション別チェックポイント定義を取得
 */
export function getSectionCheckpointDefinitions(): CheckpointDefinition[] {
  return [
    {
      id: 'func-spec',
      name: 'func-spec.md',
      category: 'section',
      pathTemplate: 'develop/{service}/{section}/func-spec.md',
    },
    {
      id: 'uiux-spec',
      name: 'uiux-spec.md',
      category: 'section',
      pathTemplate: 'develop/{service}/{section}/uiux-spec.md',
    },
    {
      id: 'spec-yaml',
      name: 'spec.yaml',
      category: 'section',
      pathTemplate: 'develop/{service}/{section}/spec.yaml',
    },
    {
      id: 'file-list',
      name: 'file-list.md',
      category: 'section',
      pathTemplate: 'develop/{service}/{section}/file-list.md',
    },
    {
      id: 'tdd-workflow',
      name: 'TDD_WORK_FLOW.md',
      category: 'section',
      pathTemplate: 'develop/{service}/{section}/TDD_WORK_FLOW.md',
    },
  ];
}

/**
 * すべてのチェックポイント定義を取得
 */
export function getAllCheckpointDefinitions(): CheckpointDefinition[] {
  return [
    ...getCommonCheckpointDefinitions(),
    ...getSectionCheckpointDefinitions(),
  ];
}

/**
 * チェックポイント定義の検証
 * - IDの重複チェック
 * - pathTemplateのプレースホルダー検証
 */
export function validateCheckpointDefinitions(definitions: CheckpointDefinition[]): boolean {
  // IDの重複チェック
  const ids = definitions.map(d => d.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    return false;
  }

  // pathTemplateのプレースホルダー検証（{service}と{section}のみ許可）
  const validPlaceholderPattern = /^[^{}]*(\{(service|section)\}[^{}]*)*$/;
  for (const def of definitions) {
    if (!validPlaceholderPattern.test(def.pathTemplate)) {
      return false;
    }
  }

  return true;
}
