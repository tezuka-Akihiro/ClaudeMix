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
  'tizuhanpen8@gmail.com',
  '487aa73a-6df1-4c0d-8229-8c9a6411cfa1:b4eb17875c3a4f5a6b4aaf77094820030b73ce978210d10b3d57b2f129fcaa45',
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
