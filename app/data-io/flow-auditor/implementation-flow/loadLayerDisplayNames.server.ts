// loadLayerDisplayNames.server - Data-IO Layer (data-io層)
// Load layer display names from config.json

import { loadFlowAuditorConfig } from '~/data-io/flow-auditor/common/loadFlowAuditorConfig.server';

/**
 * config.jsonから層の表示名を取得
 *
 * @returns 層の表示名マップ
 */
export function loadLayerDisplayNames(): Record<string, string> {
  try {
    const config = loadFlowAuditorConfig();
    return config.implementationFlow.layerDisplayNames;
  } catch (error) {
    console.error('Failed to load layer display names:', error);
    // フォールバック: デフォルト値を返す
    return {
      lib: 'app/lib',
      'data-io': 'app/data-io',
      ui: 'app/components',
    };
  }
}
