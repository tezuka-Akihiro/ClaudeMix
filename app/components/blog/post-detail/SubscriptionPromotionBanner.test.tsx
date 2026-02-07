import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SubscriptionPromotionBanner } from './SubscriptionPromotionBanner'

describe('SubscriptionPromotionBanner', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  const mockProps = {
    heading: 'すべての記事を読むには会員登録が必要です',
    ctaLabel: 'プランを見る',
  }

  it('見出しが表示される', () => {
    renderWithRouter(<SubscriptionPromotionBanner {...mockProps} />)

    expect(
      screen.getByText(new RegExp(mockProps.heading))
    ).toBeInTheDocument()
  })

  it('CTAボタンが表示され、/account/subscriptionへのリンクである', () => {
    renderWithRouter(<SubscriptionPromotionBanner {...mockProps} />)

    const ctaButton = screen.getByRole('link', {
      name: new RegExp(mockProps.ctaLabel),
    })
    expect(ctaButton).toBeInTheDocument()
    expect(ctaButton).toHaveAttribute('href', '/account/subscription')
  })

  it('プラン情報が表示される', () => {
    renderWithRouter(<SubscriptionPromotionBanner {...mockProps} />)

    // プランの期間が表示されているか確認
    expect(screen.getByText(/1ヶ月/)).toBeInTheDocument()
    expect(screen.getByText(/3ヶ月/)).toBeInTheDocument()
    expect(screen.getByText(/6ヶ月/)).toBeInTheDocument()
  })
})
