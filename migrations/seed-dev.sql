-- Email: tizuhanpen8+preview@gmail.com
-- Password: 14801250At
INSERT OR IGNORE INTO users (id, email, passwordHash, subscriptionStatus, stripeCustomerId, createdAt, updatedAt)
VALUES (
  'tezuke-001',
  'tizuhanpen8+preview@gmail.com',
  'test-salt-dev-001:3804714e34f1b1863714c69d75e0c4f64a99127d3d5a5d8bcb90c7b3752b317c',
  'active',
  'cus_test_dev_001',
  datetime('now'),
  datetime('now')
);

INSERT OR IGNORE INTO subscriptions (id, userId, stripeSubscriptionId, stripeCustomerId, planId, status, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt)
VALUES (
  'sub-tezuke-001',
  'tezuke-001',
  'sub_test_dev_001',
  'cus_test_dev_001',
  'plan_monthly',
  'active',
  datetime('now'),
  '2030-12-31T23:59:59Z',
  datetime('now'),
  datetime('now')
);
