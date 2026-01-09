import { describe, it, expect } from "vitest";
import { calculateLoadMore } from "./calculateLoadMore";

describe("calculateLoadMore", () => {
  describe("正常系", () => {
    it("6件読み込み済み、総記事数25件の場合、hasMoreがtrueを返すこと", () => {
      const result = calculateLoadMore(25, 6, 6);
      expect(result).toEqual({
        loadedCount: 6,
        totalPosts: 25,
        hasMore: true,
        postsPerLoad: 6,
      });
    });

    it("25件読み込み済み、総記事数25件の場合、hasMoreがfalseを返すこと", () => {
      const result = calculateLoadMore(25, 25, 6);
      expect(result).toEqual({
        loadedCount: 25,
        totalPosts: 25,
        hasMore: false,
        postsPerLoad: 6,
      });
    });

    it("12件読み込み済み、総記事数25件の場合、hasMoreがtrueを返すこと", () => {
      const result = calculateLoadMore(25, 12, 6);
      expect(result).toEqual({
        loadedCount: 12,
        totalPosts: 25,
        hasMore: true,
        postsPerLoad: 6,
      });
    });

    it("postsPerLoadを省略した場合、デフォルト値6を使用すること", () => {
      const result = calculateLoadMore(25, 6);
      expect(result.postsPerLoad).toBe(6);
      expect(result.hasMore).toBe(true);
    });
  });

  describe("境界値", () => {
    it("0件読み込み済み、総記事数0件の場合、hasMoreがfalseを返すこと", () => {
      const result = calculateLoadMore(0, 0, 6);
      expect(result).toEqual({
        loadedCount: 0,
        totalPosts: 0,
        hasMore: false,
        postsPerLoad: 6,
      });
    });

    it("0件読み込み済み、総記事数1件の場合、hasMoreがtrueを返すこと", () => {
      const result = calculateLoadMore(1, 0, 6);
      expect(result).toEqual({
        loadedCount: 0,
        totalPosts: 1,
        hasMore: true,
        postsPerLoad: 6,
      });
    });

    it("24件読み込み済み、総記事数25件の場合、hasMoreがtrueを返すこと", () => {
      const result = calculateLoadMore(25, 24, 6);
      expect(result.hasMore).toBe(true);
    });

    it("loadedCountとtotalPostsが同じ場合、hasMoreがfalseを返すこと", () => {
      const result = calculateLoadMore(100, 100, 6);
      expect(result.hasMore).toBe(false);
    });

    it("postsPerLoadが1の場合、正しく計算すること", () => {
      const result = calculateLoadMore(5, 3, 1);
      expect(result).toEqual({
        loadedCount: 3,
        totalPosts: 5,
        hasMore: true,
        postsPerLoad: 1,
      });
    });
  });

  describe("異常系", () => {
    it("totalPostsが負の数の場合、エラーをthrowすること", () => {
      expect(() => calculateLoadMore(-1, 0, 6)).toThrow(
        "totalPosts must be non-negative"
      );
    });

    it("loadedCountが負の数の場合、エラーをthrowすること", () => {
      expect(() => calculateLoadMore(25, -1, 6)).toThrow(
        "loadedCount must be non-negative"
      );
    });

    it("postsPerLoadが0以下の場合、エラーをthrowすること", () => {
      expect(() => calculateLoadMore(25, 6, 0)).toThrow(
        "postsPerLoad must be greater than 0"
      );
      expect(() => calculateLoadMore(25, 6, -1)).toThrow(
        "postsPerLoad must be greater than 0"
      );
    });

    it("整数でない値が渡された場合、エラーをthrowすること", () => {
      expect(() => calculateLoadMore(25.5, 6, 6)).toThrow(
        "All parameters must be integers"
      );
      expect(() => calculateLoadMore(25, 6.5, 6)).toThrow(
        "All parameters must be integers"
      );
      expect(() => calculateLoadMore(25, 6, 6.5)).toThrow(
        "All parameters must be integers"
      );
    });

    it("loadedCountがtotalPostsより大きい場合、エラーをthrowすること", () => {
      expect(() => calculateLoadMore(25, 30, 6)).toThrow(
        "loadedCount cannot be greater than totalPosts"
      );
    });
  });

  describe("大量データ", () => {
    it("大量の記事（1000件）でも正しく計算できること", () => {
      const result = calculateLoadMore(1000, 600, 6);
      expect(result).toEqual({
        loadedCount: 600,
        totalPosts: 1000,
        hasMore: true,
        postsPerLoad: 6,
      });
    });
  });
});
