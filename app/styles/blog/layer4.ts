/**
 * Layer 4: Structure Exceptions for Blog Service (Tailwind Plugin)
 *
 * Purpose: Define exceptional structures (pseudo-elements, descendant selectors, animations).
 * This layer handles cases that cannot be expressed in Layer 3.
 *
 * Architecture Rules:
 * - Use only when Layer 3 cannot express the structure
 * - Examples: ::before, ::after, :hover animations, complex child selectors
 * - Keep exceptions minimal and well-documented
 */

import plugin from "tailwindcss/plugin";

export const blogLayer4Plugin = plugin(function ({ addComponents }) {
  addComponents({
    // Layer 4の責務: 例外的な構造（疑似要素、子孫セレクタ、アニメーション）
    // 現時点ではblogサービスに例外的な構造は不要
    // 必要になった場合（::before, ::after, カスタムアニメーションなど）、ここに追加
  });
});

export default blogLayer4Plugin;
