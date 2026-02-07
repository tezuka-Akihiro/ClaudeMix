// TableOfContents.test.tsx - 目次コンポーネントのテスト
// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TableOfContents } from "./TableOfContents";
import type { Heading } from "../../../lib/blog/post-detail/extractHeadings";

describe("TableOfContents", () => {
  const mockHeadings: Heading[] = [
    { level: 2, text: "はじめに", id: "はじめに" },
    { level: 2, text: "概要", id: "概要" },
    { level: 2, text: "まとめ", id: "まとめ" },
  ];
  const mockAriaLabel = '目次';

  it("目次コンテナが表示される", () => {
    render(<TableOfContents headings={mockHeadings} ariaLabel={mockAriaLabel} />);
    expect(screen.getByTestId("table-of-contents")).toBeInTheDocument();
    expect(screen.getByTestId("table-of-contents")).toHaveAttribute('aria-label', mockAriaLabel);
  });

  it("すべての見出しがリンクとして表示される", () => {
    render(<TableOfContents headings={mockHeadings} ariaLabel={mockAriaLabel} />);
    expect(screen.getByText("はじめに")).toBeInTheDocument();
    expect(screen.getByText("概要")).toBeInTheDocument();
    expect(screen.getByText("まとめ")).toBeInTheDocument();
  });

  it("リンクにhref属性が設定される", () => {
    render(<TableOfContents headings={mockHeadings} ariaLabel={mockAriaLabel} />);
    const link = screen.getByText("はじめに").closest("a");
    expect(link).toHaveAttribute("href", "#はじめに");
  });

  it("見出しがない場合はnullを返す", () => {
    const { container } = render(<TableOfContents headings={[]} ariaLabel={mockAriaLabel} />);
    expect(container.firstChild).toBeNull();
  });

  it("各アイテムにdata-testidが設定される", () => {
    render(<TableOfContents headings={mockHeadings} ariaLabel={mockAriaLabel} />);
    const items = screen.getAllByTestId("toc-item");
    expect(items).toHaveLength(3);
  });

  it("各リンクにdata-testidが設定される", () => {
    render(<TableOfContents headings={mockHeadings} ariaLabel={mockAriaLabel} />);
    const links = screen.getAllByTestId("toc-link");
    expect(links).toHaveLength(3);
  });

  it("h3/h4見出しは目次に表示されない（ペイウォール区切り用）", () => {
    const mixedHeadings: Heading[] = [
      { level: 2, text: "セクション1", id: "セクション1" },
      { level: 3, text: "サブセクション", id: "サブセクション" },
      { level: 4, text: "詳細", id: "詳細" },
      { level: 2, text: "セクション2", id: "セクション2" },
    ];
    render(<TableOfContents headings={mixedHeadings} ariaLabel={mockAriaLabel} />);

    // h2のみが表示される
    expect(screen.getByText("セクション1")).toBeInTheDocument();
    expect(screen.getByText("セクション2")).toBeInTheDocument();

    // h3/h4は表示されない
    expect(screen.queryByText("サブセクション")).not.toBeInTheDocument();
    expect(screen.queryByText("詳細")).not.toBeInTheDocument();

    // アイテム数は2（h2のみ）
    const items = screen.getAllByTestId("toc-item");
    expect(items).toHaveLength(2);
  });

  it("h2がなくh3/h4のみの場合はnullを返す", () => {
    const onlyH3H4: Heading[] = [
      { level: 3, text: "サブセクション", id: "サブセクション" },
      { level: 4, text: "詳細", id: "詳細" },
    ];
    const { container } = render(<TableOfContents headings={onlyH3H4} />);
    expect(container.firstChild).toBeNull();
  });
});
