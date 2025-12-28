import fs from 'fs';
import path from 'path';

/**
 * 行がコメント行かどうかを判定する
 * @param {string} line - トリム済みの行
 * @returns {boolean} コメント行の場合true
 */
function isCommentLine(line) {
  return line.startsWith('//') ||
         line.startsWith('/*') ||
         line.startsWith('*') ||
         line.startsWith('@') ||
         line === '}';
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
 * Layer 2 のルールを返します
 * @returns {object} ルールオブジェクト
 */
export function getLayer2Rules() {
  return {
    'layer2-no-layout': {
      name: 'layer2-no-layout',
      description: 'Layer 2でflex/grid関係のプロパティの使用を禁止します。',
      check: (content, _filePath, config) => {
        const violations = [];
        const lines = content.split('\n');

        // keyword.jsonのlayer2配列から取得
        // !importantは別ルールで処理するため除外
        const layoutProperties = config.filter(keyword => keyword !== '!important');

        let inRoot = false;

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // :rootブロックの開始・終了を追跡
          if (trimmedLine.startsWith(':root')) {
            inRoot = true;
            return;
          }
          if (inRoot && trimmedLine.includes('}')) {
            inRoot = false;
            return;
          }

          // :root内またはコメント行はスキップ
          if (inRoot || isCommentLine(trimmedLine)) {
            return;
          }

          // CSSプロパティの検出: "property: value;"
          const propertyMatch = trimmedLine.match(/^([a-zA-Z-]+)\s*:\s*(.+?)\s*;?\s*$/);
          if (propertyMatch) {
            const property = propertyMatch[1];
            const value = propertyMatch[2];

            // displayプロパティの特別処理: flex と grid のみ禁止
            if (property.toLowerCase() === 'display') {
              const displayValue = value.trim().toLowerCase();
              if (displayValue === 'flex' || displayValue === 'grid') {
                violations.push({
                  line: index + 1,
                  message: `flex/grid 関係のプロパティ "display: ${displayValue}" が使用されています。`,
                  suggestion: 'flex/grid の定義は Layer 3 のTSファイルで行ってください。'
                });
              }
              return;
            }

            // 他のflex/grid関係のプロパティをチェック（displayを除く）
            const isProhibited = layoutProperties.some(prohibited => {
              const kebabProhibited = prohibited.replace(/([A-Z])/g, '-$1').toLowerCase();
              return property.toLowerCase() === kebabProhibited && prohibited.toLowerCase() !== 'display';
            });

            if (isProhibited) {
              violations.push({
                line: index + 1,
                message: `flex/grid 関係のプロパティ "${property}" が使用されています。`,
                suggestion: 'flex/grid の定義は Layer 3 のTSファイルで行ってください。'
              });
            }
          }
        });

        return violations;
      }
    },

    'layer2-no-important': {
      name: 'layer2-no-important',
      description: 'Layer 2で!importantの使用を禁止します。',
      check: (content) => checkNoImportant(content)
    },

    'layer2-undefined-class-reference': {
      name: 'layer2-undefined-class-reference',
      description: 'Layer 2で未定義のクラスへの@apply参照をチェックします。',
      check: (content, filePath) => {
        const violations = [];

        // Layer 3のファイルパスを推測
        const layer2Dir = path.dirname(filePath);
        const layer3Path = path.join(layer2Dir, 'layer3.ts');

        // Layer 3のファイルが存在しない場合はチェックをスキップ
        if (!fs.existsSync(layer3Path)) {
          return violations;
        }

        // Layer 3のコンテンツを読み込み
        const layer3Content = fs.readFileSync(layer3Path, 'utf8');

        // 定義されたクラスを収集
        const definedClasses = new Set();

        // Layer 2で定義されたクラスを収集
        const layer2ClassPattern = /^\s*\.([\w-]+)(?:\s*[,:{\s])/gm;
        let match;
        while ((match = layer2ClassPattern.exec(content)) !== null) {
          definedClasses.add(match[1]);
        }

        // Layer 3で定義されたクラスを収集
        const layer3ClassPattern = /'\.([\w-]+)':\s*{/g;
        while ((match = layer3ClassPattern.exec(layer3Content)) !== null) {
          definedClasses.add(match[1]);
        }

        // @apply参照をチェック
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // @apply class-name; または @apply class-name を検出
          const applyPattern = /@apply\s+([\w-]+)\s*;?/g;
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

    'layer2-no-apply': {
      name: 'layer2-no-apply',
      description: 'Layer 2で@applyの使用を禁止します（保守性向上のため）。',
      check: (content) => {
        const violations = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // コメント行はスキップ
          if (isCommentLine(trimmedLine)) {
            return;
          }

          // @apply の使用を検出
          if (trimmedLine.includes('@apply')) {
            violations.push({
              line: index + 1,
              message: '@applyが使用されています。',
              suggestion: 'プロパティを直接記述することで、スタイルの追跡が容易になります。'
            });
          }
        });

        return violations;
      }
    },

    'layer2-no-css-var-definition': {
      name: 'layer2-no-css-var-definition',
      description: 'Layer 2でCSS変数（--*）の定義を禁止します。',
      check: (content) => {
        const violations = [];
        const lines = content.split('\n');

        let inRoot = false;

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // :rootブロックの追跡
          if (trimmedLine.startsWith(':root')) {
            inRoot = true;
            return;
          }
          if (inRoot && trimmedLine.includes('}')) {
            inRoot = false;
            return;
          }

          // :root外でのCSS変数定義を検出
          if (!inRoot && trimmedLine.match(/^--[a-zA-Z-]+:/)) {
            violations.push({
              line: index + 1,
              message: 'Layer 2でCSS変数を定義してはいけません。',
              suggestion: 'CSS変数の定義はLayer 1 (globals.css)で行ってください。Layer 3からLayer 1のトークンを直接参照してください。'
            });
          }
        });

        return violations;
      }
    },

    'layer2-no-hardcoded-values': {
      name: 'layer2-no-hardcoded-values',
      description: 'Layer 2で数値の直接指定を禁止します。すべての値はLayer 1のトークンをvar()で参照すべきです。bool値として0と1（単位なし）、および普遍的な全幅/全高を示す100%は許可されます。',
      check: (content) => {
        const violations = [];
        const lines = content.split('\n');

        let inRoot = false;

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // :rootブロックの追跡（Layer 1なので除外）
          if (trimmedLine.startsWith(':root')) {
            inRoot = true;
            return;
          }
          if (inRoot && trimmedLine.includes('}')) {
            inRoot = false;
            return;
          }

          // :root内はスキップ
          if (inRoot) return;

          // コメント行はスキップ
          if (isCommentLine(trimmedLine)) {
            return;
          }

          // CSSプロパティ行を検出: "property: value;"
          const propertyMatch = trimmedLine.match(/^([a-zA-Z-]+)\s*:\s*(.+?)\s*;?\s*$/);
          if (!propertyMatch) return;

          const propertyValue = propertyMatch[2];

          // 値全体をトークン化（スペース、カンマ、スラッシュで分割）
          // ただし、var()やcalc()などの関数内は保持
          const tokens = [];
          let currentToken = '';
          let parenDepth = 0;

          for (let i = 0; i < propertyValue.length; i++) {
            const char = propertyValue[i];

            if (char === '(') {
              parenDepth++;
              currentToken += char;
            } else if (char === ')') {
              parenDepth--;
              currentToken += char;
            } else if ((char === ' ' || char === ',' || char === '/') && parenDepth === 0) {
              if (currentToken.trim()) {
                tokens.push(currentToken.trim());
              }
              currentToken = '';
            } else {
              currentToken += char;
            }
          }
          if (currentToken.trim()) {
            tokens.push(currentToken.trim());
          }

          // 各トークンをチェック
          const violationTypes = new Set();
          const isShorthand = tokens.length > 1;

          tokens.forEach(token => {
            // var()、calc()、transform関数などの関数は許可
            if (token.includes('(') && token.includes(')')) {
              return;
            }

            // ブール値（0 または 1、単位なし）は常に許可
            if (token === '0' || token === '1') {
              return;
            }

            // 普遍的な全幅/全高を示す100%は許可
            if (token === '100%') {
              return;
            }

            // 中央配置に使用される50%と-50%は許可
            if (token === '50%' || token === '-50%') {
              return;
            }

            // ショートハンドの場合、単位付きの0も許可
            if (isShorthand && /^0(px|rem|em|%|vh|vw|vmin|vmax)$/.test(token)) {
              return;
            }

            // HEX色コード
            if (/#[0-9a-fA-F]{3,8}/.test(token)) {
              violationTypes.add('HEX色');
            }
            // RGB/RGBA関数
            else if (/^rgba?\(/.test(token)) {
              violationTypes.add('RGB/RGBA色');
            }
            // px値
            else if (/\d+\.?\d*px/.test(token)) {
              violationTypes.add('px値');
            }
            // rem値
            else if (/\d+\.?\d*rem/.test(token)) {
              violationTypes.add('rem値');
            }
            // em値
            else if (/\d+\.?\d*em/.test(token)) {
              violationTypes.add('em値');
            }
            // %値
            else if (/\d+\.?\d*%/.test(token)) {
              violationTypes.add('%値');
            }
            // その他の単位なし数値（0と1以外）
            else if (/^\d+\.?\d*$/.test(token)) {
              violationTypes.add('数値リテラル（単位なし）');
            }
          });

          // 違反があれば報告
          if (violationTypes.size > 0) {
            const types = Array.from(violationTypes).join(', ');
            violations.push({
              line: index + 1,
              message: `${types}が直接指定されています。`,
              suggestion: 'Layer 1のApplication Tokensをvar()で参照してください。例: var(--color-blue-400), var(--spacing-4), var(--font-size-xl)'
            });
          }
        });

        return violations;
      }
    }
  };
}
