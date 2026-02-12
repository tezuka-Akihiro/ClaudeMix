/**
 * Tailwindユーティリティクラスのパターン定義
 */
const TAILWIND_PATTERNS = [
  // Layout utilities
  /\b[pm][xy]?-\d+\b/g,           // padding/margin: p-*, m-*, px-*, py-*
  /\b[pm][trbl]-\d+\b/g,          // padding/margin (directional): pt-*, pr-*, pb-*, pl-*
  /\bw-\d+\b/g,                   // width: w-*
  /\bh-\d+\b/g,                   // height: h-*
  /\b(flex|grid|block|inline|hidden)\b/g,  // display
  /\b(absolute|relative|fixed|sticky)\b/g, // position
  // Color utilities
  /\bbg-\w+-\d+\b/g,              // background colors
  /\btext-\w+-\d+\b/g,            // text colors
  /\bborder-\w+-\d+\b/g,          // border colors
  // Gap/Space utilities
  /\bgap-\d+\b/g,
  /\bspace-[xy]-\d+\b/g,

  // === 新規追加パターン (Phase 1-3: L7) ===
  // Cursor utilities
  /\bcursor-(auto|default|pointer|wait|text|move|help|not-allowed|none|context-menu|progress|cell|crosshair|vertical-text|alias|copy|no-drop|grab|grabbing|all-scroll|col-resize|row-resize|n-resize|e-resize|s-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out)\b/g,

  // Font weight utilities
  /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g,

  // Font family utilities
  /\bfont-(sans|serif|mono)\b/g,

  // Text size utilities
  /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g,

  // Opacity utilities
  /\bopacity-\d+\b/g,

  // Transform utilities
  /\b(transform|transform-none)\b/g,
  /\b(rotate|scale|translate|skew)-\w+\b/g,
  /\b-?(rotate|scale|translate|skew)-(x|y)-\d+\b/g,

  // Transition utilities
  /\btransition(-\w+)?\b/g,
  /\bduration-\d+\b/g,
  /\bdelay-\d+\b/g,
  /\bease-(linear|in|out|in-out)\b/g,

  // Shadow utilities
  /\bshadow(-\w+)?\b/g,
  /\bdrop-shadow(-\w+)?\b/g,

  // Border radius utilities
  /\brounded(-\w+)?\b/g,

  // Border width utilities
  /\bborder(-[trblxy])?-\d+\b/g,
  /\bborder(-[trbl])?\b/g,

  // Z-index utilities
  /\bz-\d+\b/g,
  /\bz-(auto)\b/g,

  // Position utilities (directional)
  /\b(top|right|bottom|left|inset)(-[xy])?-\d+\b/g,
  /\b(top|right|bottom|left|inset)-auto\b/g,

  // Flexbox utilities
  /\b(items|justify|content|self)-(start|end|center|stretch|between|around|evenly|baseline|auto)\b/g,
  /\bflex-(row|col|wrap|wrap-reverse|nowrap|1|auto|initial|none)\b/g,
  /\b(grow|shrink)(-\d+)?\b/g,

  // Grid utilities
  /\bgrid-cols-\d+\b/g,
  /\bgrid-rows-\d+\b/g,
  /\b(col|row)-(auto|span-\d+|start-\d+|end-\d+)\b/g,

  // Overflow utilities
  /\boverflow-(auto|hidden|visible|scroll|x-auto|x-hidden|x-visible|x-scroll|y-auto|y-hidden|y-visible|y-scroll)\b/g,

  // Text utilities
  /\b(truncate|text-ellipsis|text-clip)\b/g,
  /\bwhitespace-(normal|nowrap|pre|pre-line|pre-wrap)\b/g,
  /\bbreak-(normal|words|all)\b/g,
  /\btext-(left|center|right|justify)\b/g,
  /\b(uppercase|lowercase|capitalize|normal-case)\b/g,
  /\b(underline|overline|line-through|no-underline)\b/g,
  /\b(italic|not-italic)\b/g,

  // Background utilities
  /\bbg-(transparent|current|white|black)\b/g,

  // Min/Max width/height
  /\b(min|max)-w-\w+\b/g,
  /\b(min|max)-h-\w+\b/g,

  // Aspect ratio
  /\baspect-(auto|square|video)\b/g,

  // Object fit/position
  /\bobject-(contain|cover|fill|none|scale-down)\b/g,
  /\bobject-(bottom|center|left|left-bottom|left-top|right|right-bottom|right-top|top)\b/g,
];

/**
 * 許可するクラス名プレフィックス
 */
const ALLOWED_PREFIXES = ['custom-', 'component-', 'flow-', 'blog-', 'post-', 'navigation-', 'tag-', 'filter-', 'category-', 'page-', 'profile-', 'form-'];

/**
 * クラス名が許可されたプレフィックスで始まるかチェック
 * @param {string} className - チェックするクラス名
 * @returns {boolean} 許可されている場合true
 */
function isAllowedClass(className) {
  return ALLOWED_PREFIXES.some(prefix => className.startsWith(prefix));
}

/**
 * Layer 5 のルールを返します
 * @returns {object} ルールオブジェクト
 */
export function getLayer5Rules() {
  return {
    'layer5-no-tailwind-utilities': {
      name: 'layer5-no-tailwind-utilities',
      description: 'Layer 5でTailwindユーティリティクラスの直接使用を禁止します。',
      check: (content) => {
        const violations = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // classNameプロパティを検出: className="..." または className={...}
          const classNameMatch = line.match(/className\s*=\s*[{"`']([^{"`']+)[{"`']/);

          if (classNameMatch) {
            const classNameContent = classNameMatch[1];

            // クラス名を空白で分割して個別にチェック
            const classNames = classNameContent.trim().split(/\s+/);

            classNames.forEach(className => {
              // 許可されたプレフィックスのクラスは除外
              if (isAllowedClass(className)) {
                return;
              }

              // 各パターンでチェック
              TAILWIND_PATTERNS.forEach(pattern => {
                // パターンにマッチするか確認
                if (pattern.test(className)) {
                  violations.push({
                    line: index + 1,
                    message: `禁止されたTailwindユーティリティクラス "${className}" が使用されています。`,
                    suggestion: 'スタイルは Layer 2-4 で定義されたCSSクラスを使用してください。'
                  });
                }
                // 正規表現のlastIndexをリセット
                pattern.lastIndex = 0;
              });
            });
          }
        });

        return violations;
      }
    }
  };
}
