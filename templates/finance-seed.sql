-- ============================================================
-- Finance Seed Data — MOCK ONLY
-- ============================================================

INSERT OR IGNORE INTO advisors (id, name, specialty, email) VALUES
  ('adv_001', 'Sarah Park (SYNTHETIC)', 'investment', 'spark@example.com'),
  ('adv_002', 'Tom Bradley (SYNTHETIC)', 'retirement', 'tbradley@example.com');

INSERT OR IGNORE INTO clients (id, name, email, risk_profile) VALUES
  ('cli_001', 'Jamie Rivera (SYNTHETIC)', 'jrivera@example.com', 'moderate'),
  ('cli_002', 'Pat Nguyen (SYNTHETIC)', 'pnguyen@example.com', 'conservative'),
  ('cli_003', 'Alex Morgan (SYNTHETIC)', 'amorgan@example.com', 'aggressive');

INSERT OR IGNORE INTO accounts (id, client_id, account_type, name, balance) VALUES
  ('acc_001', 'cli_001', 'checking', 'Main Checking', 4250.00),
  ('acc_002', 'cli_001', 'savings', 'Emergency Fund', 12800.00),
  ('acc_003', 'cli_001', 'investment', 'Brokerage', 45600.00),
  ('acc_004', 'cli_002', 'checking', 'Daily Account', 3100.00),
  ('acc_005', 'cli_002', 'retirement', '401k', 128000.00),
  ('acc_006', 'cli_003', 'checking', 'Primary', 8900.00),
  ('acc_007', 'cli_003', 'investment', 'Growth Portfolio', 92000.00);

INSERT OR IGNORE INTO transactions (id, account_id, category, description, amount, transaction_date) VALUES
  ('txn_001', 'acc_001', 'income', 'MOCK: Salary deposit', 4200.00, '2026-03-01'),
  ('txn_002', 'acc_001', 'housing', 'MOCK: Rent payment', -1800.00, '2026-03-01'),
  ('txn_003', 'acc_001', 'food', 'MOCK: Grocery store', -145.50, '2026-03-03'),
  ('txn_004', 'acc_001', 'transport', 'MOCK: Gas station', -52.00, '2026-03-05'),
  ('txn_005', 'acc_001', 'entertainment', 'MOCK: Streaming subscriptions', -45.97, '2026-03-05'),
  ('txn_006', 'acc_001', 'food', 'MOCK: Restaurant dinner', -78.00, '2026-03-07'),
  ('txn_007', 'acc_001', 'health', 'MOCK: Pharmacy', -23.50, '2026-03-08'),
  ('txn_008', 'acc_001', 'transfer', 'MOCK: Transfer to savings', -500.00, '2026-03-10'),
  ('txn_009', 'acc_002', 'transfer', 'MOCK: Transfer from checking', 500.00, '2026-03-10'),
  ('txn_010', 'acc_001', 'food', 'MOCK: Coffee shops (weekly)', -32.00, '2026-03-12'),
  ('txn_011', 'acc_004', 'income', 'MOCK: Salary deposit', 3800.00, '2026-03-01'),
  ('txn_012', 'acc_004', 'housing', 'MOCK: Mortgage', -1450.00, '2026-03-01'),
  ('txn_013', 'acc_006', 'income', 'MOCK: Freelance payment', 6500.00, '2026-03-03');

INSERT OR IGNORE INTO budgets (id, client_id, category, monthly_limit, period) VALUES
  ('bud_001', 'cli_001', 'food', 600.00, '2026-03'),
  ('bud_002', 'cli_001', 'entertainment', 150.00, '2026-03'),
  ('bud_003', 'cli_001', 'transport', 200.00, '2026-03'),
  ('bud_004', 'cli_002', 'food', 500.00, '2026-03');

INSERT OR IGNORE INTO financial_insights (id, client_id, insight_type, summary_simple, summary_standard, summary_detailed, confidence, severity) VALUES
  ('fi_001', 'cli_001', 'spending_alert',
   'MOCK: You are spending more on food than planned this month.',
   'MOCK: Food spending is tracking 15% over budget ($255 of $600 by mid-month). At this rate, you will exceed by ~$90.',
   'MOCK: Food category analysis for March 2026: $255.50 spent through day 12 of 31. Linear projection: $660 (110% of $600 budget). Breakdown: Groceries $145.50 (57%), Dining out $78.00 (31%), Coffee $32.00 (12%). Recommendation: Reduce dining out frequency to stay within budget. Historical average for food: $580/month.',
   78, 'warning'),
  ('fi_002', 'cli_001', 'savings_tip',
   'MOCK: Great job saving! Your emergency fund is growing nicely.',
   'MOCK: Emergency fund at $12,800 — approximately 3 months of expenses. Target is 6 months ($25,600). On track with $500/month contributions.',
   'MOCK: Emergency fund progress: $12,800 of $25,600 target (50%). Monthly contribution: $500. At current rate, target reached in ~26 months (May 2028). Current monthly expenses estimate: $4,275. Suggestion: Consider increasing contribution by $100/month to reach target by Dec 2027.',
   91, 'info');
