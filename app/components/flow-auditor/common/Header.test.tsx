// Header.test.tsx - UI層: ユニットテスト
// ヘッダーコンテナのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

describe('Header', () => {
  const mockServices = ['flow-auditor', 'another-service'];
  const mockSections = ['common', 'design-flow', 'implementation-flow'];
  const mockLastUpdated = new Date('2025-11-10T15:30:00');
  const mockOnServiceChange = vi.fn();
  const mockOnSectionChange = vi.fn();

  describe('レンダリング', () => {
    it('header要素が正しく表示される', () => {
      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const header = screen.getByTestId('header-container');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('HEADER');
    });

    it('ServiceSelectorが表示される', () => {
      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const serviceSelector = screen.getByTestId('service-selector');
      expect(serviceSelector).toBeInTheDocument();
    });

    it('SectionSelectorが表示される', () => {
      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const sectionSelector = screen.getByTestId('section-selector');
      expect(sectionSelector).toBeInTheDocument();
    });

    it('LastUpdatedLabelが表示される', () => {
      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const lastUpdatedLabel = screen.getByTestId('last-updated-label');
      expect(lastUpdatedLabel).toBeInTheDocument();
    });

    it('正しいservicesとselectedServiceがServiceSelectorに渡される', () => {
      render(
        <Header
          services={mockServices}
          selectedService="another-service"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const serviceSelect = screen.getByTestId('service-selector') as HTMLSelectElement;
      expect(serviceSelect.value).toBe('another-service');

      const options = screen.getAllByRole('option');
      const serviceOptions = options.filter(opt =>
        opt.textContent === 'flow-auditor' || opt.textContent === 'another-service'
      );
      expect(serviceOptions).toHaveLength(2);
    });

    it('正しいsectionsとselectedSectionがSectionSelectorに渡される', () => {
      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="design-flow"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const sectionSelect = screen.getByTestId('section-selector') as HTMLSelectElement;
      expect(sectionSelect.value).toBe('design-flow');
    });
  });

  describe('インタラクション', () => {
    it('ServiceSelector変更時にonServiceChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleServiceChange = vi.fn();

      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={handleServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const serviceSelect = screen.getByTestId('service-selector');
      await user.selectOptions(serviceSelect, 'another-service');

      expect(handleServiceChange).toHaveBeenCalledTimes(1);
      expect(handleServiceChange).toHaveBeenCalledWith('another-service');
    });

    it('SectionSelector変更時にonSectionChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSectionChange = vi.fn();

      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={handleSectionChange}
        />
      );

      const sectionSelect = screen.getByTestId('section-selector');
      await user.selectOptions(sectionSelect, 'design-flow');

      expect(handleSectionChange).toHaveBeenCalledTimes(1);
      expect(handleSectionChange).toHaveBeenCalledWith('design-flow');
    });

    it('ServiceとSectionを両方変更してもそれぞれのハンドラが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleServiceChange = vi.fn();
      const handleSectionChange = vi.fn();

      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={handleServiceChange}
          onSectionChange={handleSectionChange}
        />
      );

      const serviceSelect = screen.getByTestId('service-selector');
      const sectionSelect = screen.getByTestId('section-selector');

      await user.selectOptions(serviceSelect, 'another-service');
      await user.selectOptions(sectionSelect, 'design-flow');

      expect(handleServiceChange).toHaveBeenCalledTimes(1);
      expect(handleSectionChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('レイアウト', () => {
    it('正しいCSSクラスが適用されている', () => {
      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const header = screen.getByTestId('header-container');
      expect(header).toHaveClass('page-header');

      const leftSection = header.querySelector('.page-header-left');
      expect(leftSection).toBeInTheDocument();
    });

    it('ServiceSelectorとSectionSelectorが左側のセクションに配置されている', () => {
      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const leftSection = screen.getByTestId('header-container').querySelector('.page-header-left');
      expect(leftSection).toBeInTheDocument();

      const serviceSelector = screen.getByTestId('service-selector');
      const sectionSelector = screen.getByTestId('section-selector');

      expect(leftSection).toContainElement(serviceSelector.closest('.select-container')!);
      expect(leftSection).toContainElement(sectionSelector.closest('.select-container')!);
    });

    it('LastUpdatedLabelがヘッダーに配置されている', () => {
      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const header = screen.getByTestId('header-container');
      const lastUpdatedLabel = screen.getByTestId('last-updated-label');

      expect(header).toContainElement(lastUpdatedLabel);
    });
  });

  describe('エッジケース', () => {
    it('空のservices配列でもエラーが発生しない', () => {
      render(
        <Header
          services={[]}
          selectedService=""
          sections={mockSections}
          selectedSection="common"
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const header = screen.getByTestId('header-container');
      expect(header).toBeInTheDocument();
    });

    it('空のsections配列でもエラーが発生しない', () => {
      render(
        <Header
          services={mockServices}
          selectedService="flow-auditor"
          sections={[]}
          selectedSection=""
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const header = screen.getByTestId('header-container');
      expect(header).toBeInTheDocument();
    });

    it('すべての配列が空でもエラーが発生しない', () => {
      render(
        <Header
          services={[]}
          selectedService=""
          sections={[]}
          selectedSection=""
          lastUpdated={mockLastUpdated}
          onServiceChange={mockOnServiceChange}
          onSectionChange={mockOnSectionChange}
        />
      );

      const header = screen.getByTestId('header-container');
      expect(header).toBeInTheDocument();
    });
  });
});
