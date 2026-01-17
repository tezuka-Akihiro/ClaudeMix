import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScrollSection from './ScrollSection';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

describe('ScrollSection', () => {
  beforeEach(() => {
    global.IntersectionObserver = MockIntersectionObserver as any;
  });

  it('should render scroll section', () => {
    render(<ScrollSection description="Test description" />);

    const section = screen.getByTestId('scroll-section');
    expect(section).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(<ScrollSection description="Test description content" />);

    expect(screen.getByText('Test description content')).toBeInTheDocument();
  });

  it('should apply scroll-section CSS classes', () => {
    render(<ScrollSection description="Test description" />);

    const section = screen.getByTestId('scroll-section');
    expect(section).toHaveClass('scroll-section');
    expect(section).toHaveClass('scroll-section-structure');
  });

  it('should contain AnimatedBlock', () => {
    render(<ScrollSection description="Test description" />);

    const animatedBlock = screen.getByTestId('animated-block');
    expect(animatedBlock).toBeInTheDocument();
  });

  it('should pass threshold to AnimatedBlock', () => {
    render(<ScrollSection description="Test description" threshold={0.5} />);

    const animatedBlock = screen.getByTestId('animated-block');
    expect(animatedBlock).toBeInTheDocument();
  });

  it('should use default threshold of 0.7', () => {
    render(<ScrollSection description="Test description" />);

    const animatedBlock = screen.getByTestId('animated-block');
    expect(animatedBlock).toBeInTheDocument();
  });

  it('should render AnimatedBlock with fadeInUp animation', () => {
    render(<ScrollSection description="Test description" />);

    const animatedBlock = screen.getByTestId('animated-block');
    expect(animatedBlock).toHaveAttribute('data-animation', 'fadeInUp');
  });
});
