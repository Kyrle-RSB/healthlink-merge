-- ============================================================
-- Healthcare Domain Schema — rich medical data model
-- ============================================================
-- Replaces the generic records table with healthcare-specific
-- tables. Works with both D1 (SQLite) and Supabase (Postgres).
--
-- To use: Replace src/db/schema.sql with this file, then run:
--   npm run db:migrate && npm run db:seed
-- ============================================================

-- Providers (doctors, nurses, specialists)
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  email TEXT UNIQUE,
  allergies TEXT,           -- comma-separated
  medications TEXT,         -- comma-separated
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessions / Visits
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  provider_id TEXT NOT NULL REFERENCES providers(id),
  visit_date TEXT NOT NULL,
  chief_complaint TEXT,
  transcription TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, reviewed, approved
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI-generated insights per session
CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  summary_simple TEXT,      -- plain language
  summary_standard TEXT,    -- standard medical
  summary_detailed TEXT,    -- detailed clinical
  confidence INTEGER,       -- 0-100
  risk_level TEXT,          -- low, medium, high
  differentials TEXT,       -- JSON array of possible diagnoses
  medication_flags TEXT,    -- comma-separated warnings
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Patient action items (generated from insights)
CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  insight_id TEXT NOT NULL REFERENCES insights(id),
  category TEXT NOT NULL,   -- medication, lifestyle, follow_up, warning
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patients_provider ON patients(provider_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(visit_date);
CREATE INDEX IF NOT EXISTS idx_insights_session ON insights(session_id);
CREATE INDEX IF NOT EXISTS idx_action_items_insight ON action_items(insight_id);
