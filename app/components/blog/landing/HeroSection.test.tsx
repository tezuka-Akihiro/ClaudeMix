import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from './HeroSection';
import type { MangaAsset } from '~/specs/blog/types';

describe('HeroSection', () => {
  const mockHeroAssets: MangaAsset[] = [
    {
      fileName: 'panel-01.webp',
      path: '/content/blog/landing/engineer/manga/panel-01.webp',
      order: 1,
    },
    {
      fileName: 'panel-02.webp',
      path: '/content/blog/landing/engineer/manga/panel-02.webp',
      order: 2,
    },
  ];

  it('should render hero section', () => {
    render(
      <HeroSection
        catchCopy="Test Catch Copy"
        heroMangaAssets={mockHeroAssets}
      />
    );

    const section = screen.getByTestId('hero-section');
    expect(section).toBeInTheDocument();
  });

  it('should render catch copy', () => {
    render(
      <HeroSection
        catchCopy="Remixで高速開発、Claudeで高品質。"
        heroMangaAssets={mockHeroAssets}
      />
    );

    const catchCopy = screen.getByTestId('catch-copy');
    expect(catchCopy).toBeInTheDocument();
    expect(catchCopy).toHaveTextContent('Remixで高速開発、Claudeで高品質。');
  });

  it('should render catch copy as h1', () => {
    render(
      <HeroSection
        catchCopy="Test Catch Copy"
        heroMangaAssets={mockHeroAssets}
      />
    );

    const catchCopy = screen.getByRole('heading', { level: 1 });
    expect(catchCopy).toBeInTheDocument();
    expect(catchCopy).toHaveTextContent('Test Catch Copy');
  });

  it('should render all hero manga panels', () => {
    render(
      <HeroSection
        catchCopy="Test Catch Copy"
        heroMangaAssets={mockHeroAssets}
      />
    );

    const panels = screen.getAllByTestId('manga-panel');
    expect(panels).toHaveLength(2);
  });

  it('should apply hero-section CSS classes', () => {
    render(
      <HeroSection
        catchCopy="Test Catch Copy"
        heroMangaAssets={mockHeroAssets}
      />
    );

    const section = screen.getByTestId('hero-section');
    expect(section).toHaveClass('hero-section');
    expect(section).toHaveClass('hero-section-structure');
  });

  it('should apply catch-copy CSS class', () => {
    render(
      <HeroSection
        catchCopy="Test Catch Copy"
        heroMangaAssets={mockHeroAssets}
      />
    );

    const catchCopy = screen.getByTestId('catch-copy');
    expect(catchCopy).toHaveClass('catch-copy');
  });

  it('should use eager loading for all hero panels', () => {
    render(
      <HeroSection
        catchCopy="Test Catch Copy"
        heroMangaAssets={mockHeroAssets}
      />
    );

    const images = screen.getAllByRole('img');
    images.forEach((img) => {
      expect(img).toHaveAttribute('loading', 'eager');
    });
  });

  it('should render with empty hero manga assets', () => {
    render(
      <HeroSection catchCopy="Test Catch Copy" heroMangaAssets={[]} />
    );

    const section = screen.getByTestId('hero-section');
    expect(section).toBeInTheDocument();

    const panels = screen.queryAllByTestId('manga-panel');
    expect(panels).toHaveLength(0);
  });

  it('should render manga panels in correct order with spec label', () => {
    render(
      <HeroSection
        catchCopy="Test Catch Copy"
        heroMangaAssets={mockHeroAssets}
        mangaPanelAltLabel="Spec Label"
      />
    );

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('alt', 'Spec Label 1');
    expect(images[1]).toHaveAttribute('alt', 'Spec Label 2');
  });

  it('should render multiline catch copy', () => {
    const multilineCatchCopy = `Remixで高速開発、
Claudeで高品質。`;

    render(
      <HeroSection
        catchCopy={multilineCatchCopy}
        heroMangaAssets={mockHeroAssets}
      />
    );

    const catchCopy = screen.getByTestId('catch-copy');
    expect(catchCopy).toHaveTextContent('Remixで高速開発');
    expect(catchCopy).toHaveTextContent('Claudeで高品質');
  });
});
