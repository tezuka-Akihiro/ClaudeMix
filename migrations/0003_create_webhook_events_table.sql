-- Migration: Create webhook_events table for idempotency
-- Purpose: Track processed Stripe webhook events to prevent duplicate processing

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL UNIQUE,
  eventType TEXT NOT NULL,
  processedAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(eventId);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(eventType);
