-- ============================================================
-- Finance Domain Schema — personal finance / fintech model
-- ============================================================
-- Swap this in for fintech hackathons.
-- Covers: accounts, transactions, budgets, AI financial insights.
-- ============================================================

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  risk_profile TEXT NOT NULL DEFAULT 'moderate',  -- conservative, moderate, aggressive
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Advisors
CREATE TABLE IF NOT EXISTS advisors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,   -- retirement, tax, investment, general
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  account_type TEXT NOT NULL,  -- checking, savings, investment, retirement
  name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  category TEXT NOT NULL,      -- income, food, housing, transport, health, entertainment, transfer
  description TEXT NOT NULL,
  amount REAL NOT NULL,        -- positive = credit, negative = debit
  transaction_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  period TEXT NOT NULL,        -- YYYY-MM format
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI Financial Insights
CREATE TABLE IF NOT EXISTS financial_insights (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  insight_type TEXT NOT NULL,  -- spending_alert, savings_tip, investment_suggestion, budget_review
  summary_simple TEXT,
  summary_standard TEXT,
  summary_detailed TEXT,
  confidence INTEGER,          -- 0-100
  severity TEXT,               -- info, warning, action_required
  acknowledged INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_client ON accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_budgets_client ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_insights_client ON financial_insights(client_id);
