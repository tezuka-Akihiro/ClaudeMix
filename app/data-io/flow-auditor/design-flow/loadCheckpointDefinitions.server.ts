// loadCheckpointDefinitions.server - Data-IO Layer (data-io層)
// Load checkpoint definitions from config.json

import { loadFlowAuditorConfig, type CheckpointConfig } from '~/data-io/flow-auditor/common/loadFlowAuditorConfig.server';

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
 * config.jsonから共通チェックポイント定義を取得
 */
export function getCommonCheckpointDefinitions(): CheckpointDefinition[] {
  try {
    const config = loadFlowAuditorConfig();
    return config.designFlow.commonCheckpoints.map(cp => ({
      id: cp.id,
      name: cp.name,
      category: 'common' as const,
      pathTemplate: cp.pathTemplate,
    }));
  } catch (error) {
    console.error('Failed to load common checkpoint definitions:', error);
    // フォールバック: 空配列を返す
    return [];
  }
}

/**
 * config.jsonからセクション別チェックポイント定義を取得
 */
export function getSectionCheckpointDefinitions(): CheckpointDefinition[] {
  try {
    const config = loadFlowAuditorConfig();
    return config.designFlow.sectionCheckpoints.map(cp => ({
      id: cp.id,
      name: cp.name,
      category: 'section' as const,
      pathTemplate: cp.pathTemplate,
    }));
  } catch (error) {
    console.error('Failed to load section checkpoint definitions:', error);
    // フォールバック: 空配列を返す
    return [];
  }
}

/**
 * config.jsonからすべてのチェックポイント定義を取得
 */
export function getAllCheckpointDefinitions(): CheckpointDefinition[] {
  return [
    ...getCommonCheckpointDefinitions(),
    ...getSectionCheckpointDefinitions(),
  ];
}
