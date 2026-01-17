import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CTASection from './CTASection';
import type { CTALink } from '~/specs/blog/types';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CTASection', () => {
  const mockCtaLinks: CTALink[] = [
    {
      label: 'ドキュメント',
      url: '/blog',
      aria_label: 'ドキュメントページへ移動',
    },
    {
      label: 'GitHub',
      url: 'https://github.com/Tezuka-Akihiro/ClaudeMix',
      aria_label: 'GitHubリポジトリへ移動',
    },
    {
      label: 'デモ',
      url: '/blog/landing/engineer',
      aria_label: 'デモページへ移動',
    },
  ];

  it('should render CTA section', () => {
    renderWithRouter(<CTASection ctaLinks={mockCtaLinks} />);

    const section = screen.getByTestId('cta-section');
    expect(section).toBeInTheDocument();
  });

  it('should render all CTA buttons', () => {
    renderWithRouter(<CTASection ctaLinks={mockCtaLinks} />);

    const buttons = screen.getAllByTestId('cta-button');
    expect(buttons).toHaveLength(3);
  });

  it('should render buttons with correct labels', () => {
    renderWithRouter(<CTASection ctaLinks={mockCtaLinks} />);

    expect(screen.getByText('ドキュメント')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('デモ')).toBeInTheDocument();
  });

  it('should render buttons with correct hrefs', () => {
    renderWithRouter(<CTASection ctaLinks={mockCtaLinks} />);

    const buttons = screen.getAllByTestId('cta-button');
    expect(buttons[0]).toHaveAttribute('href', '/blog');
    expect(buttons[1]).toHaveAttribute('href', 'https://github.com/Tezuka-Akihiro/ClaudeMix');
    expect(buttons[2]).toHaveAttribute('href', '/blog/landing/engineer');
  });

  it('should render buttons with correct aria-labels', () => {
    renderWithRouter(<CTASection ctaLinks={mockCtaLinks} />);

    const buttons = screen.getAllByTestId('cta-button');
    expect(buttons[0]).toHaveAttribute('aria-label', 'ドキュメントページへ移動');
    expect(buttons[1]).toHaveAttribute('aria-label', 'GitHubリポジトリへ移動');
    expect(buttons[2]).toHaveAttribute('aria-label', 'デモページへ移動');
  });

  it('should apply cta-section CSS classes', () => {
    renderWithRouter(<CTASection ctaLinks={mockCtaLinks} />);

    const section = screen.getByTestId('cta-section');
    expect(section).toHaveClass('cta-section');
    expect(section).toHaveClass('cta-section-structure');
  });

  it('should apply cta-button CSS class to all buttons', () => {
    renderWithRouter(<CTASection ctaLinks={mockCtaLinks} />);

    const buttons = screen.getAllByTestId('cta-button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('cta-button');
    });
  });

  it('should render with empty CTA links array', () => {
    renderWithRouter(<CTASection ctaLinks={[]} />);

    const section = screen.getByTestId('cta-section');
    expect(section).toBeInTheDocument();

    const buttons = screen.queryAllByTestId('cta-button');
    expect(buttons).toHaveLength(0);
  });
});
