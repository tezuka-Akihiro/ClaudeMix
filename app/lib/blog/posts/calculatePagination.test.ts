import { describe, it, expect } from "vitest";
import { calculatePagination } from "./calculatePagination";

describe("calculatePagination", () => {
  describe("正常系", () => {
    it("総記事数25件、1ページ目、10件/ページの場合、正しいページネーション情報を返すこと", () => {
      const result = calculatePagination(25, 1, 10);
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 3,
        totalPosts: 25,
        postsPerPage: 10,
        offset: 0,
      });
    });

    it("総記事数25件、2ページ目、10件/ページの場合、正しいoffsetを計算すること", () => {
      const result = calculatePagination(25, 2, 10);
      expect(result).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalPosts: 25,
        postsPerPage: 10,
        offset: 10,
      });
    });

    it("総記事数25件、3ページ目、10件/ページの場合、正しいoffsetを計算すること", () => {
      const result = calculatePagination(25, 3, 10);
      expect(result).toEqual({
        currentPage: 3,
        totalPages: 3,
        totalPosts: 25,
        postsPerPage: 10,
        offset: 20,
      });
    });

    it("postsPerPageを省略した場合、デフォルト値を使用すること", () => {
      const result = calculatePagination(25, 1);
      expect(result.postsPerPage).toBe(10);
      expect(result.totalPages).toBe(3);
    });
  });

  describe("境界値", () => {
    it("総記事数0件の場合、totalPagesを1として返すこと", () => {
      const result = calculatePagination(0, 1, 10);
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalPosts: 0,
        postsPerPage: 10,
        offset: 0,
      });
    });

    it("総記事数がpostsPerPageで割り切れる場合、正しいページ数を計算すること", () => {
      const result = calculatePagination(30, 1, 10);
      expect(result.totalPages).toBe(3);
    });

    it("総記事数がpostsPerPageで割り切れない場合、切り上げたページ数を計算すること", () => {
      const result = calculatePagination(31, 1, 10);
      expect(result.totalPages).toBe(4);
    });

    it("総記事数1件の場合、totalPagesを1として返すこと", () => {
      const result = calculatePagination(1, 1, 10);
      expect(result.totalPages).toBe(1);
    });

    it("1ページあたり1件の場合、正しく計算すること", () => {
      const result = calculatePagination(5, 3, 1);
      expect(result).toEqual({
        currentPage: 3,
        totalPages: 5,
        totalPosts: 5,
        postsPerPage: 1,
        offset: 2,
      });
    });
  });

  describe("異常系", () => {
    it("totalPostsが負の数の場合、エラーをthrowすること", () => {
      expect(() => calculatePagination(-1, 1, 10)).toThrow(
        "totalPosts must be non-negative"
      );
    });

    it("currentPageが0以下の場合、エラーをthrowすること", () => {
      expect(() => calculatePagination(25, 0, 10)).toThrow(
        "currentPage must be greater than 0"
      );
      expect(() => calculatePagination(25, -1, 10)).toThrow(
        "currentPage must be greater than 0"
      );
    });

    it("postsPerPageが0以下の場合、エラーをthrowすること", () => {
      expect(() => calculatePagination(25, 1, 0)).toThrow(
        "postsPerPage must be greater than 0"
      );
      expect(() => calculatePagination(25, 1, -1)).toThrow(
        "postsPerPage must be greater than 0"
      );
    });

    it("整数でない値が渡された場合、エラーをthrowすること", () => {
      expect(() => calculatePagination(25.5, 1, 10)).toThrow(
        "All parameters must be integers"
      );
      expect(() => calculatePagination(25, 1.5, 10)).toThrow(
        "All parameters must be integers"
      );
      expect(() => calculatePagination(25, 1, 10.5)).toThrow(
        "All parameters must be integers"
      );
    });
  });

  describe("大量データ", () => {
    it("大量の記事（1000件）でも正しく計算できること", () => {
      const result = calculatePagination(1000, 50, 10);
      expect(result).toEqual({
        currentPage: 50,
        totalPages: 100,
        totalPosts: 1000,
        postsPerPage: 10,
        offset: 490,
      });
    });
  });
});
