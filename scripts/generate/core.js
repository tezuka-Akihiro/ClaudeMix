import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadConfig() {
  // template-config.json と config.json の両方を試す
  const configPaths = [
    path.join(__dirname, 'template-config.json'),
    path.join(__dirname, 'config.json')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  }

  console.error('❌ 設定ファイルが見つかりません: template-config.json または config.json');
  process.exit(1);
}

function findTemplate(fileName, config) {
  for (const template of config.templates) {
    // matchPathsがある場合はパス基準で判定
    if (template.matchPaths) {
      for (const pathPattern of template.matchPaths) {
        // パターンマッチング: Windowsパス対応
        const normalizedFileName = fileName.replace(/\\/g, '/');
        const normalizedPattern = pathPattern.replace(/\\/g, '/');

        let regexPattern = normalizedPattern
          .replace(/\*\*/g, '___DOUBLE_STAR___')
          .replace(/\*/g, '[^/]*')
          .replace(/___DOUBLE_STAR___/g, '.*');

        const regex = new RegExp('^' + regexPattern + '$');
        if (regex.test(normalizedFileName)) {
          return template;
        }
      }
    }
    // 従来のmatchKeywords方式も維持（ファイル名だけで判定）
    else if (template.matchKeywords) {
      const baseFileName = path.basename(fileName);
      for (const keyword of template.matchKeywords) {
        if (baseFileName.includes(keyword)) {
          return template;
        }
      }
    }
  }
  return null;
}

function isTestTemplate(templateFile) {
  return templateFile.includes('test.template.js');
}

function generatePlaceholders(template, fileName) {
  const baseName = path.basename(fileName, path.extname(fileName));

  if (!template.placeholders) {
    return {};
  }

  const placeholders = { ...template.placeholders };

  // 動的プレースホルダーの処理
  for (const [key, value] of Object.entries(placeholders)) {
    if (typeof value === 'string' && value.startsWith('@dynamic:')) {
      const dynamicType = value.replace('@dynamic:', '');

      switch (dynamicType) {
        case 'filename':
          let transformedName = baseName;
          const transformRule = template.placeholderTransforms?.filename;

          if (transformRule) {
            // 文字列削除
            if (transformRule.remove) {
              transformRule.remove.forEach(suffix => {
                transformedName = transformedName.replace(new RegExp(suffix.replace('.', '\\.') + '$'), '');
              });
            }
            // ケース変換
            if (transformRule.case === 'PascalCase') {
              transformedName = toPascalCase(transformedName);
            }
          }
          placeholders[key] = transformedName;
          break;

        case 'component-path':
          const componentName = toPascalCase(baseName.replace('.test', ''));
          placeholders[key] = `components/${componentName}`;
          break;

        case 'utility-path':
          const utilityName = toCamelCase(baseName.replace('.test', ''));
          placeholders[key] = `utils/${utilityName}`;
          break;

        case 'slug':
          placeholders[key] = baseName.replace(/-req|-ui|-spec/g, '').toLowerCase();
          break;

        case 'date':
          placeholders[key] = new Date().toISOString().split('T')[0];
          break;

        default:
          console.warn(`Unknown dynamic type: ${dynamicType}`);
          break;
      }
    }
  }

  return placeholders;
}

function toPascalCase(str) {
  return str.replace(/(^\w|[A-Z]|\b\w)/g, (letter, index) => {
    return index === 0 ? letter.toUpperCase() : letter.toUpperCase();
  }).replace(/[\s-_]+/g, '');
}

function toCamelCase(str) {
  return str.replace(/(^\w|[A-Z]|\b\w)/g, (letter, index) => {
    return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/[\s-_]+/g, '');
}

function replacePlaceholders(content, placeholders) {
  let result = content;
  for (const [placeholder, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}

function showHelp(config) {
  console.log(`
🎯 テンプレート生成コマンド

使用方法:
  node scripts/generate.js <path>

利用可能なテンプレート:`);

  config.templates.forEach(template => {
    const isTest = isTestTemplate(template.templateFile);
    const testMarker = isTest ? ' [テスト]' : '';
    if (template.matchPaths) {
      console.log(`  - ${template.name}${testMarker}: ${template.matchPaths.join(', ')} にマッチするパス`);
    } else if (template.matchKeywords) {
      console.log(`  - ${template.name}${testMarker}: ${template.matchKeywords.join(', ')} を含むファイル名`);
    }
  });

  console.log(`
例:
  node scripts/generate.js develop/開発用実装コマンドの実装手順書.md
  node scripts/generate.js app/components/UserProfile.test.js
`);
}

function logGeneration() {
  // process.env.npm_config_argv は npm run ... 経由での実行時に設定される
  const npmConfigArgv = process.env.npm_config_argv;
  if (!npmConfigArgv) {
    // npm 経由でない直接実行の場合は何もしない
    return;
  }

  const originalArgs = JSON.parse(npmConfigArgv).original.slice(1).join(' '); // 'run' を除外
  const logEntry = `[${new Date().toISOString()}] npm run ${originalArgs}\n`;

  const logDir = path.join(__dirname, '..', '..', 'tests', 'scripts');
  const logPath = path.join(logDir, 'generation.log');

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.appendFileSync(logPath, logEntry);
}

function main() {
  const config = loadConfig();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp(config);
    process.exit(1);
  }

  const targetPath = args[0];
  const fileName = path.basename(targetPath);

  // テンプレートを検索（matchPaths用にはfullPath、matchKeywords用にはfileNameを使用）
  const template = findTemplate(targetPath, config);
  if (!template) {
    console.error('❌ 対応するテンプレートが見つかりません');
    console.log('利用可能なテンプレート:');
    config.templates.forEach(t => {
      if (t.matchPaths) {
        console.log(`  - ${t.name}: ${t.matchPaths.join(', ')} にマッチするパス`);
      } else if (t.matchKeywords) {
        console.log(`  - ${t.name}: ${t.matchKeywords.join(', ')} を含むファイル名`);
      }
    });
    process.exit(1);
  }

  const templatePath = path.join(__dirname, 'templates', template.templateFile);

  // テンプレートファイルの存在確認
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ テンプレートファイルが見つかりません: ${templatePath}`);
    process.exit(1);
  }

  // テンプレートファイルを読み込み
  let templateContent = fs.readFileSync(templatePath, 'utf8');

  // プレースホルダーを置換（テスト・ドキュメント問わず）
  const placeholders = generatePlaceholders(template, fileName);
  if (Object.keys(placeholders).length > 0) {
    const templateType = isTestTemplate(template.templateFile) ? 'テストテンプレート' : 'ドキュメントテンプレート';
    console.log(`🔧 ${templateType}のプレースホルダーを置換中...`);

    templateContent = replacePlaceholders(templateContent, placeholders);

    console.log('✅ プレースホルダーの置換完了');

    // 置換内容をログ出力
    console.log('\n📝 置換されたプレースホルダー:');
    Object.entries(placeholders).forEach(([key, value]) => {
      console.log(`  ${key} → ${value}`);
    });
    console.log('');
  }

  // 出力先ディレクトリの作成
  const outputDir = path.dirname(targetPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ファイル出力
  fs.writeFileSync(targetPath, templateContent);
  console.log(`✅ ファイルを生成しました: ${targetPath}`);
  console.log(`📋 使用したテンプレート: ${template.name}`);

  // 実行履歴を記録
  logGeneration();
}

main();