import { GoogleStrategy } from "remix-auth-google";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { mapGoogleProfileToUser } from "../mappers/authMapper.server";

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

export function getGoogleStrategy(context: AppLoadContext) {
  const env = context.env as Env;

  return new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "dummy",
      callbackURL: "/auth/callback/google",
    },
    async ({ profile }) => {
      return mapGoogleProfileToUser(profile);
    }
  );
}
