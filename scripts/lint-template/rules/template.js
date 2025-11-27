/**
 * テンプレート固有ルール統合ファイル
 */

import fs from 'fs';
import path from 'path';

/**
 * 作業手順書専用ルール
 */
const workflowRule = {
  name: 'workflow-structure',
  description: '作業手順書の構造と内容をチェック（7フロー対応）',
  severity: 'error',

  /**
   * 作業手順書の内容をチェック
   */
  check: function(content, filePath, config) {
    const results = [];
    const lines = content.split('\n');

    // 必須フローチェック
    const flowResults = this.checkRequiredFlows(lines, filePath, config);
    results.push(...flowResults);

    // フロー順序チェック
    const orderResults = this.checkFlowOrder(lines, filePath, config);
    results.push(...orderResults);

    // template-generate.jsコマンドチェック
    const commandResults = this.checkRequiredCommands(lines, filePath, config);
    results.push(...commandResults);

    // ファイルパス構造チェック
    const pathResults = this.checkFilePaths(content, filePath, config);
    results.push(...pathResults);

    // TDD順序の特別チェック
    const tddResults = this.checkTDDOrder(lines, filePath, config);
    results.push(...tddResults);

    return results;
  },

  /**
   * 必須フローの存在をチェック
   */
  checkRequiredFlows: function(lines, filePath, config) {
    const results = [];
    const requiredFlows = config.requiredFlows || [ // Outside-In TDD + 段階的E2Eテスト戦略に更新
      'Phase 1: E2Eファースト',
      'Phase 2: CSS実装',
      'Phase 3: 層別TDD',
      'Phase 4: E2E拡張と統合確認'
    ];

    // 見つかったフローを記録
    const foundFlows = [];
    for (const line of lines) {
      for (const flow of requiredFlows) {
        if (line.includes(flow) && line.includes('###')) {
          foundFlows.push(flow);
          break; // 同じ行で複数フローがマッチするのを避ける
        }
      }
    }

    // 必須フローの存在確認
    for (const requiredFlow of requiredFlows) {
      if (!foundFlows.includes(requiredFlow)) {
        results.push({
          message: `必須フロー「${requiredFlow}」が見つかりません`,
          line: 1,
          column: 1,
          severity: config.severity || this.severity,
          context: 'フロー定義の確認が必要',
          suggestion: `### ${requiredFlow} を追加してください`,
          type: 'missing-flow',
          flow: requiredFlow
        });
      }
    }

    // 重複フローチェック
    const flowCounts = {};
    foundFlows.forEach(flow => {
      flowCounts[flow] = (flowCounts[flow] || 0) + 1;
    });

    Object.entries(flowCounts).forEach(([flow, count]) => {
      if (count > 1) {
        results.push({
          message: `フロー「${flow}」が${count}回定義されています`,
          line: 1,
          column: 1,
          severity: 'warning',
          context: '重複フローの確認が必要',
          suggestion: `重複した「${flow}」を削除してください`,
          type: 'duplicate-flow',
          flow: flow
        });
      }
    });

    return results;
  },

  /**
   * フローの順序をチェック
   */
  checkFlowOrder: function(lines, filePath, config) {
    const results = [];
    const flowOrder = config.flowOrder || { // Outside-In TDD + 段階的E2Eテスト戦略の順序に更新
      'Phase 1: E2Eファースト': 1,
      'Phase 2: CSS実装': 2,
      'Phase 3: 層別TDD': 3,
      'Phase 4: E2E拡張と統合確認': 4
    };

    const flowPositions = {};

    // 各フローの位置を記録
    for (let i = 0; i < lines.length; i++) {
      for (const flow of Object.keys(flowOrder)) {
        if (lines[i].includes(flow) && lines[i].includes('###')) {
          flowPositions[flow] = i + 1; // 行番号は1から開始
          break;
        }
      }
    }

    // 順序チェック
    const foundFlows = Object.keys(flowPositions).sort((a, b) => flowPositions[a] - flowPositions[b]);

    for (let i = 0; i < foundFlows.length - 1; i++) {
      const currentFlow = foundFlows[i];
      const nextFlow = foundFlows[i + 1];

      if (flowOrder[currentFlow] > flowOrder[nextFlow]) {
        results.push({
          message: `フローの順序が正しくありません：「${currentFlow}」は「${nextFlow}」より前に配置してください`,
          line: flowPositions[currentFlow],
          column: 1,
          severity: config.severity || this.severity,
          context: `期待順序: ${flowOrder[currentFlow]} → ${flowOrder[nextFlow]}`,
          suggestion: `フローを正しい開発順序で並び替えてください`,
          type: 'wrong-order',
          currentFlow,
          nextFlow
        });
      }
    }

    return results;
  },

  /**
   * TDD順序の特別チェック (Outside-In TDD)
   */
  checkTDDOrder: function(lines, filePath, config) {
    const results = [];
    const flowPositions = {};

    // 各Phaseの位置を記録
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Phase 1: E2Eファースト') && lines[i].includes('###')) {
        flowPositions['Phase 1: E2Eファースト'] = i + 1;
      }
      if (lines[i].includes('Phase 2: CSS実装') && lines[i].includes('###')) {
        flowPositions['Phase 2: CSS実装'] = i + 1;
      }
      if (lines[i].includes('Phase 3: 層別TDD') && lines[i].includes('###')) {
        flowPositions['Phase 3: 層別TDD'] = i + 1;
      }
      if (lines[i].includes('Phase 4: E2E拡張と統合確認') && lines[i].includes('###')) {
        flowPositions['Phase 4: E2E拡張と統合確認'] = i + 1;
      }
    }

    // Outside-In TDD順序チェック（E2Eファーストが最初に来るべき）
    if (flowPositions['Phase 1: E2Eファースト'] && flowPositions['Phase 3: 層別TDD'] &&
        flowPositions['Phase 1: E2Eファースト'] > flowPositions['Phase 3: 層別TDD']) {
      results.push({
        message: 'Outside-In TDDの順序が正しくありません：「Phase 1: E2Eファースト」は「Phase 3: 層別TDD」より前に配置してください',
        line: flowPositions['Phase 1: E2Eファースト'],
        column: 1,
        severity: 'error',
        context: 'Outside-In TDD (受け入れテスト駆動開発) の原則違反',
        suggestion: '「Phase 1: E2Eファースト」を「Phase 3: 層別TDD」より前に移動してください',
        type: 'outside-in-tdd-order-violation'
      });
    }

    // CSS実装がE2Eファーストより後に来るべき
    if (flowPositions['Phase 1: E2Eファースト'] && flowPositions['Phase 2: CSS実装'] &&
        flowPositions['Phase 2: CSS実装'] < flowPositions['Phase 1: E2Eファースト']) {
      results.push({
        message: 'CSS実装の順序が正しくありません：「Phase 2: CSS実装」は「Phase 1: E2Eファースト」より後に配置してください',
        line: flowPositions['Phase 2: CSS実装'],
        column: 1,
        severity: 'error',
        context: 'CSS実装はE2Eテストの失敗を確認した後に行うべき',
        suggestion: '「Phase 2: CSS実装」を「Phase 1: E2Eファースト」より後に移動してください',
        type: 'css-order-violation'
      });
    }

    // E2E拡張が層別TDDより後に来るべき
    if (flowPositions['Phase 3: 層別TDD'] && flowPositions['Phase 4: E2E拡張と統合確認'] &&
        flowPositions['Phase 4: E2E拡張と統合確認'] < flowPositions['Phase 3: 層別TDD']) {
      results.push({
        message: 'E2E拡張の順序が正しくありません：「Phase 4: E2E拡張と統合確認」は「Phase 3: 層別TDD」より後に配置してください',
        line: flowPositions['Phase 4: E2E拡張と統合確認'],
        column: 1,
        severity: 'error',
        context: 'E2E拡張は層別TDD実装完了後に行うべき',
        suggestion: '「Phase 4: E2E拡張と統合確認」を「Phase 3: 層別TDD」より後に移動してください',
        type: 'e2e-expansion-order-violation'
      });
    }

    return results;
  },

  /**
   * 必須コマンドの存在をチェック
   */
  checkRequiredCommands: function(lines, filePath, config) {
    const results = [];
    const requiredCommands = config.requiredCommands || ['template-generate.js'];

    for (const command of requiredCommands) {
      let commandFound = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(command)) {
          commandFound = true;

          // コマンドの形式チェック
          const commandPattern = new RegExp(`node\\s+scripts/${command}\\s+[^\\s]+`);
          if (!commandPattern.test(lines[i])) {
            results.push({
              message: `${command}コマンドの形式が正しくない可能性があります`,
              line: i + 1,
              column: lines[i].indexOf(command) + 1,
              severity: 'warning',
              context: lines[i].trim(),
              suggestion: `形式: node scripts/${command} [ファイルパス]`,
              type: 'command-format'
            });
          }
          break;
        }
      }

      if (!commandFound) {
        results.push({
          message: `必須コマンド「${command}」が見つかりません`,
          line: 1,
          column: 1,
          severity: config.severity || this.severity,
          context: 'テンプレート生成コマンドが必要',
          suggestion: `node scripts/${command} [適切なファイルパス] を追加してください`,
          type: 'missing-command',
          command
        });
      }
    }

    return results;
  },

  /**
   * ファイルパス構造をチェック
   */
  checkFilePaths: function(content, filePath, config) {
    const results = [];
    const pathPattern = /template-generate\.js\s+([^\s]+)/g;
    let match;

    while ((match = pathPattern.exec(content)) !== null) {
      const targetPath = match[1];

      // パスの妥当性チェック
      const pathIssues = this.validatePath(targetPath, filePath);
      results.push(...pathIssues);
    }

    return results;
  },

  /**
   * パスの妥当性をチェック
   */
  validatePath: function(targetPath, filePath) {
    const results = [];

    // 相対パスの検証
    if (targetPath.startsWith('./') || targetPath.startsWith('../')) {
      results.push({
        message: `相対パス「${targetPath}」の使用は推奨されません`,
        line: 1,
        column: 1,
        severity: 'warning',
        context: targetPath,
        suggestion: 'プロジェクトルートからの絶対パスを使用してください',
        type: 'relative-path'
      });
    }

    // ファイル名の検証
    const fileName = path.basename(targetPath);
    const fileExt = path.extname(fileName);

    if (!fileExt) {
      results.push({
        message: `ファイル「${fileName}」に拡張子がありません`,
        line: 1,
        column: 1,
        severity: 'warning',
        context: targetPath,
        suggestion: '適切な拡張子を追加してください（.md, .ts, .tsx など）',
        type: 'missing-extension'
      });
    }

    // 命名規則チェック
    if (fileName.includes(' ')) {
      results.push({
        message: `ファイル名「${fileName}」にスペースが含まれています`,
        line: 1,
        column: 1,
        severity: 'warning',
        context: targetPath,
        suggestion: 'ケバブケース（kebab-case）またはキャメルケースを使用してください',
        type: 'naming-convention'
      });
    }

    return results;
  }
};

