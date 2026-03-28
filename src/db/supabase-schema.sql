-- ============================================================
-- Supabase Schema — run this in your Supabase SQL Editor
-- ============================================================
-- This mirrors the D1 schema but uses Postgres types.
-- Go to: Supabase Dashboard > SQL Editor > New Query > paste > Run
-- ============================================================

-- Users table (auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Records table (generic domain entity)
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index (Postgres native)
CREATE INDEX IF NOT EXISTS idx_records_fts
  ON records USING GIN (to_tsvector('english', title || ' ' || category || ' ' || content));

-- Common query indexes
CREATE INDEX IF NOT EXISTS idx_records_category ON records(category);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at);

-- Row-Level Security (enable but keep open for demo)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- Demo policies — allow all (tighten for production)
CREATE POLICY "Allow all reads on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow all reads on records" ON records FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on records" ON records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on records" ON records FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes on records" ON records FOR DELETE USING (true);

-- Seed demo data
INSERT INTO users (id, email, password_hash, role) VALUES
  ('usr_demo_001', 'demo@example.com', 'demo_hash_placeholder', 'admin'),
  ('usr_demo_002', 'viewer@example.com', 'demo_hash_placeholder', 'viewer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO records (id, title, category, content, created_by) VALUES
  ('rec_001', 'Annual Wellness Visit Summary', 'visit_summary',
   'MOCK DATA: Patient (synthetic ID: SYN-1001) completed annual wellness visit. All vitals within normal range. BMI 24.2. No new concerns reported. Follow-up in 12 months.',
   'usr_demo_001'),
  ('rec_002', 'Care Plan: Diabetes Management', 'care_plan',
   'MOCK DATA: Synthetic care plan for Type 2 Diabetes management. Goals: HbA1c below 7%, daily glucose monitoring, 30 min exercise 5x/week. Medications: Metformin 500mg BID.',
   'usr_demo_001'),
  ('rec_003', 'Mental Health Screening Results', 'screening',
   'MOCK DATA: PHQ-9 score: 4 (minimal depression). GAD-7 score: 3 (minimal anxiety). No immediate intervention required. Rescreen in 6 months.',
   'usr_demo_001'),
  ('rec_004', 'Medication Reconciliation', 'medication',
   'MOCK DATA: Current medications for synthetic patient SYN-1002: Lisinopril 10mg daily, Atorvastatin 20mg daily, Aspirin 81mg daily. No drug interactions identified.',
   'usr_demo_002'),
  ('rec_005', 'Post-Discharge Follow-Up', 'follow_up',
   'MOCK DATA: Synthetic patient SYN-1003 discharged after 3-day stay for pneumonia. Antibiotics course completing on schedule. Oxygen saturation stable at 97%. Follow-up chest X-ray in 2 weeks.',
   'usr_demo_002')
ON CONFLICT (id) DO NOTHING;
