import { Authenticator } from "remix-auth";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { getSessionStorage } from "./session.server";
import type { User } from "../authentication/mappers/authMapper.server";
import { getFormStrategy } from "../authentication/strategies/form.server";
import { getGoogleStrategy } from "../authentication/strategies/google.server";

let _authenticator: Authenticator<User>;

export function getAuthenticator(context: AppLoadContext): Authenticator<User> {
  if (_authenticator) return _authenticator;

  const sessionStorage = getSessionStorage(context);
  _authenticator = new Authenticator<User>(sessionStorage);

  _authenticator.use(getFormStrategy(context), "form");
  _authenticator.use(getGoogleStrategy(context), "google");

  return _authenticator;
}
