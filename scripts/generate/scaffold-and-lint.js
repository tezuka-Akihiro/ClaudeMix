// 引数ベースジェネレーター
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

// テスト用のパス書き換え可能変数
let projectConfigPath = path.join(process.cwd(), 'app', 'specs', 'shared', 'project-spec.yaml');
let templateConfigPath = path.join(process.cwd(), 'scripts', 'generate', 'config.json');

// テストからのみ使用されるヘルパー関数
export function __setProjectConfigPath(newPath) {
  const oldPath = projectConfigPath;
  projectConfigPath = newPath;
  return oldPath;
}
export function __setTemplateConfigPath(newPath) {
  const oldPath = templateConfigPath;
  templateConfigPath = newPath;
  return oldPath;
}

/**
 * プロジェクト設定ファイル (app/specs/shared/project-spec.yaml) を読み込む
 * @returns {Object} プロジェクト設定オブジェクト
 */
function loadProjectConfig() {
  try {
    const content = fs.readFileSync(projectConfigPath, 'utf8');
    const parsed = yaml.load(content);

    // YAML構造をTOML互換形式に変換（既存コードとの互換性維持）
    return {
      project_name: parsed.project?.name || '',
      service_name: parsed.project?.service_name || '',
      concept: parsed.project?.concept || '',
      target: parsed.project?.target || '',
      value_proposition: parsed.project?.value_proposition || '',
      references: parsed.references || {},
      services: parsed.services || {}
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('プロジェクト設定ファイル (app/specs/shared/project-spec.yaml) が見つかりません');
    }
    throw error;
  }
}

/**
 * テンプレート設定ファイル (scripts/generate/config.json) を読み込む
 * @returns {Object} テンプレート設定オブジェクト
 */
function loadTemplateConfig() {
  try {
    const content = fs.readFileSync(templateConfigPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('テンプレート設定ファイル (scripts/generate/config.json) が見つかりません');
    }
    throw error;
  }
}

/**
 * プレースホルダーを実際の値に置換する
 * @param {string} pattern - プレースホルダーを含むパターン文字列
 * @param {Object} replacements - 置換する値のオブジェクト
 * @returns {string} 置換後の文字列
 */
