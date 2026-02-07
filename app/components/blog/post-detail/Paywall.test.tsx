import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Paywall } from './Paywall'
import { BrowserRouter } from 'react-router-dom'
import { loadSpec, type BlogPostDetailSpec } from '../../../../tests/utils/loadSpec'

describe('Paywall', () => {
  let spec: BlogPostDetailSpec;

  beforeAll(async () => {
    spec = await loadSpec<BlogPostDetailSpec>('blog', 'post-detail');
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  it('ペイウォールメッセージが表示される', () => {
    renderWithRouter(<Paywall spec={spec} />)

    expect(
      screen.getByText(spec.messages.ui.paywall_message)
    ).toBeInTheDocument()
  })

  it('SubscriptionPromotionBannerが内包されている', () => {
    renderWithRouter(<Paywall spec={spec} />)

    // SubscriptionPromotionBannerの要素が存在するか確認
    expect(
      screen.getByText(spec.promotion.title)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: new RegExp(spec.promotion.button_label) })
    ).toBeInTheDocument()
  })
})
