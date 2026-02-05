import { createWorkersKVSessionStorage } from "@remix-run/cloudflare";
import type { AppLoadContext, SessionStorage } from "@remix-run/cloudflare";

interface Env {
  SESSION_KV: KVNamespace;
  SESSION_SECRET?: string;
}

export function getSessionStorage(context: AppLoadContext): SessionStorage {
  const env = context.env as Env;

  if (!env.SESSION_KV) {
    throw new Error("SESSION_KV is not defined in AppLoadContext");
  }

  return createWorkersKVSessionStorage({
    kv: env.SESSION_KV,
    cookie: {
      name: "__session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [env.SESSION_SECRET || "s3cr3t"],
      secure: true,
    },
  });
}
