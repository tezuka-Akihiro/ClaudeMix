-- Migration: Add stripeCustomerId to users table
-- Purpose: Enable user lookup from Stripe customer ID for webhook processing

ALTER TABLE users ADD COLUMN stripeCustomerId TEXT;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripeCustomerId);
