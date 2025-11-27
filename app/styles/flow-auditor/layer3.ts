import type { CSSRuleObject } from 'tailwindcss/types/config';

export const layer3: CSSRuleObject = {
  // ========================================
  // 1. 画面共通 (Screen Common)
  // ========================================
  '.page-header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
  },
  '.page-header-left': {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
  },
  '.page-footer': {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
  },

  // ========================================
  // 2. セクション共通 (Section Common)
  // ========================================
  '.card-item': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-1)',
  },
  '.select-container': {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
  },

  // ========================================
  // 3. セクション固有 (Section Specific)
  // ========================================
  '.design-flow-section': {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-4)',
  },
  '.implementation-flow-section': {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-4)',
  },
  '.branched-flow-container': {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 'var(--spacing-5)',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  '.flow-branch': {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: '0',
    gap: 'var(--spacing-1)',
  },
  '.common-section-container': {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: '0',
  },
  '.test-script-pair': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-2)',
  },
  '.pair-container': {
    display: 'flex',
    justifyContent: 'space-between',
  },
  '.pair-item': {
    flexGrow: '1',
  },
  '.unpaired-file-wrapper': {
    display: 'flex',
    justifyContent: 'center',
  },
  '.card-item-list': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
  },
  '.card-item-list-vertical': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
  },
  '.card-item-flow-container': {
    display: 'flex',
    flexDirection: 'column',
  },
  '.common-flow-wrapper': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '.common-section-wrapper': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '.design-flow-section-container': {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-2)',
  },
};
