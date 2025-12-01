import type { CSSRuleObject } from 'tailwindcss/types/config';

export const layer4: CSSRuleObject = {
  // Layer 4の責務であるカスタムアニメーションを定義
  '@keyframes pulse': {
    '50%': {
      opacity: '0.5',
    },
  },
};