// extractHeadings.test.ts - マークダウンから見出しを抽出するテスト
// 階層定義: develop/blog/post-detail/func-spec.md の「目次階層の定義」参照

import { describe, it, expect } from "vitest";
import { extractHeadings, type Heading } from "./extractHeadings";

describe("extractHeadings", () => {
  it("h2見出しを抽出する", () => {
    const markdown = "## はじめに\n\n本文";
    const result = extractHeadings(markdown);
    expect(result).toEqual([
      { level: 2, text: "はじめに", id: "はじめに" },
    ]);
  });

  it("h3見出しは除外する（目次は1階層のみ）", () => {
    const markdown = "## セクション\n\n### サブセクション\n\n本文";
    const result = extractHeadings(markdown);
    expect(result).toEqual([{ level: 2, text: "セクション", id: "セクション" }]);
  });

  it("h1見出しは除外する（タイトル用）", () => {
    const markdown = "# タイトル\n\n## セクション\n\n本文";
    const result = extractHeadings(markdown);
    expect(result).toEqual([
      { level: 2, text: "セクション", id: "セクション" },
    ]);
  });

  it("複数の見出しを順序通り抽出する", () => {
    const markdown = `## 概要

### 詳細1

### 詳細2

## まとめ`;
    const result = extractHeadings(markdown);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("概要");
    expect(result[1].text).toBe("まとめ");
  });

  it("見出しがない場合は空配列を返す", () => {
    const markdown = "本文のみ";
    const result = extractHeadings(markdown);
    expect(result).toEqual([]);
  });

  it("英語見出しのIDはlowercaseハイフン区切りになる", () => {
    const markdown = "## Getting Started\n\n本文";
    const result = extractHeadings(markdown);
    expect(result[0].id).toBe("getting-started");
  });

  it("コードブロック内の見出しは除外する", () => {
    const markdown = `## 本物の見出し

\`\`\`markdown
## コードブロック内の見出し
### これも除外
\`\`\`

## もう一つの本物の見出し`;
    const result = extractHeadings(markdown);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("本物の見出し");
    expect(result[1].text).toBe("もう一つの本物の見出し");
  });

  it("複数のコードブロックがある場合も正しく除外する", () => {
    const markdown = `## セクション1

\`\`\`html
<!-- 現状の出力 -->
<h2>セクション1</h2>
<h2>セクション2</h2>
\`\`\`

## セクション2

\`\`\`javascript
// ## これはコメント内の見出し
const code = "## これも文字列内の見出し";
\`\`\`

## セクション3`;
    const result = extractHeadings(markdown);
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe("セクション1");
    expect(result[1].text).toBe("セクション2");
    expect(result[2].text).toBe("セクション3");
  });

  it("インラインコード内の見出しは影響しない（ブロックのみ除外）", () => {
    const markdown = "## 本物の見出し\n\n本文に`## インラインコード`が含まれる";
    const result = extractHeadings(markdown);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("本物の見出し");
  });

  describe("改行コード対応（CRLF/LF）", () => {
    it("CRLF改行コードのマークダウンから見出しを抽出する", () => {
      // Windows環境のファイルを模擬（CRLF）
      const markdown = "## 見出し1\r\n\r\n本文\r\n\r\n## 見出し2\r\n";
      const result = extractHeadings(markdown);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe("見出し1");
      expect(result[1].text).toBe("見出し2");
    });

    it("CRLFとLFが混在するマークダウンから見出しを抽出する", () => {
      // 混在環境を模擬
      const markdown = "## 見出し1\r\n\r\n本文\n\n## 見出し2\n";
      const result = extractHeadings(markdown);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe("見出し1");
      expect(result[1].text).toBe("見出し2");
    });

    it("CRLF環境でコードブロック内の見出しを除外する", () => {
      const markdown = "## 本物の見出し\r\n\r\n```markdown\r\n## コードブロック内\r\n```\r\n\r\n## もう一つの本物\r\n";
      const result = extractHeadings(markdown);
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe("本物の見出し");
      expect(result[1].text).toBe("もう一つの本物");
    });
  });
});
