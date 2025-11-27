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
 * Layer 1 のルールを返します
 * @returns {object} ルールオブジェクト
 */
export function getLayer1Rules() {
  return {
    'layer1-no-important': {
      name: 'layer1-no-important',
      description: 'Layer 1で!importantの使用を禁止します。',
      check: (content) => checkNoImportant(content)
    },

    'layer1-no-var-reference': {
      name: 'layer1-no-var-reference',
      description: 'Layer 1でCSS変数の相互参照を禁止します（純粋性の維持）。',
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

          // :root内でのvar()参照を検出
          if (inRoot && trimmedLine.match(/^--[a-zA-Z-]+:/) && trimmedLine.includes('var(')) {
            violations.push({
              line: index + 1,
              message: 'Layer 1でCSS変数を参照してはいけません。',
              suggestion: 'Layer 1では純粋な原子値（例: #fff, 16px）のみを定義してください。計算が必要な場合は、Layer 2以降でcalc()を使用してください。'
            });
          }
        });

        return violations;
      }
    }
  };
}
