import { describe, it, expect } from 'vitest'
import { determineContentVisibility } from './determineContentVisibility'
import type { Heading } from '~/specs/blog/types'

describe('determineContentVisibility', () => {
  const sampleHeadings: Heading[] = [
    { level: 2, text: 'はじめに', id: 'intro' },
    { level: 2, text: '概要', id: 'overview' },
    { level: 2, text: '本編', id: 'main' },
    { level: 2, text: 'まとめ', id: 'conclusion' },
  ]

  describe('契約ユーザー（hasActiveSubscription: true）', () => {
    it('freeContentHeadingが指定されていても全文表示', () => {
      const result = determineContentVisibility(true, '概要', sampleHeadings)
      expect(result).toEqual({
        showFullContent: true,
        cutoffHeadingId: null,
      })
    })

    it('freeContentHeadingがnullでも全文表示', () => {
      const result = determineContentVisibility(true, null, sampleHeadings)
      expect(result).toEqual({
        showFullContent: true,
        cutoffHeadingId: null,
      })
    })

    it('headingsが空配列でも全文表示', () => {
      const result = determineContentVisibility(true, '概要', [])
      expect(result).toEqual({
        showFullContent: true,
        cutoffHeadingId: null,
      })
    })
  })

  describe('未契約ユーザー（hasActiveSubscription: false）', () => {
    it('freeContentHeadingが指定され、見出しが存在する場合、該当見出しIDを返す', () => {
      const result = determineContentVisibility(false, '概要', sampleHeadings)
      expect(result).toEqual({
        showFullContent: false,
        cutoffHeadingId: 'overview',
      })
    })

    it('freeContentHeadingが「はじめに」の場合、intro IDを返す', () => {
      const result = determineContentVisibility(false, 'はじめに', sampleHeadings)
      expect(result).toEqual({
        showFullContent: false,
        cutoffHeadingId: 'intro',
      })
    })

    it('freeContentHeadingが最後の見出しの場合でも、該当IDを返す', () => {
      const result = determineContentVisibility(false, 'まとめ', sampleHeadings)
      expect(result).toEqual({
        showFullContent: false,
        cutoffHeadingId: 'conclusion',
      })
    })

    it('freeContentHeadingがnullの場合、全文公開', () => {
      const result = determineContentVisibility(false, null, sampleHeadings)
      expect(result).toEqual({
        showFullContent: true,
        cutoffHeadingId: null,
      })
    })
  })

  describe('フォールバック（見出しが見つからない場合）', () => {
    it('freeContentHeadingが存在しない見出しの場合、全文公開', () => {
      const result = determineContentVisibility(false, '存在しない見出し', sampleHeadings)
      expect(result).toEqual({
        showFullContent: true,
        cutoffHeadingId: null,
      })
    })

    it('headingsが空配列の場合、全文公開', () => {
      const result = determineContentVisibility(false, '概要', [])
      expect(result).toEqual({
        showFullContent: true,
        cutoffHeadingId: null,
      })
    })

    it('freeContentHeadingが空文字列の場合、全文公開', () => {
      const result = determineContentVisibility(false, '', sampleHeadings)
      expect(result).toEqual({
        showFullContent: true,
        cutoffHeadingId: null,
      })
    })
  })

  describe('大文字小文字・空白の扱い', () => {
    it('見出しテキストは完全一致で検索される', () => {
      const result = determineContentVisibility(false, '概要', sampleHeadings)
      expect(result.cutoffHeadingId).toBe('overview')
    })

    it('大文字小文字が異なる場合は一致しない', () => {
      const headings: Heading[] = [{ level: 2, text: 'Overview', id: 'overview' }]
      const result = determineContentVisibility(false, 'overview', headings)
      expect(result).toEqual({
        showFullContent: true,
        cutoffHeadingId: null,
      })
    })
  })
})