function replacePlaceholders(pattern, replacements) {
  let result = pattern;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * ドキュメントカテゴリのファイルパスを構築する
 * @param {Object} answers - ユーザーの回答オブジェクト
 * @param {Object} templateConfig - テンプレート設定オブジェクト
 * @returns {Array} ファイル情報の配列
 */
function buildDocumentPaths(answers, templateConfig) {
  const { documentType, service, section, name } = answers;
  const docConfig = templateConfig.documents[documentType];

  if (!docConfig) {
    throw new Error(`ドキュメントタイプ "${documentType}" の設定が見つかりません`);
  }

  const replacements = {
    service: service || '',
    section: section || '',
    name: name || ''
  };

  return [{
    outputPath: replacePlaceholders(docConfig.pathPattern, replacements),
    templateFile: docConfig.templateFile
  }];
}

/**
 * ユーザー回答とテンプレート設定に基づき、生成すべきファイルパスを構築する
 * @param {Object} answers - ユーザーの回答オブジェクト
 * @param {Object} templateConfig - テンプレート設定オブジェクト
 * @returns {Array} ファイル情報の配列 [{outputPath, templateFile}, ...]
 */
function buildFilePaths(answers, templateConfig) {
  const { category } = answers;
  let layerKey = category;

  // documentsカテゴリとlayersカテゴリの処理を分ける
  if (category === 'documents') {
    return buildDocumentPaths(answers, templateConfig);
  } else if (category === 'ui') {
    layerKey = answers.uiType; // 'route' or 'component'
  }

  const layerConfig = templateConfig.layers[layerKey];
  if (!layerConfig) {
    throw new Error(`層 "${category}" の設定が見つかりません`);
  }

  // 置換用オブジェクトを構築
  const replacements = {
    service: answers.service || '',
    section: answers.section || '',
    name: answers.name || ''
  };

  const result = [];

  // 実装ファイル
  result.push({
    outputPath: replacePlaceholders(layerConfig.pathPattern, replacements),
    templateFile: layerConfig.templateFile
  });

  // テストファイル
  if (layerConfig.test) {
    result.push({
      outputPath: replacePlaceholders(layerConfig.test.pathPattern, replacements),
      templateFile: layerConfig.test.templateFile
    });
  }

  return result;
}

/**
 * テンプレートファイルを読み込んで実際のファイルを生成する
 * @param {Array} filePaths - 生成するファイル情報の配列
 * @param {Object} answers - ユーザーの回答（プレースホルダー置換用）
 * @returns {Promise<void>}
 */
async function generateFiles(filePaths, answers) {
  const templatesDir = path.join(process.cwd(), 'scripts', 'generate', 'templates');

  for (const fileInfo of filePaths) {
    console.log(`Generating: ${fileInfo.outputPath}`);

    try {
      // テンプレートファイルを読み込む
      const templatePath = path.join(templatesDir, fileInfo.templateFile);
      if (!fs.existsSync(templatePath)) {
        throw new Error(`テンプレートファイルが見つかりません: ${fileInfo.templateFile}`);
      }

      let content = fs.readFileSync(templatePath, 'utf8');

      // プレースホルダーを置換
      const replacements = {
        service: answers.service || '',
        section: answers.section || '',
        name: answers.name || '',
        SERVICE: (answers.service || '').toUpperCase(),
        SECTION: (answers.section || '').toUpperCase(),
        NAME: (answers.name || '').toUpperCase(),
      };

      for (const [key, value] of Object.entries(replacements)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      // 出力ディレクトリを作成
      const outputDir = path.dirname(fileInfo.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // ファイルを書き込む
      fs.writeFileSync(fileInfo.outputPath, content, 'utf8');

    } catch (error) {
      console.error(`Error generating ${fileInfo.outputPath}:`, error.message);
      throw error;
    }
  }
}

/**
 * コマンドライン引数を解析する
 * @returns {Object} 引数オブジェクト
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);

  const parsedArgs = {
    category: null,
    documentType: null,
    uiType: null,
    service: null,
    section: null,
    name: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--type':
      case '--category':
        parsedArgs.category = nextArg;
        i++;
        break;
      case '--document-type':
        parsedArgs.documentType = nextArg;
        i++;
        break;
      case '--ui-type':
        parsedArgs.uiType = nextArg;
        i++;
        break;
      case '--service':
        parsedArgs.service = nextArg;
        i++;
        break;
      case '--section':
        parsedArgs.section = nextArg;
        i++;
        break;
      case '--name':
        parsedArgs.name = nextArg;
        i++;
        break;
    }
  }

  return parsedArgs;
}

/**
 * 引数を検証する
 * @param {Object} args - 解析された引数
 * @param {Object} projectConfig - プロジェクト設定
 * @returns {void}
 * @throws {Error} 検証エラー時
 */
function validateArgs(args, projectConfig) {
  const errors = [];

  // categoryは必須
  if (!args.category) {
    errors.push('--type または --category は必須です');
  } else if (!['documents', 'ui', 'lib', 'data-io'].includes(args.category)) {
    errors.push(`無効なカテゴリ: ${args.category} (有効な値: documents, ui, lib, data-io)`);
  }

  // documentsカテゴリの場合はdocumentTypeが必須
  if (args.category === 'documents' && !args.documentType) {
    errors.push('documentsカテゴリの場合、--document-type は必須です');
  }

  // uiカテゴリの場合はuiTypeが必須
  if (args.category === 'ui' && !args.uiType) {
    errors.push('uiカテゴリの場合、--ui-type は必須です (有効な値: route, component)');
  }

  // serviceの検証
  if (args.service && projectConfig.services && !projectConfig.services[args.service]) {
    const availableServices = Object.keys(projectConfig.services);
    errors.push(`無効なサービス: ${args.service} (利用可能: ${availableServices.join(', ')})`);
  }

  // sectionの検証
  if (args.section && args.service && projectConfig.services) {
    const serviceConfig = projectConfig.services[args.service];
    if (serviceConfig?.sections && !serviceConfig.sections[args.section]) {
      const availableSections = Object.keys(serviceConfig.sections);
      errors.push(`無効なセクション: ${args.section} (利用可能: ${availableSections.join(', ')})`);
    }
  }

  // nameの検証（E2Eテストおよびroute以外で必要）
  if (args.category !== 'documents' && args.uiType !== 'route' && !args.name) {
    errors.push('--name は必須です（E2Eテストおよびroute以外）');
  }

  if (errors.length > 0) {
    throw new Error('引数エラー:\n  - ' + errors.join('\n  - '));
  }
}

/**
 * メイン関数: 引数ベースジェネレーターの全体フローを制御
 * @returns {Promise<void>}
 */
async function main() {
  try {
    console.log('🚀 ファイルジェネレーターを開始します...\n');

    // 1. 設定ファイル読み込み
    const projectConfig = loadProjectConfig();
    const templateConfig = loadTemplateConfig();

    // 2. コマンドライン引数の解析
    const args = parseCommandLineArgs();

    // 3. 引数を検証
    validateArgs(args, projectConfig);

    console.log('入力パラメータ:');
    console.log(`  カテゴリ: ${args.category}`);
    if (args.documentType) console.log(`  ドキュメントタイプ: ${args.documentType}`);
    if (args.uiType) console.log(`  UIタイプ: ${args.uiType}`);
    if (args.service) console.log(`  サービス: ${args.service}`);
    if (args.section) console.log(`  セクション: ${args.section}`);
    if (args.name) console.log(`  名前: ${args.name}`);
    console.log();

    // 4. ファイルパス構築
    const filePaths = buildFilePaths(args, templateConfig);

    // 5. 確認表示
    console.log('以下のファイルを作成します:');
    filePaths.forEach(file => console.log(`  - ${file.outputPath}`));
    console.log();

    // 6. ファイル生成
    await generateFiles(filePaths, args);

    console.log('✅ ファイル生成が完了しました！');
    filePaths.forEach(file => console.log(`  ✓ ${file.outputPath}`));

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

export {
  loadProjectConfig,
  loadTemplateConfig,
  buildFilePaths,
  generateFiles,
  main,
};

// CLI実行時のエントリーポイント
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main().catch(console.error);
}