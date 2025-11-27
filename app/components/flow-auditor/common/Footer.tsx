// Footer - Container Component (components層)
// Footer container for RefreshButton and RetryButton

import React from 'react';
import RefreshButton from './RefreshButton';
import RetryButton from './RetryButton';

interface FooterProps {
  selectedCheckpointId: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  selectedCheckpointId,
  isRefreshing,
  onRefresh,
  onRetry,
}) => {
  return (
    <footer data-testid="footer-container" className="page-footer">
      <RefreshButton isLoading={isRefreshing} onRefresh={onRefresh} />
      <RetryButton
        isDisabled={selectedCheckpointId === null}
        onClick={onRetry}
      />
    </footer>
  );
};

export default Footer;
