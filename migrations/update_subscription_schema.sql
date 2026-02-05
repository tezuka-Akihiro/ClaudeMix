-- Migration: update_subscription_schema.sql
-- Purpose: Rename oauth_id to google_id and update indexes

-- 1. Rename oauth_id column to google_id in users table
-- Note: SQLite (D1) supports RENAME COLUMN from version 3.25.0+
ALTER TABLE users RENAME COLUMN oauth_id TO google_id;

-- 2. Drop old index and create new one for google_id
DROP INDEX IF EXISTS idx_users_oauth;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(oauth_provider, google_id);

-- 3. Update subscription status documentation/expectation
-- (Implicit: users.subscription_status and subscriptions.status will now store raw Stripe statuses)