/**
 * 機能設計書専用ルール
 */
const requirementsRule = {
  name: 'requirement-completeness',
  description: '機能設計書の完全性と品質をチェック',
  severity: 'error',

  check: function(content, filePath, config) {
    const results = [];
    const lines = content.split('\n');

    // 必須セクションチェック
    const requiredSections = config.requiredSections || [
      '概要',
      '機能要件',
      '非機能要件',
      '制約事項',
      '受入基準'
    ];

    requiredSections.forEach(section => {
      const sectionFound = lines.some(line =>
        line.includes(section) && (line.includes('#') || line.includes('##'))
      );

      if (!sectionFound) {
        results.push({
          message: `必須セクション「${section}」が見つかりません`,
          line: 1,
          column: 1,
          severity: config.severity || this.severity,
          context: 'セクション定義の確認が必要',
          suggestion: `## ${section} セクションを追加してください`,
          type: 'missing-section',
          section
        });
      }
    });

    return results;
  }
};

/**
 * YAML構造ルール
 */
const yamlStructureRule = {
  name: 'yaml-structure',
  description: 'YAML仕様書の構造をチェック',
  severity: 'error',

  check: function(content, filePath, config) {
    const results = [];

    try {
      // YAML形式の基本チェック
      const lines = content.split('\n');
      let inYamlBlock = false;

      lines.forEach((line, index) => {
        if (line.trim().startsWith('~~~yaml') || line.trim().startsWith('~~~yml')) {
          inYamlBlock = true;
        } else if (line.trim().startsWith('~~~') && inYamlBlock) {
          inYamlBlock = false;
        }

        // YAML構文の基本チェック
        if (inYamlBlock && line.trim() && !line.startsWith('#')) {
          if (!line.includes(':') && !line.startsWith('-')) {
            results.push({
              message: 'YAML形式が正しくない可能性があります',
              line: index + 1,
              column: 1,
              severity: config.severity || this.severity,
              context: line.trim(),
              suggestion: 'YAML形式（key: value）を確認してください',
              type: 'yaml-format'
            });
          }
        }
      });

      // 必須フィールドチェック
      const requiredFields = config.requiredFields || ['version', 'variables', 'metadata'];
      requiredFields.forEach(field => {
        if (!content.includes(`${field}:`)) {
          results.push({
            message: `必須フィールド「${field}」が見つかりません`,
            line: 1,
            column: 1,
            severity: config.severity || this.severity,
            context: 'YAML構造の確認が必要',
            suggestion: `${field}: セクションを追加してください`,
            type: 'missing-field',
            field
          });
        }
      });

    } catch (error) {
      results.push({
        message: `YAML解析エラー: ${error.message}`,
        line: 1,
        column: 1,
        severity: 'error',
        context: 'YAML形式の確認が必要',
        suggestion: 'YAML形式を修正してください',
        type: 'parse-error'
      });
    }

    return results;
  }
};

const templateRules = {
  'workflow-structure': workflowRule,
  'requirement-completeness': requirementsRule,
  'yaml-structure': yamlStructureRule
};

export function getTemplateRules() {
  return templateRules;
}