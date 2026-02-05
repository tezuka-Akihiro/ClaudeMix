/**
 * app/data-io/account/authentication/mappers/authMapper.server.ts
 * Purpose: Map external library profiles to internal domain models
 *
 * @layer 副作用層 (Data-IO)
 */

import type { GoogleProfile } from "remix-auth-google";
import type { User } from "~/specs/account/types";

export type { User };

/**
 * Map Google Profile to an internal User model
 *
 * @param profile Google profile from remix-auth-google
 * @returns User object
 */
export function mapGoogleProfileToUser(profile: GoogleProfile): User {
  const now = new Date().toISOString();
  return {
    id: profile.id,
    email: profile.emails[0].value,
    oauthId: profile.id,
    oauthProvider: "google",
    subscriptionStatus: "inactive",
    createdAt: now,
    updatedAt: now,
  };
}
