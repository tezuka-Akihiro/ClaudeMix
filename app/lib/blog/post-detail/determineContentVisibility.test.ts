import { describe, it, expect } from 'vitest'
import { determineContentVisibility } from './determineContentVisibility'

describe('determineContentVisibility', () => {
  describe('契約ユーザー（hasActiveSubscription: true）', () => {
    it('freeContentPercentageが0でも全文表示', () => {
      const result = determineContentVisibility(true, 0)
      expect(result).toEqual({
        showFullContent: true,
        visiblePercentage: 100,
      })
    })

    it('freeContentPercentageが50でも全文表示', () => {
      const result = determineContentVisibility(true, 50)
      expect(result).toEqual({
        showFullContent: true,
        visiblePercentage: 100,
      })
    })

    it('freeContentPercentageが100でも全文表示', () => {
      const result = determineContentVisibility(true, 100)
      expect(result).toEqual({
        showFullContent: true,
        visiblePercentage: 100,
      })
    })
  })

  describe('未契約ユーザー（hasActiveSubscription: false）', () => {
    it('freeContentPercentageが0の場合、0%のみ表示', () => {
      const result = determineContentVisibility(false, 0)
      expect(result).toEqual({
        showFullContent: false,
        visiblePercentage: 0,
      })
    })

    it('freeContentPercentageが30の場合、30%まで表示', () => {
      const result = determineContentVisibility(false, 30)
      expect(result).toEqual({
        showFullContent: false,
        visiblePercentage: 30,
      })
    })

    it('freeContentPercentageが50の場合、50%まで表示', () => {
      const result = determineContentVisibility(false, 50)
      expect(result).toEqual({
        showFullContent: false,
        visiblePercentage: 50,
      })
    })

    it('freeContentPercentageが100の場合でも、showFullContentはfalse（ペイウォールは非表示）', () => {
      const result = determineContentVisibility(false, 100)
      expect(result).toEqual({
        showFullContent: false,
        visiblePercentage: 100,
      })
    })
  })

  describe('境界値テスト', () => {
    it('freeContentPercentageが負の値の場合でも、そのまま返す（バリデーションは呼び出し側の責務）', () => {
      const result = determineContentVisibility(false, -10)
      expect(result).toEqual({
        showFullContent: false,
        visiblePercentage: -10,
      })
    })

    it('freeContentPercentageが100を超える場合でも、そのまま返す（バリデーションは呼び出し側の責務）', () => {
      const result = determineContentVisibility(false, 150)
      expect(result).toEqual({
        showFullContent: false,
        visiblePercentage: 150,
      })
    })
  })
})
