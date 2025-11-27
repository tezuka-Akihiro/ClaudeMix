// ServiceSelector.test.tsx - UI層: ユニットテスト
// サービス選択ドロップダウンのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceSelector from './ServiceSelector';

describe('ServiceSelector', () => {
  const mockServices = ['flow-auditor', 'another-service', 'test-service'];
  const mockOnChange = vi.fn();

  describe('レンダリング', () => {
    it('ラベルとドロップダウンが正しく表示される', () => {
      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={mockOnChange}
        />
      );

      const label = screen.getByText('サービス:');
      const select = screen.getByTestId('service-selector');

      expect(label).toBeInTheDocument();
      expect(select).toBeInTheDocument();
    });

    it('servicesからoption要素が生成される', () => {
      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('flow-auditor');
      expect(options[1]).toHaveTextContent('another-service');
      expect(options[2]).toHaveTextContent('test-service');
    });

    it('selectedServiceが正しく選択されている', () => {
      render(
        <ServiceSelector
          services={mockServices}
          selectedService="another-service"
          onChange={mockOnChange}
        />
      );

      const select = screen.getByTestId('service-selector') as HTMLSelectElement;
      expect(select.value).toBe('another-service');
    });

    it('空のservices配列でもエラーが発生しない', () => {
      render(
        <ServiceSelector
          services={[]}
          selectedService=""
          onChange={mockOnChange}
        />
      );

      const select = screen.getByTestId('service-selector');
      expect(select).toBeInTheDocument();

      const options = screen.queryAllByRole('option');
      expect(options).toHaveLength(0);
    });

    it('単一のサービスのみでも正しく表示される', () => {
      render(
        <ServiceSelector
          services={['only-service']}
          selectedService="only-service"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('only-service');
    });
  });

  describe('インタラクション', () => {
    it('サービス選択時にonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={handleChange}
        />
      );

      const select = screen.getByTestId('service-selector');
      await user.selectOptions(select, 'another-service');

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith('another-service');
    });

    it('複数回の選択でonChangeが複数回呼ばれる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={handleChange}
        />
      );

      const select = screen.getByTestId('service-selector');

      await user.selectOptions(select, 'another-service');
      await user.selectOptions(select, 'test-service');

      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange).toHaveBeenNthCalledWith(1, 'another-service');
      expect(handleChange).toHaveBeenNthCalledWith(2, 'test-service');
    });

    it('同じサービスを選択してもonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={handleChange}
        />
      );

      const select = screen.getByTestId('service-selector');
      await user.selectOptions(select, 'flow-auditor');

      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('アクセシビリティ', () => {
    it('select要素がlabel要素と正しく関連付けられている', () => {
      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={mockOnChange}
        />
      );

      const label = screen.getByText('サービス:') as HTMLLabelElement;
      const select = screen.getByTestId('service-selector');

      expect(label).toBeInTheDocument();
      expect(label.htmlFor).toBe('service-selector');
      expect(select.id).toBe('service-selector');
    });

    it('getByRole("combobox")で取得できる', () => {
      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('option要素がvalue属性を持つ', () => {
      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option') as HTMLOptionElement[];
      expect(options[0].value).toBe('flow-auditor');
      expect(options[1].value).toBe('another-service');
      expect(options[2].value).toBe('test-service');
    });
  });

  describe('スタイリング', () => {
    it('正しいCSSクラスが適用されている', () => {
      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={mockOnChange}
        />
      );

      const container = screen.getByTestId('service-selector').parentElement;
      const label = screen.getByText('サービス:');
      const select = screen.getByTestId('service-selector');

      expect(container).toHaveClass('select-container');
      expect(label).toHaveClass('select-label');
      expect(select).toHaveClass('select-input');
    });

    it('option要素に正しいクラスが適用されている', () => {
      render(
        <ServiceSelector
          services={mockServices}
          selectedService="flow-auditor"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      options.forEach(option => {
        expect(option).toHaveClass('select-option');
      });
    });
  });

  describe('エッジケース', () => {
    it('特殊文字を含むサービス名も正しく表示される', () => {
      const specialServices = ['service-with-dash', 'service_with_underscore', 'service123'];

      render(
        <ServiceSelector
          services={specialServices}
          selectedService="service-with-dash"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent('service-with-dash');
      expect(options[1]).toHaveTextContent('service_with_underscore');
      expect(options[2]).toHaveTextContent('service123');
    });

    it('日本語を含むサービス名も正しく表示される', () => {
      const japaneseServices = ['フローオーディター', 'テストサービス'];

      render(
        <ServiceSelector
          services={japaneseServices}
          selectedService="フローオーディター"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent('フローオーディター');
      expect(options[1]).toHaveTextContent('テストサービス');
    });
  });
});
