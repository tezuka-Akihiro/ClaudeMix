import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingFooter from './LandingFooter';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('LandingFooter', () => {
  const mockLinks = [
    { label: 'プライバシーポリシー', href: '/privacy', isModal: false },
    { label: '利用規約', href: '/terms', isModal: false },
  ];

  const mockLegalContent = '<p>特定商取引法の内容</p>';

  it('should render footer', () => {
    renderWithRouter(<LandingFooter links={mockLinks} legalContent={mockLegalContent} />);

    const footer = screen.getByTestId('landing-footer');
    expect(footer).toBeInTheDocument();
  });

  it('should render all footer links', () => {
    renderWithRouter(<LandingFooter links={mockLinks} legalContent={mockLegalContent} />);

    const links = screen.getAllByTestId('footer-link');
    expect(links).toHaveLength(2);
  });

  it('should render links with correct labels', () => {
    renderWithRouter(<LandingFooter links={mockLinks} legalContent={mockLegalContent} />);

    expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument();
    expect(screen.getByText('利用規約')).toBeInTheDocument();
  });

  it('should render links with correct hrefs', () => {
    renderWithRouter(<LandingFooter links={mockLinks} legalContent={mockLegalContent} />);

    const links = screen.getAllByTestId('footer-link');
    expect(links[0]).toHaveAttribute('href', '/privacy');
    expect(links[1]).toHaveAttribute('href', '/terms');
  });

  it('should render copyright with current year', () => {
    renderWithRouter(<LandingFooter links={mockLinks} legalContent={mockLegalContent} />);

    const currentYear = new Date().getFullYear();
    const copyright = screen.getByText(`© ${currentYear} ClaudeMix`);
    expect(copyright).toBeInTheDocument();
  });

  it('should apply blog-footer CSS classes for design consistency', () => {
    renderWithRouter(<LandingFooter links={mockLinks} legalContent={mockLegalContent} />);

    const footer = screen.getByTestId('landing-footer');
    expect(footer).toHaveClass('blog-footer');
    expect(footer).toHaveClass('blog-footer-structure');
  });

  it('should render with empty links array', () => {
    renderWithRouter(<LandingFooter links={[]} legalContent={mockLegalContent} />);

    const footer = screen.getByTestId('landing-footer');
    expect(footer).toBeInTheDocument();

    const links = screen.queryAllByTestId('footer-link');
    expect(links).toHaveLength(0);
  });
});
