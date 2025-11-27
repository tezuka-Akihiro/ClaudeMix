import fs from 'fs';
import path from 'path';

/**
 * 行がコメント行かどうかを判定する
 * @param {string} line - トリム済みの行
 * @returns {boolean} コメント行の場合true
 */
function isCommentLine(line) {
  return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
}

/**
 * !importantをチェックする共通関数
 * @param {string} content - ファイルコンテンツ
 * @returns {Array} 違反情報の配列
 */
function checkNoImportant(content) {
  const violations = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (line.includes('!important')) {
      violations.push({
        line: index + 1,
        message: '!important が使用されています。',
        suggestion: 'CSSの詳細度を適切に設計することで、!importantの使用を避けてください。'
      });
    }
  });

  return violations;
}

/**
 * Layer 3 のルールを返します
 * @returns {object} ルールオブジェクト
 */
export function getLayer3Rules() {
  return {
    'layer3-no-skin': {
      name: 'layer3-no-skin',
      description: 'Layer 3でスキンプロパティの使用を禁止します。',
      check: (content, _filePath, config) => {
        const violations = [];
        const lines = content.split('\n');

        // keyword.jsonのlayer3配列から取得
        // !importantは別ルールで処理するため除外
        const skinProperties = config.filter(keyword => keyword !== '!important');

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // コメント行はスキップ
          if (isCommentLine(trimmedLine)) {
            return;
          }

          // オブジェクトプロパティをチェック
          skinProperties.forEach(prohibited => {
            // kebab-caseに変換して比較
            const kebabProhibited = prohibited.replace(/([A-Z])/g, '-$1').toLowerCase();

            // TypeScriptのプロパティ形式: property: "value"
            const tsPropertyPattern = new RegExp(`\\b${prohibited}\\s*:\\s*['"\`]`, 'i');
            const kebabPropertyPattern = new RegExp(`['"\`]${kebabProhibited}['"\`]\\s*:\\s*['"\`]`, 'i');

            if (tsPropertyPattern.test(line) || kebabPropertyPattern.test(line)) {
              violations.push({
                line: index + 1,
                message: `スキンプロパティ "${prohibited}" が使用されています。`,
                suggestion: 'スキン（見た目）の定義は Layer 2 のCSSファイルで行ってください。'
              });
            }
          });
        });

        return violations;
      }
    },

    'layer3-no-important': {
      name: 'layer3-no-important',
      description: 'Layer 3で!importantの使用を禁止します。',
      check: (content) => checkNoImportant(content)
    },

    'layer3-no-direct-layer1-ref': {
      name: 'layer3-no-direct-layer1-ref',
      description: 'Layer 3からLayer 1トークンの直接参照を禁止します。ただし、gap/row-gap/column-gapのみ--spacing-*の直接参照を許可します。',
      check: (content) => {
        const violations = [];
        const lines = content.split('\n');

        // Layer 1のカテゴリパターン（globals.cssで定義される汎用トークン）
        const layer1Categories = ['color', 'spacing', 'font', 'layout', 'line-height', 'letter-spacing',
                                   'border', 'shadow', 'stroke', 'offset', 'transition', 'opacity', 'position'];

        lines.forEach((line, index) => {
          // Layer 1トークンの直接参照を検出
          layer1Categories.forEach(category => {
            const layer1RefPattern = new RegExp(`var\\(--${category}-`, 'g');
            if (layer1RefPattern.test(line)) {
              // gap例外: gap/rowGap/columnGap が --spacing-* を参照するのは許可
              if (category === 'spacing') {
                // TypeScript形式: gap: 'var(--spacing-*)' または rowGap: 'var(--spacing-*)' など
                // kebab形式: 'gap': 'var(--spacing-*)' または 'row-gap': 'var(--spacing-*)' など
                const gapPattern = /(?:gap|rowGap|columnGap|row-gap|column-gap)\s*:\s*['"]var\(--spacing-/;
                if (gapPattern.test(line)) {
                  return; // この違反はスキップ
                }
              }

              violations.push({
                line: index + 1,
                message: `Layer 3からLayer 1の--${category}-*トークンを直接参照しています。`,
                suggestion: 'Layer 2で定義されたコンポーネント固有の変数を参照してください。'
              });
            }
          });
        });
        return violations;
      }
    },

    'layer3-undefined-class-reference': {
      name: 'layer3-undefined-class-reference',
      description: 'Layer 3で未定義のクラスへの@apply参照をチェックします。',
      check: (content, filePath) => {
        const violations = [];

        // Layer 2のファイルパスを推測
        const layer3Dir = path.dirname(filePath);
        const layer2Path = path.join(layer3Dir, 'layer2.css');

        // Layer 2のファイルが存在しない場合はチェックをスキップ
        if (!fs.existsSync(layer2Path)) {
          return violations;
        }

        // Layer 2のコンテンツを読み込み
        const layer2Content = fs.readFileSync(layer2Path, 'utf8');

        // 定義されたクラスを収集
        const definedClasses = new Set();

        // Layer 2で定義されたクラスを収集
        const layer2ClassPattern = /^\s*\.([\w-]+)(?:\s*[,:{\s])/gm;
        let match;
        while ((match = layer2ClassPattern.exec(layer2Content)) !== null) {
          definedClasses.add(match[1]);
        }

        // Layer 3で定義されたクラスを収集
        const layer3ClassPattern = /'\.([\w-]+)':\s*{/g;
        while ((match = layer3ClassPattern.exec(content)) !== null) {
          definedClasses.add(match[1]);
        }

        // @apply参照をチェック
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // '@apply class-name': {} または "@apply class-name": {} を検出
          const applyPattern = /['"]@apply\s+([\w-]+)['"]\s*:\s*{/g;
          let applyMatch;

          while ((applyMatch = applyPattern.exec(line)) !== null) {
            const referencedClass = applyMatch[1];

            // 定義されているクラスのセットに含まれていない場合
            if (!definedClasses.has(referencedClass)) {
              violations.push({
                line: index + 1,
                message: `未定義のクラス "${referencedClass}" が @apply で参照されています。`,
                suggestion: `"${referencedClass}" をLayer 2またはLayer 3で定義するか、@applyを削除してプロパティを直接記述してください。`
              });
            }
          }
        });

        return violations;
      }
    },

    'layer3-no-apply': {
      name: 'layer3-no-apply',
      description: 'Layer 3で@applyの使用を禁止します。',
      check: (content) => {
        const violations = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // コメント行はスキップ
          if (isCommentLine(trimmedLine)) {
            return;
          }

          // '@apply class-name': {} または "@apply class-name": {} を検出
          if (trimmedLine.includes("'@apply") || trimmedLine.includes('"@apply')) {
            violations.push({
              line: index + 1,
              message: 'Layer 3で@applyを使用してはいけません。',
              suggestion: 'プロパティを直接記述してください。'
            });
          }
        });

        return violations;
      }
    },

    'layer3-no-margin': {
      name: 'layer3-no-margin',
      description: 'Layer 3でmarginプロパティの使用を禁止します（gap統一の原則）。scroll-margin系は例外として許可します。',
      check: (content) => {
        const violations = [];
        const lines = content.split('\n');

        const marginProperties = ['margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'];

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // コメント行はスキップ
          if (isCommentLine(trimmedLine)) {
            return;
          }

          // scroll-margin系は例外として許可
          if (trimmedLine.includes('scrollMargin')) {
            return;
          }

          marginProperties.forEach(prop => {
            // TypeScript形式: margin: 'value' または marginTop: 'value'
            const tsPattern = new RegExp(`\\b${prop}\\s*:\\s*['"\`]`, 'i');
            // kebab形式: 'margin': 'value' または 'margin-top': 'value'
            const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            const kebabPattern = new RegExp(`['"\`]${kebabProp}['"\`]\\s*:\\s*['"\`]`, 'i');

            if (tsPattern.test(line) || kebabPattern.test(line)) {
              violations.push({
                line: index + 1,
                message: `marginプロパティ "${prop}" が使用されています。`,
                suggestion: 'Layer 3では間隔の定義にmarginを使用せず、gapで統一してください。'
              });
            }
          });
        });

        return violations;
      }
    },

    'layer3-allowed-properties-only': {
      name: 'layer3-allowed-properties-only',
      description: 'Layer 3で許可されたプロパティのみの使用を強制します（Flexbox & Grid Layout層）。',
      check: (content) => {
        const violations = [];
        const lines = content.split('\n');

        // Layer 3 (Flexbox & Grid Layout) で許可されるプロパティ
        const allowedProperties = [
          // Flexbox & Grid Layout
          'display', 'flex', 'flexDirection', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis', 'flexFlow',
          'justifyContent', 'alignItems', 'alignContent', 'alignSelf',
          'gap', 'rowGap', 'columnGap',
          'grid', 'gridTemplate', 'gridTemplateColumns', 'gridTemplateRows', 'gridTemplateAreas',
          'gridAutoFlow', 'gridAutoColumns', 'gridAutoRows',
          'gridColumn', 'gridRow', 'gridArea',
          'gridColumnStart', 'gridColumnEnd', 'gridRowStart', 'gridRowEnd',
          'justifyItems', 'justifySelf',
        ];

        // kebab-case版の許可リストも生成
        const allowedKebabProperties = allowedProperties.map(prop =>
          prop.replace(/([A-Z])/g, '-$1').toLowerCase()
        );

        let inClassDefinition = false;
        let currentIndent = 0;

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // コメント行はスキップ
          if (isCommentLine(trimmedLine)) {
            return;
          }

          // クラス定義の開始を検出: '.class-name': { または "class-name": {
          if (/['"]\.[\w-]+['"]\s*:\s*\{/.test(trimmedLine)) {
            inClassDefinition = true;
            currentIndent = line.search(/\S/);
            return;
          }

          // スプレッド構文はスキップ: ...reusableComponentStyles['flex-row-center']
          if (trimmedLine.startsWith('...')) {
            return;
          }

          // プロパティ定義を検出: property: 'value' または property: "value"
          if (inClassDefinition) {
            const propertyMatch = trimmedLine.match(/^(\w+)\s*:\s*['"\{]/);
            if (propertyMatch) {
              const property = propertyMatch[1];

              // camelCaseとkebab-caseの両方をチェック
              const isAllowed = allowedProperties.includes(property) ||
                                allowedKebabProperties.includes(property);

              if (!isAllowed) {
                violations.push({
                  line: index + 1,
                  message: `許可されていないプロパティ "${property}" が使用されています。`,
                  suggestion: 'Layer 3では、Flexbox/Gridレイアウト関連のプロパティのみ使用可能です。他のプロパティはLayer 2で定義してください。'
                });
              }
            }

            // クラス定義の終了を検出
            const lineIndent = line.search(/\S/);
            if (trimmedLine === '}' && lineIndent <= currentIndent) {
              inClassDefinition = false;
            }
          }
        });

        return violations;
      }
    }
  };
}
