// ScrollSection - Component (components層)
// スクロール駆動アニメーション領域

import React from 'react';
import AnimatedBlock from './AnimatedBlock';

interface ScrollSectionProps {
  description: string;
  threshold?: number;
}

const ScrollSection: React.FC<ScrollSectionProps> = ({ description, threshold = 0.7 }) => {
  return (
    <section
      className="scroll-section scroll-section-structure"
      data-testid="scroll-section"
    >
      <AnimatedBlock animationType="fadeInUp" threshold={threshold}>
        <p className="scroll-section__description">{description}</p>
      </AnimatedBlock>
    </section>
  );
};

export default ScrollSection;
