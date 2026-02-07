import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SubscriptionPromotionBanner } from './SubscriptionPromotionBanner'
import { loadSpec, type BlogPostDetailSpec } from '../../../../tests/utils/loadSpec'

describe('SubscriptionPromotionBanner', () => {
  let spec: BlogPostDetailSpec;

  beforeAll(async () => {
    spec = await loadSpec<BlogPostDetailSpec>('blog', 'post-detail');
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  it('見出しが表示される', () => {
    renderWithRouter(<SubscriptionPromotionBanner spec={spec} />)

    expect(
      screen.getByText(spec.promotion.title)
    ).toBeInTheDocument()
  })

  it('CTAボタンが表示され、/account/subscriptionへのリンクである', () => {
    renderWithRouter(<SubscriptionPromotionBanner spec={spec} />)

    const ctaButton = screen.getByRole('link', {
      name: new RegExp(spec.promotion.button_label),
    })
    expect(ctaButton).toBeInTheDocument()
    expect(ctaButton).toHaveAttribute('href', '/account/subscription')
  })

  it('プラン情報が表示される', () => {
    renderWithRouter(<SubscriptionPromotionBanner spec={spec} />)

    // プランの期間が表示されているか確認
    spec.promotion.plans.forEach((plan: { duration: string; price: string }) => {
      expect(screen.getByText(new RegExp(plan.duration))).toBeInTheDocument()
      expect(screen.getByText(new RegExp(plan.price.replace('(', '\\(').replace(')', '\\)')))).toBeInTheDocument()
    });
  })
})
