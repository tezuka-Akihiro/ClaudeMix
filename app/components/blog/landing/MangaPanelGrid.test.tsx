import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MangaPanelGrid from './MangaPanelGrid';
import type { MangaAsset } from '~/specs/blog/types';

describe('MangaPanelGrid', () => {
  const mockAssets: MangaAsset[] = [
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
    {
      fileName: 'panel-03.webp',
      path: '/content/blog/landing/engineer/manga/panel-03.webp',
      order: 3,
    },
  ];

  it('should render manga panel grid', () => {
    render(<MangaPanelGrid mangaAssets={mockAssets} />);

    const grid = screen.getByTestId('manga-panel-grid');
    expect(grid).toBeInTheDocument();
  });

  it('should render all manga panels', () => {
    render(<MangaPanelGrid mangaAssets={mockAssets} />);

    const panels = screen.getAllByTestId('manga-panel');
    expect(panels).toHaveLength(3);
  });

  it('should apply manga-panel-grid CSS classes', () => {
    render(<MangaPanelGrid mangaAssets={mockAssets} />);

    const grid = screen.getByTestId('manga-panel-grid');
    expect(grid).toHaveClass('manga-panel-grid');
    expect(grid).toHaveClass('manga-panel-grid-structure');
  });

  it('should use eager loading for first 2 panels (hero)', () => {
    render(<MangaPanelGrid mangaAssets={mockAssets} />);

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('loading', 'eager');
    expect(images[1]).toHaveAttribute('loading', 'eager');
    expect(images[2]).toHaveAttribute('loading', 'lazy');
  });

  it('should use lazy loading for panels beyond heroMaxCount', () => {
    const manyAssets: MangaAsset[] = [
      ...mockAssets,
      {
        fileName: 'panel-04.webp',
        path: '/content/blog/landing/engineer/manga/panel-04.webp',
        order: 4,
      },
      {
        fileName: 'panel-05.webp',
        path: '/content/blog/landing/engineer/manga/panel-05.webp',
        order: 5,
      },
    ];

    render(<MangaPanelGrid mangaAssets={manyAssets} />);

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('loading', 'eager');
    expect(images[1]).toHaveAttribute('loading', 'eager');
    expect(images[2]).toHaveAttribute('loading', 'lazy');
    expect(images[3]).toHaveAttribute('loading', 'lazy');
    expect(images[4]).toHaveAttribute('loading', 'lazy');
  });

  it('should accept custom heroMaxCount', () => {
    render(<MangaPanelGrid mangaAssets={mockAssets} heroMaxCount={1} />);

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('loading', 'eager');
    expect(images[1]).toHaveAttribute('loading', 'lazy');
    expect(images[2]).toHaveAttribute('loading', 'lazy');
  });

  it('should render with empty manga assets array', () => {
    render(<MangaPanelGrid mangaAssets={[]} />);

    const grid = screen.getByTestId('manga-panel-grid');
    expect(grid).toBeInTheDocument();

    const panels = screen.queryAllByTestId('manga-panel');
    expect(panels).toHaveLength(0);
  });

  it('should render panels in correct order', () => {
    render(<MangaPanelGrid mangaAssets={mockAssets} />);

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('alt', '漫画パネル 1');
    expect(images[1]).toHaveAttribute('alt', '漫画パネル 2');
    expect(images[2]).toHaveAttribute('alt', '漫画パネル 3');
  });
});
