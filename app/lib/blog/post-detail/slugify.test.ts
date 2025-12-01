// slugify.test.ts - 見出しテキストをURLセーフなスラグに変換するテスト

import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("英語テキストをスラグ化する", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("日本語テキストをそのまま使用する", () => {
    expect(slugify("はじめに")).toBe("はじめに");
  });

  it("混合テキスト（日本語+英語）を処理する", () => {
    expect(slugify("概要 Overview")).toBe("概要-overview");
  });

  it("特殊文字を除去する", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("連続スペースを単一ハイフンに変換する", () => {
    expect(slugify("Hello   World")).toBe("hello-world");
  });

  it("先頭・末尾のハイフンを除去する", () => {
    expect(slugify(" Hello World ")).toBe("hello-world");
  });

  it("空文字列を処理する", () => {
    expect(slugify("")).toBe("");
  });

  it("数字を含むテキストを処理する", () => {
    expect(slugify("Chapter 1")).toBe("chapter-1");
  });
});
