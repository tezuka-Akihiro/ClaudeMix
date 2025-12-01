// Header - Container Component (components層)
// Header container for ServiceSelector, SectionSelector, and LastUpdatedLabel

import React from 'react';
import ServiceSelector from './ServiceSelector';
import { SectionSelector } from './SectionSelector';
import LastUpdatedLabel from './LastUpdatedLabel';

interface HeaderProps {
  services: string[];
  selectedService: string;
  sections: string[];
  selectedSection: string;
  lastUpdated: Date;
  onServiceChange: (serviceName: string) => void;
  onSectionChange: (sectionName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  services,
  selectedService,
  sections,
  selectedSection,
  lastUpdated,
  onServiceChange,
  onSectionChange,
}) => {
  return (
    <header data-testid="header-container" className="page-header">
      <div className="page-header-left">
        <ServiceSelector
          services={services}
          selectedService={selectedService}
          onChange={onServiceChange}
        />
        <SectionSelector
          sections={sections}
          selectedSection={selectedSection}
          onChange={onSectionChange}
          disabled={!selectedService}
        />
      </div>
      <LastUpdatedLabel lastUpdated={lastUpdated} />
    </header>
  );
};

export default Header;
