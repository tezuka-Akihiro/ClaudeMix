// loadFlowAuditorConfig.server - Data-IO Layer (data-io層)
// Load flow-auditor template configuration from scripts/generate/config.json

import fs from 'fs';
import path from 'path';

/**
 * チェックポイント定義（config.jsonから読み込む形式）
 */
export interface CheckpointConfig {
  id: string;
  name: string;
  pathTemplate: string;
}

/**
 * Flow Auditor設定
 */
export interface FlowAuditorConfig {
  designFlow: {
    commonCheckpoints: CheckpointConfig[];
    sectionCheckpoints: CheckpointConfig[];
  };
  implementationFlow: {
    layerDisplayNames: Record<string, string>;
  };
}

/**
 * config.jsonの型定義
 */
interface GenerateConfig {
  flowAuditor?: FlowAuditorConfig;
}

/**
 * scripts/generate/config.jsonからflow-auditor設定を読み込む
 *
 * @returns FlowAuditorConfig
 * @throws Error - config.jsonの読み込みまたはパースに失敗した場合
 */
export function loadFlowAuditorConfig(): FlowAuditorConfig {
  try {
    const configPath = path.join(process.cwd(), 'scripts', 'generate', 'config.json');
    const content = fs.readFileSync(configPath, 'utf-8');
    const config: GenerateConfig = JSON.parse(content);

    if (!config.flowAuditor) {
      throw new Error('flowAuditor configuration not found in config.json');
    }

    return config.flowAuditor;
  } catch (error) {
    console.error('Failed to load flow-auditor config:', error);
    throw error;
  }
}
