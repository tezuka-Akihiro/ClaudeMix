// GroupHeader.test.tsx - UI層: ユニットテスト
// グループヘッダーのテスト

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GroupHeader from './GroupHeader';

describe('GroupHeader', () => {
  describe('レンダリング', () => {
    it('div要素が正しく表示される', () => {
      render(<GroupHeader name="app/components" />);

      const header = screen.getByTestId('group-header');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('DIV');
    });

    it('正しいCSSクラスが適用されている', () => {
      render(<GroupHeader name="app/components" />);

      const header = screen.getByTestId('group-header');
      expect(header).toHaveClass('group-header');
    });

    it('nameプロパティのテキストが表示される', () => {
      render(<GroupHeader name="app/components" />);

      const header = screen.getByTestId('group-header');
      expect(header).toHaveTextContent('app/components');
    });
  });

  describe('異なるグループ名', () => {
    it('"app/lib" が正しく表示される', () => {
      render(<GroupHeader name="app/lib" />);

      const header = screen.getByTestId('group-header');
      expect(header).toHaveTextContent('app/lib');
    });

    it('"app/data-io" が正しく表示される', () => {
      render(<GroupHeader name="app/data-io" />);

      const header = screen.getByTestId('group-header');
      expect(header).toHaveTextContent('app/data-io');
    });

    it('"tests/e2e" が正しく表示される', () => {
      render(<GroupHeader name="tests/e2e" />);

      const header = screen.getByTestId('group-header');
      expect(header).toHaveTextContent('tests/e2e');
    });
  });

  describe('エッジケース', () => {
    it('空文字列が渡されても表示される', () => {
      render(<GroupHeader name="" />);

      const header = screen.getByTestId('group-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('');
    });

    it('長いグループ名も正しく表示される', () => {
      const longName = 'app/very/long/path/to/components/that/might/wrap';
      render(<GroupHeader name={longName} />);

      const header = screen.getByTestId('group-header');
      expect(header).toHaveTextContent(longName);
    });

    it('特殊文字を含むグループ名も正しく表示される', () => {
      const specialName = 'app/components-v2.0';
      render(<GroupHeader name={specialName} />);

      const header = screen.getByTestId('group-header');
      expect(header).toHaveTextContent(specialName);
    });

    it('日本語を含むグループ名も正しく表示される', () => {
      const japaneseName = 'アプリ/コンポーネント';
      render(<GroupHeader name={japaneseName} />);

      const header = screen.getByTestId('group-header');
      expect(header).toHaveTextContent(japaneseName);
    });
  });

  describe('プロパティの変更', () => {
    it('nameプロパティが更新されると表示も更新される', () => {
      const { rerender } = render(<GroupHeader name="app/components" />);

      expect(screen.getByTestId('group-header')).toHaveTextContent('app/components');

      rerender(<GroupHeader name="app/lib" />);

      expect(screen.getByTestId('group-header')).toHaveTextContent('app/lib');
    });

    it('複数回のプロパティ変更が正しく反映される', () => {
      const { rerender } = render(<GroupHeader name="group1" />);

      expect(screen.getByTestId('group-header')).toHaveTextContent('group1');

      rerender(<GroupHeader name="group2" />);
      expect(screen.getByTestId('group-header')).toHaveTextContent('group2');

      rerender(<GroupHeader name="group3" />);
      expect(screen.getByTestId('group-header')).toHaveTextContent('group3');
    });
  });

  describe('アクセシビリティ', () => {
    it('getByTextでグループ名を取得できる', () => {
      render(<GroupHeader name="app/components" />);

      const header = screen.getByText('app/components');
      expect(header).toBeInTheDocument();
    });

    it('data-testid属性が正しく設定されている', () => {
      render(<GroupHeader name="app/components" />);

      const header = screen.getByTestId('group-header');
      expect(header).toHaveAttribute('data-testid', 'group-header');
    });
  });

  describe('表示の一貫性', () => {
    it('同じnameで複数回レンダリングしても同じ表示になる', () => {
      const { rerender } = render(<GroupHeader name="app/components" />);
      const text1 = screen.getByTestId('group-header').textContent;

      rerender(<GroupHeader name="app/components" />);
      const text2 = screen.getByTestId('group-header').textContent;

      expect(text1).toBe(text2);
    });
  });
});
