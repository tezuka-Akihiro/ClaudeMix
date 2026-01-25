#!/usr/bin/env node
/**
 * Valibot Schema Generator Script
 *
 * Usage: node scripts/generate-schema.js <service> <section>
 * Example: node scripts/generate-schema.js account authentication
 *
 * このスクリプトは以下を自動化します：
 * 1. Spec YAMLファイルの読み込み
 * 2. フォーム定義とバリデーションルールの抽出
 * 3. Valibotスキーマファイルの生成
 * 4. InferOutput型のエクスポート
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ==========================================
// 設定
// ==========================================

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const SPECS_DIR = path.join(PROJECT_ROOT, 'app/specs');
const SCHEMAS_DIR = path.join(PROJECT_ROOT, 'app/specs');
const TEMPLATE_PATH = path.join(__dirname, '../templates/schema.server.ts.template');

// ==========================================
// ユーティリティ関数
// ==========================================

/**
 * YAMLファイルを読み込む
 */
function loadYaml(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content);
}

/**
 * Spec YAMLからフォーム定義を抽出
 */
function extractForms(spec) {
  if (!spec.forms) {
    throw new Error('No forms section found in spec');
  }
  return Object.entries(spec.forms).map(([formName, formDef]) => ({
    name: formName,
    fields: formDef.fields || {},
  }));
}

/**
 * バリデーションルールからValibotスキーマコードを生成
 */
function generateFieldSchema(fieldName, fieldDef, validationSpec, sectionSpec) {
  // TODO: 実際のバリデーションルールに基づいてスキーマコードを生成
  // 現在はスタブ実装
  return `/* ${fieldName} schema - TODO: implement */`;
}

/**
 * スキーマファイルを生成
 */
function generateSchema(service, section) {
  console.log(`🔐 Generating schema for ${service}/${section}...`);

  // Step 1: Spec YAMLを読み込む
  const sectionSpecPath = path.join(SPECS_DIR, service, `${section}-spec.yaml`);
  const validationSpecPath = path.join(SPECS_DIR, 'shared', 'validation-spec.yaml');

  console.log(`📖 Reading specs:`);
  console.log(`  - ${sectionSpecPath}`);
  console.log(`  - ${validationSpecPath}`);

  const sectionSpec = loadYaml(sectionSpecPath);
  const validationSpec = loadYaml(validationSpecPath);

  // Step 2: フォーム定義を抽出
  const forms = extractForms(sectionSpec);
  console.log(`✅ Found ${forms.length} forms:`);
  forms.forEach(form => console.log(`  - ${form.name}`));

  // Step 3: スキーマコードを生成（TODO: 完全な実装）
  const schemaContent = `
/**
 * ${section} Schema Layer (Valibot)
 *
 * このファイルはスクリプトによって生成されました。
 * 手動編集は推奨されません。
 */

import * as v from 'valibot';

// TODO: 完全な実装
// 現在はスタブです。prompts/01-generate.mdを参照して手動生成してください。

${forms.map(form => `
// ${form.name} Form Schema (TODO)
export const ${capitalize(form.name)}Schema = v.object({
  // TODO: フィールド定義
});

export type ${capitalize(form.name)}FormData = v.InferOutput<typeof ${capitalize(form.name)}Schema>;
`).join('\n')}
`;

  // Step 4: 出力ディレクトリを作成
  const outputDir = path.join(SCHEMAS_DIR, service);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 5: ファイルを書き込む
  const outputPath = path.join(outputDir, `${section}-schema.server.ts`);
  fs.writeFileSync(outputPath, schemaContent.trim(), 'utf8');

  console.log(`✅ Schema generated: ${outputPath}`);
  console.log(`⚠️  Note: This is a stub. Use prompts/01-generate.md for full generation.`);

  return outputPath;
}

/**
 * 文字列の最初の文字を大文字にする
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================
// メイン処理
// ==========================================

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Usage: node generate-schema.js <service> <section>');
    console.error('   Example: node generate-schema.js account authentication');
    process.exit(1);
  }

  const [service, section] = args;

  try {
    generateSchema(service, section);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateSchema };
