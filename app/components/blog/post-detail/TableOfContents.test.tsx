// TableOfContents.test.tsx - 目次コンポーネントのテスト
// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TableOfContents } from "./TableOfContents";
import type { Heading } from "../../../lib/blog/post-detail/extractHeadings";

describe("TableOfContents", () => {
  const mockHeadings: Heading[] = [
    { level: 2, text: "はじめに", id: "はじめに" },
    { level: 3, text: "概要", id: "概要" },
    { level: 2, text: "まとめ", id: "まとめ" },
  ];

  it("目次コンテナが表示される", () => {
    render(<TableOfContents headings={mockHeadings} />);
    expect(screen.getByTestId("table-of-contents")).toBeInTheDocument();
  });

  it("目次タイトル「目次」が表示される", () => {
    render(<TableOfContents headings={mockHeadings} />);
    expect(screen.getByText("目次")).toBeInTheDocument();
  });

  it("すべての見出しがリンクとして表示される", () => {
    render(<TableOfContents headings={mockHeadings} />);
    expect(screen.getByText("はじめに")).toBeInTheDocument();
    expect(screen.getByText("概要")).toBeInTheDocument();
    expect(screen.getByText("まとめ")).toBeInTheDocument();
  });

  it("リンクにhref属性が設定される", () => {
    render(<TableOfContents headings={mockHeadings} />);
    const link = screen.getByText("はじめに").closest("a");
    expect(link).toHaveAttribute("href", "#はじめに");
  });

  it("見出しがない場合はnullを返す", () => {
    const { container } = render(<TableOfContents headings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("各アイテムにdata-testidが設定される", () => {
    render(<TableOfContents headings={mockHeadings} />);
    const items = screen.getAllByTestId("toc-item");
    expect(items).toHaveLength(3);
  });

  it("各リンクにdata-testidが設定される", () => {
    render(<TableOfContents headings={mockHeadings} />);
    const links = screen.getAllByTestId("toc-link");
    expect(links).toHaveLength(3);
  });
});
