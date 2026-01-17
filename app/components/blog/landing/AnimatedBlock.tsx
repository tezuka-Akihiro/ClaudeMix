// AnimatedBlock - Component (components層)
// スクロールアニメーション対応ブロックコンポーネント

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedBlockProps {
  children: React.ReactNode;
  animationType?: 'fadeInUp' | 'slideIn' | 'scale';
  threshold?: number;
}

const AnimatedBlock: React.FC<AnimatedBlockProps> = ({
  children,
  animationType = 'fadeInUp',
  threshold = 0.7,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, stop observing
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    if (blockRef.current) {
      observer.observe(blockRef.current);
    }

    return () => {
      if (blockRef.current) {
        observer.unobserve(blockRef.current);
      }
    };
  }, [threshold]);

  return (
    <div
      ref={blockRef}
      className={`animated-block ${isVisible ? 'visible' : ''}`}
      data-testid="animated-block"
      data-animation={animationType}
    >
      {children}
    </div>
  );
};

export default AnimatedBlock;
