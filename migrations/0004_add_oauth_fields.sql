-- Migration: Add OAuth fields to users table
-- Purpose: Support OAuth authentication (Google/Apple)
-- Version: 0004
-- Date: 2025-12-28

-- Add OAuth provider field (google, apple, or null for email/password)
ALTER TABLE users ADD COLUMN oauthProvider TEXT;

-- Add OAuth provider ID (unique ID from OAuth provider)
ALTER TABLE users ADD COLUMN oauthId TEXT;

-- Create index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauthProvider, oauthId);

-- Note: passwordHash becomes optional for OAuth users
-- OAuth users will have NULL passwordHash
-- Email/password users will have non-NULL passwordHash
