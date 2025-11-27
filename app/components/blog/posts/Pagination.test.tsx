import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Pagination from '~/components/blog/posts/Pagination';

// Helper function to render component with Router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Pagination', () => {
  it('should render page numbers', () => {
    // Arrange & Act
    renderWithRouter(<Pagination currentPage={1} totalPages={5} />);

    // Assert
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should highlight current page', () => {
    // Arrange & Act
    renderWithRouter(<Pagination currentPage={2} totalPages={5} />);

    // Assert
    const currentPage = screen.getByText('2');
    expect(currentPage).toHaveClass('pagination-number--active');
  });

  it('should not show prev button on first page', () => {
    // Arrange & Act
    renderWithRouter(<Pagination currentPage={1} totalPages={5} />);

    // Assert
    expect(screen.queryByText('← 前へ')).not.toBeInTheDocument();
  });

  it('should show prev button on page 2', () => {
    // Arrange & Act
    renderWithRouter(<Pagination currentPage={2} totalPages={5} />);

    // Assert
    expect(screen.getByText('← 前へ')).toBeInTheDocument();
  });

  it('should not show next button on last page', () => {
    // Arrange & Act
    renderWithRouter(<Pagination currentPage={5} totalPages={5} />);

    // Assert
    expect(screen.queryByText('次へ →')).not.toBeInTheDocument();
  });

  it('should show next button on page 1', () => {
    // Arrange & Act
    renderWithRouter(<Pagination currentPage={1} totalPages={5} />);

    // Assert
    expect(screen.getByText('次へ →')).toBeInTheDocument();
  });

  it('should show ellipsis for large page counts', () => {
    // Arrange & Act
    renderWithRouter(<Pagination currentPage={5} totalPages={10} />);

    // Assert
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('should limit visible pages to current ±2', () => {
    // Arrange & Act
    renderWithRouter(<Pagination currentPage={5} totalPages={10} />);

    // Assert
    // Page 5 ±2 should be visible (3, 4, 5, 6, 7)
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    // Page 1 and 10 should also be visible (always show first and last)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    // Page 2 should not be visible
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });
});
