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
 * Layer 4 のルールを返します
 * @returns {object} ルールオブジェクト
 */
export function getLayer4Rules() {
  return {
    'layer4-no-important': {
      name: 'layer4-no-important',
      description: 'Layer 4で!importantの使用を禁止します。',
      check: (content) => checkNoImportant(content)
    },

    'layer4-allowed-only': {
      name: 'layer4-allowed-only',
      description: 'Layer 4では許可されたプロパティやキーワードのみ使用を許可します。',
      check: (content, _filePath, config) => {
        const violations = [];
        const lines = content.split('\n');

        // keyword.jsonのlayer4配列から許可リストを取得
        const allowedKeywords = config;

        let inKeyframes = false;

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // コメント行はスキップ
          if (isCommentLine(trimmedLine)) {
            return;
          }

          // @keyframesブロックの開始・終了を追跡
          if (trimmedLine.includes('@keyframes')) {
            inKeyframes = true;
            return;
          }

          if (inKeyframes && trimmedLine === '}') {
            inKeyframes = false;
            return;
          }

          // @keyframesブロック内はチェック対象外（許可）
          if (inKeyframes) {
            return;
          }

          // TypeScriptのプロパティ形式をチェック: property: "value"
          const animationPropertyMatch = trimmedLine.match(/(\w+)\s*:\s*['"`]/);

          if (animationPropertyMatch) {
            const property = animationPropertyMatch[1];

            // 許可リストに含まれるかチェック
            const isAllowed = allowedKeywords.some(allowed => {
              // kebab-caseに変換して比較
              const kebabAllowed = allowed.replace(/([A-Z])/g, '-$1').toLowerCase();
              const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();

              return property === allowed ||
                     kebabProperty === kebabAllowed ||
                     allowed.startsWith('@') ||  // @keyframes自体を許可
                     allowed.startsWith('::') || // 擬似要素自体を許可
                     allowed.startsWith(':');    // 擬似クラス自体を許可
            });

            // 許可リストにないプロパティの場合
            if (!isAllowed) {
              violations.push({
                line: index + 1,
                message: `許可されていないプロパティ "${property}" が使用されています。`,
                suggestion: 'Layer 4ではアニメーションや擬似要素に関するプロパティのみ使用できます。その他の構造定義は Layer 2 または Layer 3 で行ってください。'
              });
            }
          }
        });

        return violations;
      }
    }
  };
}
