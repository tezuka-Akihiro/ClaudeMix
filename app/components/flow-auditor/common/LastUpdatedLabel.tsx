// LastUpdatedLabel - Label Component (components層)
// Displays last updated timestamp

import React from 'react';

interface LastUpdatedLabelProps {
  lastUpdated: Date;
}

const LastUpdatedLabel: React.FC<LastUpdatedLabelProps> = ({
  lastUpdated,
}) => {
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Within 1 minute
    if (diffInSeconds < 60) {
      return 'たった今';
    }

    // Format as HH:MM
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <span data-testid="last-updated-label" className="last-updated-label">
      last update: {formatTimestamp(lastUpdated)}
    </span>
  );
};

export default LastUpdatedLabel;
