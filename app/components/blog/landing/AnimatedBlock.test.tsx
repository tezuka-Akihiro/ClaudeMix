import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedBlock from './AnimatedBlock';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

describe('AnimatedBlock', () => {
  beforeEach(() => {
    // Reset IntersectionObserver mock
    global.IntersectionObserver = MockIntersectionObserver as any;
  });

  it('should render children', () => {
    render(
      <AnimatedBlock>
        <p>Test Content</p>
      </AnimatedBlock>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render with animated-block class', () => {
    render(
      <AnimatedBlock>
        <p>Test Content</p>
      </AnimatedBlock>
    );

    const block = screen.getByTestId('animated-block');
    expect(block).toHaveClass('animated-block');
  });

  it('should have default fadeInUp animation type', () => {
    render(
      <AnimatedBlock>
        <p>Test Content</p>
      </AnimatedBlock>
    );

    const block = screen.getByTestId('animated-block');
    expect(block).toHaveAttribute('data-animation', 'fadeInUp');
  });

  it('should accept custom animation type', () => {
    render(
      <AnimatedBlock animationType="slideIn">
        <p>Test Content</p>
      </AnimatedBlock>
    );

    const block = screen.getByTestId('animated-block');
    expect(block).toHaveAttribute('data-animation', 'slideIn');
  });

  it('should accept scale animation type', () => {
    render(
      <AnimatedBlock animationType="scale">
        <p>Test Content</p>
      </AnimatedBlock>
    );

    const block = screen.getByTestId('animated-block');
    expect(block).toHaveAttribute('data-animation', 'scale');
  });

  it('should render without errors when IntersectionObserver is available', () => {
    render(
      <AnimatedBlock>
        <p>Test Content</p>
      </AnimatedBlock>
    );

    const block = screen.getByTestId('animated-block');
    expect(block).toBeInTheDocument();
  });

  it('should start without visible class', () => {
    render(
      <AnimatedBlock>
        <p>Test Content</p>
      </AnimatedBlock>
    );

    const block = screen.getByTestId('animated-block');
    expect(block).not.toHaveClass('visible');
  });
});
