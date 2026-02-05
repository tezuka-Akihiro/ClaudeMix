CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT,
  subscriptionStatus TEXT NOT NULL DEFAULT 'inactive',
  oauthProvider TEXT,
  oauthId TEXT,
  stripeCustomerId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauthProvider, oauthId);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripeCustomerId);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  stripeSubscriptionId TEXT,
  stripeCustomerId TEXT,
  planId TEXT NOT NULL,
  status TEXT NOT NULL,
  currentPeriodStart TEXT NOT NULL,
  currentPeriodEnd TEXT NOT NULL,
  canceledAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripeSubscriptionId ON subscriptions(stripeSubscriptionId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL UNIQUE,
  eventType TEXT NOT NULL,
  processedAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(eventId);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(eventType);
