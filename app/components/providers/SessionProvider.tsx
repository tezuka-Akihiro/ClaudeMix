/**
 * セッション管理用React Context Provider
 * ボイラープレート基盤機能
 */

import { createContext, useContext } from "react";
import type { SessionData } from "~/lib/session/session.types";

const SessionContext = createContext<SessionData | null>(null);

export function SessionProvider({
  children,
  sessionData,
}: {
  children: React.ReactNode;
  sessionData: SessionData;
}) {
  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * セッション情報を取得するカスタムフック
 * SessionProvider内でのみ使用可能
 */
export function useSession(): SessionData {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
