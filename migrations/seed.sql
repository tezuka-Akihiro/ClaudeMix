INSERT OR IGNORE INTO users (
  id, 
  email, 
  password_hash, 
  subscription_status, 
  stripe_customer_id, 
  created_at, 
  updated_at
) VALUES (
  'tezuke-001',
  'tizuhanpen8+preview@gmail.com',
  'test-salt-dev-001:3804714e34f1b1863714c69d75e0c4f64a99127d3d5a5d8bcb90c7b3752b317c',
  'active',
  'cus_test_dev_001',
  DATETIME('now'),
  DATETIME('now')
);

INSERT OR IGNORE INTO subscriptions (
  id, 
  user_id, 
  stripe_subscription_id, 
  stripe_customer_id, 
  plan_id, 
  status, 
  current_period_start, 
  current_period_end, 
  created_at, 
  updated_at
) VALUES (
  'sub-tezuke-001',
  'tezuke-001',
  'sub_test_dev_001',
  'cus_test_dev_001',
  'plan_monthly',
  'active',
  DATETIME('now'),
  '2030-12-31T23:59:59Z',
  DATETIME('now'),
  DATETIME('now')
);
