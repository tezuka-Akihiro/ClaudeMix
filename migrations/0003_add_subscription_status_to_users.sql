-- Migration: Add subscriptionStatus column to users table
-- Purpose: Track user subscription status
-- Version: 0003
-- Date: 2025-12-26

ALTER TABLE users ADD COLUMN subscriptionStatus TEXT NOT NULL DEFAULT 'inactive';
