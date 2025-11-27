// RetryButton - Button Component (components層)
// Button to trigger retry action

import React from 'react';

interface RetryButtonProps {
  isDisabled: boolean;
  onClick: () => void;
}

const RetryButton: React.FC<RetryButtonProps> = ({
  isDisabled,
  onClick,
}) => {
  return (
    <button
      type="button"
      data-testid="retry-button"
      disabled={isDisabled}
      onClick={onClick}
      className="button-secondary"
    >
      Retry
    </button>
  );
};

export default RetryButton;
