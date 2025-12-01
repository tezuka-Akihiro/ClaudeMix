// ServiceSelector - Dropdown Component (components層)
// Dropdown for selecting service from project.toml

import React from 'react';

interface ServiceSelectorProps {
  services: string[];
  selectedService: string;
  onChange: (serviceName: string) => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedService,
  onChange,
}) => {
  return (
    <div className="select-container">
      <label
        htmlFor="service-selector"
        className="select-label"
      >
        サービス:
      </label>
      <select
        id="service-selector"
        data-testid="service-selector"
        value={selectedService}
        onChange={(e) => onChange(e.target.value)}
        className="select-input"
      >
        {services.map((service) => (
          <option
            key={service}
            value={service}
            className="select-option"
          >
            {service}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ServiceSelector;
