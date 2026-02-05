import { FormStrategy } from "remix-auth-form";
import { getUserByEmail } from "../getUserByEmail.server";
import { verifyPassword } from "../verifyPassword.server";
import type { AppLoadContext } from "@remix-run/cloudflare";
import type { User } from "../mappers/authMapper.server";

interface Env {
  DB: D1Database;
}

export function getFormStrategy(context: AppLoadContext) {
  const env = context.env as Env;

  return new FormStrategy(async ({ form }) => {
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    if (!email || !password) {
      throw new Error("Missing credentials");
    }

    const user = await getUserByEmail(email, context as any);
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await verifyPassword(password, (user as any).password_hash || (user as any).passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    // Map to internal User type
    return {
      id: user.id,
      email: user.email,
      subscriptionStatus: user.subscription_status || (user as any).subscriptionStatus || "inactive",
    } as User;
  });
}
