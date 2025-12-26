-- Migration: Initial Schema for Account Service
-- Created: 2025-01-XX
-- Purpose: User authentication and session management

-- Users Table
-- Stores user account information
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Note: Sessions are stored in Cloudflare Workers KV, not in D1
-- See GUIDING_PRINCIPLES.md Section 2.1 for hybrid storage strategy
