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

-- Sessions Table
-- Stores active user sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on userId for faster session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);

-- Create index on expiresAt for cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions(expiresAt);
