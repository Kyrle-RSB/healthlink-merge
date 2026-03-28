-- ============================================================
-- D1 Schema — hackathon boilerplate
-- ============================================================
-- Run: npm run db:migrate (local) or npm run db:migrate:remote
-- ============================================================

-- Users table (auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Records table (generic domain entity)
-- For healthcare: could be visit summaries, care plans, assessments, etc.
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Full-text search on records (built-in SQLite FTS5)
-- This is your "retrieval" layer for structured data — no Pinecone needed.
CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(
  title,
  category,
  content,
  content=records,
  content_rowid=rowid
);

-- Trigger to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS records_ai AFTER INSERT ON records BEGIN
  INSERT INTO records_fts(rowid, title, category, content)
  VALUES (new.rowid, new.title, new.category, new.content);
END;

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_records_category ON records(category);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at);

-- ============================================================
-- HealthLink — Synthea-modeled patient data
-- ============================================================
-- All data is MOCK/SYNTHETIC. No real PHI.

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  gender TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  phone TEXT,
  postal_code TEXT,
  has_family_doctor INTEGER DEFAULT 0,
  has_insurance INTEGER DEFAULT 1,
  barriers TEXT,
  conditions_summary TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  encounter_date TEXT NOT NULL,
  encounter_type TEXT NOT NULL,
  reason TEXT,
  provider_name TEXT,
  facility_id TEXT,
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  encounter_id TEXT REFERENCES encounters(id),
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  onset_date TEXT,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  encounter_id TEXT REFERENCES encounters(id),
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  status TEXT DEFAULT 'active',
  start_date TEXT,
  end_date TEXT
);

CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  encounter_id TEXT REFERENCES encounters(id),
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  value TEXT,
  unit TEXT,
  observation_date TEXT
);

CREATE TABLE IF NOT EXISTS generated_notes (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL REFERENCES encounters(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  clinical_note TEXT NOT NULL,
  patient_summary TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_conditions_patient ON conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_observations_patient ON observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_generated_notes_encounter ON generated_notes(encounter_id);

-- ============================================================
-- CarePoint — Routing system tables
-- ============================================================
-- All data is MOCK/SYNTHETIC.

-- Healthcare facilities (hospitals, clinics, pharmacies, etc.)
CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  hours TEXT NOT NULL,
  services TEXT NOT NULL,
  capacity_total INTEGER,
  capacity_current INTEGER DEFAULT 0,
  wait_minutes INTEGER DEFAULT 0,
  accepting_patients INTEGER DEFAULT 1,
  departments TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(type);
CREATE INDEX IF NOT EXISTS idx_facilities_accepting ON facilities(accepting_patients);

-- Hospital/facility staff
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  facility_id TEXT REFERENCES facilities(id),
  is_client_facing INTEGER DEFAULT 1,
  skills TEXT,
  shift_pattern TEXT,
  on_duty INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_staff_facility ON staff(facility_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

-- Medical problems/conditions for routing
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icd10_code TEXT NOT NULL,
  type TEXT NOT NULL,
  severity INTEGER NOT NULL,
  ctas_level INTEGER NOT NULL,
  recommended_destination TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  red_flags TEXT,
  related_conditions TEXT,
  typical_wait_tolerance TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_problems_destination ON problems(recommended_destination);
CREATE INDEX IF NOT EXISTS idx_problems_ctas ON problems(ctas_level);

-- FTS5 for symptom/problem search
CREATE VIRTUAL TABLE IF NOT EXISTS problems_fts USING fts5(
  title,
  symptoms,
  red_flags,
  content=problems,
  content_rowid=rowid
);

CREATE TRIGGER IF NOT EXISTS problems_ai AFTER INSERT ON problems BEGIN
  INSERT INTO problems_fts(rowid, title, symptoms, red_flags)
  VALUES (new.rowid, new.title, new.symptoms, new.red_flags);
END;

-- Routing sessions (conversation + decision tracking)
CREATE TABLE IF NOT EXISTS routing_sessions (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id),
  status TEXT NOT NULL DEFAULT 'active',
  initial_complaint TEXT NOT NULL,
  sentiment TEXT,
  urgency_score REAL,
  confidence_score REAL,
  recommended_destination TEXT,
  recommended_facility_id TEXT REFERENCES facilities(id),
  actual_destination TEXT,
  rerouted_from TEXT,
  reroute_reason TEXT,
  conversation_log TEXT,
  context_snapshot TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON routing_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON routing_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON routing_sessions(created_at);

-- System state metrics (facility loads, wait times)
CREATE TABLE IF NOT EXISTS system_state (
  id TEXT PRIMARY KEY,
  facility_id TEXT REFERENCES facilities(id),
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  recorded_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_system_state_facility ON system_state(facility_id);
CREATE INDEX IF NOT EXISTS idx_system_state_metric ON system_state(metric_name);

-- ============================================================
-- Integrations — Provider configs, meetings, LLM usage
-- ============================================================

CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  config TEXT NOT NULL,
  model TEXT,
  is_active INTEGER DEFAULT 0,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'zoom',
  external_meeting_id TEXT,
  join_url TEXT,
  host_url TEXT,
  password TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TEXT,
  duration_minutes INTEGER,
  attendees TEXT,
  notes TEXT,
  provider_data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS llm_usage (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  cost_estimate REAL,
  query_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_llm_usage_provider ON llm_usage(provider);
CREATE INDEX IF NOT EXISTS idx_llm_usage_created ON llm_usage(created_at);
