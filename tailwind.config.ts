import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin.js'
import typography from '@tailwindcss/typography'
import { layer3 } from './app/styles/flow-auditor/layer3'
import { layer4 } from './app/styles/flow-auditor/layer4'
import { blogLayer3Plugin } from './app/styles/blog/layer3'
import { blogLayer4Plugin } from './app/styles/blog/layer4'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  plugins: [
    // Tailwind Typography: Prose classes for markdown content
    typography,
    // Flow Auditor: Complex component styles with pseudo-elements and nested selectors
    plugin(function({ addComponents }) {
      addComponents({
        // ========================================
        // LINT-LAYER: 3
        // Layer 3: Structure (構造定義)
        // ========================================
        ...layer3,

        // ========================================
        // LINT-LAYER: 4
        // Layer 4: Structure Exceptions (構造例外)
        // ========================================
        ...layer4,
      });
    }),
    // Blog: Layout structures
    blogLayer3Plugin,
    // Blog: Structure exceptions
    blogLayer4Plugin,
  ],
} satisfies Config