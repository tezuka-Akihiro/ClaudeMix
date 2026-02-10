import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MangaPanel from './MangaPanel';
import type { MangaAsset } from '~/specs/blog/types';

describe('MangaPanel', () => {
  const mockAsset: MangaAsset = {
    fileName: 'panel-01.avif',
    path: '/content/blog/landing/engineer/manga/panel-01.avif',
    order: 1,
  };

  it('should render manga panel with correct image', () => {
    render(<MangaPanel asset={mockAsset} />);

    const panel = screen.getByTestId('manga-panel');
    expect(panel).toBeInTheDocument();

    const img = panel.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockAsset.path);
  });

  it('should render with correct alt text', () => {
    render(<MangaPanel asset={mockAsset} altLabel="Test Panel" />);

    const img = screen.getByAltText('Test Panel 1');
    expect(img).toBeInTheDocument();
  });

  it('should use lazy loading by default', () => {
    render(<MangaPanel asset={mockAsset} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should use eager loading when specified', () => {
    render(<MangaPanel asset={mockAsset} loading="eager" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('should apply manga-panel CSS class', () => {
    render(<MangaPanel asset={mockAsset} />);

    const panel = screen.getByTestId('manga-panel');
    expect(panel).toHaveClass('manga-panel');
  });

  it('should render with correct order in alt text', () => {
    const asset2: MangaAsset = {
      fileName: 'panel-05.avif',
      path: '/content/blog/landing/engineer/manga/panel-05.avif',
      order: 5,
    };

    render(<MangaPanel asset={asset2} altLabel="Spec Label" />);

    const img = screen.getByAltText('Spec Label 5');
    expect(img).toBeInTheDocument();
  });
});
