import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Paywall } from './Paywall'
import { BrowserRouter } from 'react-router-dom'

describe('Paywall', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  it('ペイウォールメッセージが表示される', () => {
    renderWithRouter(<Paywall />)

    expect(
      screen.getByText('続きを読むには会員登録が必要です')
    ).toBeInTheDocument()
  })

  it('SubscriptionPromotionBannerが内包されている', () => {
    renderWithRouter(<Paywall />)

    // SubscriptionPromotionBannerの要素が存在するか確認
    expect(
      screen.getByText('すべての記事を読むには会員登録が必要です')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /プランを見る/ })
    ).toBeInTheDocument()
  })
})
