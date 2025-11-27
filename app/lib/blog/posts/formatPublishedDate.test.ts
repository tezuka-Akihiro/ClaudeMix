import { describe, it, expect } from "vitest";
import { formatPublishedDate } from "./formatPublishedDate";

describe("formatPublishedDate", () => {
  describe("正常系", () => {
    it("ISO形式（YYYY-MM-DD）を日本語形式（YYYY年M月D日）に変換できること", () => {
      expect(formatPublishedDate("2024-05-01")).toBe("2024年5月1日");
      expect(formatPublishedDate("2024-12-25")).toBe("2024年12月25日");
      expect(formatPublishedDate("2024-03-20")).toBe("2024年3月20日");
    });
  });

  describe("境界値", () => {
    it("1月1日の変換が正しいこと", () => {
      expect(formatPublishedDate("2024-01-01")).toBe("2024年1月1日");
    });

    it("12月31日の変換が正しいこと", () => {
      expect(formatPublishedDate("2024-12-31")).toBe("2024年12月31日");
    });

    it("うるう年の2月29日の変換が正しいこと", () => {
      expect(formatPublishedDate("2024-02-29")).toBe("2024年2月29日");
    });
  });

  describe("異常系", () => {
    it("不正な日付文字列の場合、エラーをthrowすること", () => {
      expect(() => formatPublishedDate("invalid-date")).toThrow(
        "Invalid date format"
      );
    });

    it("空文字列の場合、エラーをthrowすること", () => {
      expect(() => formatPublishedDate("")).toThrow("Invalid date format");
    });

    it("存在しない日付（13月）の場合、エラーをthrowすること", () => {
      expect(() => formatPublishedDate("2024-13-01")).toThrow(
        "Invalid date format"
      );
    });

    it("存在しない日付（32日）の場合、エラーをthrowすること", () => {
      expect(() => formatPublishedDate("2024-01-32")).toThrow(
        "Invalid date format"
      );
    });

    it("不正なフォーマット（スラッシュ区切り）の場合、エラーをthrowすること", () => {
      expect(() => formatPublishedDate("2024/05/01")).toThrow(
        "Invalid date format"
      );
    });
  });
});
