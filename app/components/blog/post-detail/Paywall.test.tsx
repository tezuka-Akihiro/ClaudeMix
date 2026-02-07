import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Paywall } from './Paywall'
import { BrowserRouter } from 'react-router-dom'

describe('Paywall', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  const mockProps = {
    message: '続きを読むには会員登録が必要です',
    promotionHeading: 'すべての記事を読むには会員登録が必要です',
    ctaLabel: 'プランを見る',
  }

  it('ペイウォールメッセージが表示される', () => {
    renderWithRouter(<Paywall {...mockProps} />)

    expect(
      screen.getByText(mockProps.message)
    ).toBeInTheDocument()
  })

  it('SubscriptionPromotionBannerが内包されている', () => {
    renderWithRouter(<Paywall {...mockProps} />)

    // SubscriptionPromotionBannerの要素が存在するか確認
    expect(
      screen.getByText(mockProps.promotionHeading)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: new RegExp(mockProps.ctaLabel) })
    ).toBeInTheDocument()
  })
})
