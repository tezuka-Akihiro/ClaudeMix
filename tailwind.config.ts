import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin.js'
import typography from '@tailwindcss/typography'
import { blogLayer3Plugin } from './app/styles/blog/layer3'
import { blogLayer4Plugin } from './app/styles/blog/layer4'
import { accountLayer3Plugin } from './app/styles/account/layer3'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  plugins: [
    // Tailwind Typography: Prose classes for markdown content
    typography,
    // Blog: Layout structures
    blogLayer3Plugin,
    // Blog: Structure exceptions
    blogLayer4Plugin,
    // Account: Layout structures
    accountLayer3Plugin,
  ],
} satisfies Config