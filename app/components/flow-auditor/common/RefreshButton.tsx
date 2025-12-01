// RefreshButton - Button Component (components層)
// Button to refresh progress data

import React from 'react';

interface RefreshButtonProps {
  isLoading: boolean;
  onRefresh: () => void;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  isLoading,
  onRefresh,
}) => {
  return (
    <button
      type="button"
      data-testid="refresh-button"
      disabled={isLoading}
      onClick={onRefresh}
      className="button-primary"
    >
      {isLoading ? 'Loading...' : 'Refresh'}
    </button>
  );
};

export default RefreshButton;
