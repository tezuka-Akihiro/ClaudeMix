/**
 * セッション管理の型定義
 * ボイラープレート基盤機能
 */

export interface User {
  id: string;
  name: string;
  role?: "admin" | "user"; // 将来拡張用
}

export interface SessionData {
  user: User | null;
  status: "authenticated" | "unauthenticated" | "loading";
}
