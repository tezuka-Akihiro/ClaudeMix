// SectionSelector.test.tsx - UI層: ユニットテスト
// セクション選択ドロップダウンのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SectionSelector from './SectionSelector';

describe('SectionSelector', () => {
  const mockSections = ['common', 'design-flow', 'implementation-flow'];
  const mockOnChange = vi.fn();

  describe('レンダリング', () => {
    it('ラベルとドロップダウンが正しく表示される', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
        />
      );

      const label = screen.getByText('セクション:');
      const select = screen.getByTestId('section-selector');

      expect(label).toBeInTheDocument();
      expect(select).toBeInTheDocument();
    });

    it('sectionsからoption要素が生成される', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('common');
      expect(options[1]).toHaveTextContent('design-flow');
      expect(options[2]).toHaveTextContent('implementation-flow');
    });

    it('selectedSectionが正しく選択されている', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="design-flow"
          onChange={mockOnChange}
        />
      );

      const select = screen.getByTestId('section-selector') as HTMLSelectElement;
      expect(select.value).toBe('design-flow');
    });

    it('空のsections配列でもエラーが発生しない', () => {
      render(
        <SectionSelector
          sections={[]}
          selectedSection=""
          onChange={mockOnChange}
        />
      );

      const select = screen.getByTestId('section-selector');
      expect(select).toBeInTheDocument();

      const options = screen.queryAllByRole('option');
      expect(options).toHaveLength(0);
    });

    it('単一のセクションのみでも正しく表示される', () => {
      render(
        <SectionSelector
          sections={['only-section']}
          selectedSection="only-section"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('only-section');
    });
  });

  describe('インタラクション', () => {
    it('セクション選択時にonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={handleChange}
        />
      );

      const select = screen.getByTestId('section-selector');
      await user.selectOptions(select, 'design-flow');

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith('design-flow');
    });

    it('複数回の選択でonChangeが複数回呼ばれる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={handleChange}
        />
      );

      const select = screen.getByTestId('section-selector');

      await user.selectOptions(select, 'design-flow');
      await user.selectOptions(select, 'implementation-flow');

      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange).toHaveBeenNthCalledWith(1, 'design-flow');
      expect(handleChange).toHaveBeenNthCalledWith(2, 'implementation-flow');
    });
  });

  describe('無効化状態', () => {
    it('disabled=trueの場合、selectが無効化される', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const select = screen.getByTestId('section-selector');
      expect(select).toBeDisabled();
    });

    it('disabled=falseの場合、selectが有効化される', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
          disabled={false}
        />
      );

      const select = screen.getByTestId('section-selector');
      expect(select).not.toBeDisabled();
    });

    it('disabledが指定されていない場合、selectが有効化される（デフォルト）', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
        />
      );

      const select = screen.getByTestId('section-selector');
      expect(select).not.toBeDisabled();
    });

    it('sections配列が空の場合、自動的に無効化される', () => {
      render(
        <SectionSelector
          sections={[]}
          selectedSection=""
          onChange={mockOnChange}
        />
      );

      const select = screen.getByTestId('section-selector');
      expect(select).toBeDisabled();
    });

    it('disabled=trueかつsections配列が空の場合も無効化される', () => {
      render(
        <SectionSelector
          sections={[]}
          selectedSection=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const select = screen.getByTestId('section-selector');
      expect(select).toBeDisabled();
    });

    it('無効化状態ではonChangeが呼ばれない', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={handleChange}
          disabled={true}
        />
      );

      const select = screen.getByTestId('section-selector');

      // 無効化されているため、selectOptionsは機能しない
      try {
        await user.selectOptions(select, 'design-flow');
      } catch (e) {
        // エラーが発生する可能性があるが、onChangeは呼ばれないことを確認
      }

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('select要素がlabel要素と正しく関連付けられている', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
        />
      );

      const label = screen.getByText('セクション:') as HTMLLabelElement;
      const select = screen.getByTestId('section-selector');

      expect(label).toBeInTheDocument();
      expect(label.htmlFor).toBe('section-selector');
      expect(select.id).toBe('section-selector');
    });

    it('aria-label属性が設定されている', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
        />
      );

      const label = screen.getByLabelText('セクション選択');
      expect(label).toBeInTheDocument();
    });

    it('getByRole("combobox")で取得できる', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('option要素がvalue属性を持つ', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option') as HTMLOptionElement[];
      expect(options[0].value).toBe('common');
      expect(options[1].value).toBe('design-flow');
      expect(options[2].value).toBe('implementation-flow');
    });
  });

  describe('スタイリング', () => {
    it('正しいCSSクラスが適用されている', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
          onChange={mockOnChange}
        />
      );

      const container = screen.getByTestId('section-selector').parentElement;
      const label = screen.getByText('セクション:');
      const select = screen.getByTestId('section-selector');

      expect(container).toHaveClass('select-container');
      expect(label).toHaveClass('select-label');
      expect(select).toHaveClass('select-input');
    });

    it('option要素に正しいクラスが適用されている', () => {
      render(
        <SectionSelector
          sections={mockSections}
          selectedSection="common"
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
    it('特殊文字を含むセクション名も正しく表示される', () => {
      const specialSections = ['section-with-dash', 'section_with_underscore', 'section123'];

      render(
        <SectionSelector
          sections={specialSections}
          selectedSection="section-with-dash"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent('section-with-dash');
      expect(options[1]).toHaveTextContent('section_with_underscore');
      expect(options[2]).toHaveTextContent('section123');
    });

    it('日本語を含むセクション名も正しく表示される', () => {
      const japaneseSections = ['共通コンポーネント', '設計フロー', '実装フロー'];

      render(
        <SectionSelector
          sections={japaneseSections}
          selectedSection="共通コンポーネント"
          onChange={mockOnChange}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent('共通コンポーネント');
      expect(options[1]).toHaveTextContent('設計フロー');
      expect(options[2]).toHaveTextContent('実装フロー');
    });
  });
});
