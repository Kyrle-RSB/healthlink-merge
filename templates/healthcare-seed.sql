-- ============================================================
-- Healthcare Seed Data — MOCK ONLY
-- ============================================================

INSERT OR IGNORE INTO providers (id, name, specialty, email) VALUES
  ('prov_001', 'Dr. Emily Chen', 'Family Medicine', 'echen@example.com'),
  ('prov_002', 'Dr. Marcus Rivera', 'Cardiology', 'mrivera@example.com');

INSERT OR IGNORE INTO patients (id, provider_id, name, date_of_birth, email, allergies, medications) VALUES
  ('pat_001', 'prov_001', 'Sarah Kim (SYNTHETIC)', '1985-03-15', 'skim@example.com',
   'Penicillin, Sulfa', 'Metformin 500mg, Lisinopril 10mg'),
  ('pat_002', 'prov_001', 'James Miller (SYNTHETIC)', '1972-08-22', 'jmiller@example.com',
   'None known', 'Atorvastatin 20mg'),
  ('pat_003', 'prov_002', 'Maria Santos (SYNTHETIC)', '1990-11-03', 'msantos@example.com',
   'Aspirin', 'Metoprolol 25mg, Warfarin 5mg');

INSERT OR IGNORE INTO sessions (id, patient_id, provider_id, visit_date, chief_complaint, transcription, status) VALUES
  ('sess_001', 'pat_001', 'prov_001', '2026-03-20',
   'MOCK: Follow-up for diabetes management',
   'MOCK DATA: Patient reports blood sugar levels have been more stable since starting new medication regimen. Morning fasting glucose averaging 120. Reports occasional dizziness when standing quickly. Blood pressure 128/82. Weight stable at 145 lbs. A1C lab results pending.',
   'reviewed'),
  ('sess_002', 'pat_002', 'prov_001', '2026-03-21',
   'MOCK: Persistent headaches for 2 weeks',
   'MOCK DATA: Patient describes bilateral frontal headaches, worse in the morning, rated 6/10. No visual changes, no nausea. Sleep has been poor, averaging 4-5 hours. Work stress noted. No history of migraines. Neurological exam normal. BP 138/88 — elevated from last visit.',
   'pending'),
  ('sess_003', 'pat_003', 'prov_002', '2026-03-22',
   'MOCK: Routine cardiology follow-up',
   'MOCK DATA: Patient doing well post-ablation for atrial fibrillation. No palpitations in 3 months. INR stable at 2.3. Echocardiogram shows improved EF at 55%, up from 45%. Patient asking about returning to exercise. Cleared for moderate activity.',
   'approved');

INSERT OR IGNORE INTO insights (id, session_id, summary_simple, summary_standard, summary_detailed, confidence, risk_level, differentials, medication_flags, approved) VALUES
  ('ins_001', 'sess_001',
   'MOCK: Your blood sugar is getting better with the new medicine. You might feel dizzy when you stand up too fast — this is something to watch.',
   'MOCK: Diabetes management improving with current regimen. Fasting glucose averaging 120mg/dL. Orthostatic symptoms noted — may need BP medication adjustment. A1C pending.',
   'MOCK: Type 2 DM on Metformin 500mg BID showing improvement. FBG mean 120mg/dL (target <130). Orthostatic hypotension symptoms likely secondary to Lisinopril 10mg — consider dose reduction or timing change. BP 128/82 at visit. BMI stable. Awaiting HbA1c to assess 3-month trend.',
   82, 'low', '[]', 'Lisinopril may be causing orthostatic symptoms', 1),
  ('ins_002', 'sess_002',
   'MOCK: You have been having headaches that might be related to stress and not sleeping enough. Your blood pressure is a bit high too.',
   'MOCK: Bilateral tension-type headaches, likely stress/sleep-related. Elevated BP 138/88 — needs monitoring. No neurological red flags.',
   'MOCK: Presentation consistent with tension-type headache (TTH). Bilateral, non-pulsating, moderate severity. Contributing factors: sleep deprivation (4-5h vs recommended 7-9h), psychosocial stress. BP 138/88 — stage 1 HTN per ACC/AHA guidelines, was normotensive previously. Recommend: sleep hygiene counseling, stress management, BP recheck in 2 weeks. If BP remains elevated, consider 24h ambulatory monitoring.',
   61, 'medium', '["Tension-type headache","Sleep deprivation","New-onset hypertension"]', '', 0);

INSERT OR IGNORE INTO action_items (id, insight_id, category, description, sort_order) VALUES
  ('act_001', 'ins_001', 'medication', 'MOCK: Continue Metformin 500mg twice daily', 1),
  ('act_002', 'ins_001', 'lifestyle', 'MOCK: Stand up slowly to avoid dizziness', 2),
  ('act_003', 'ins_001', 'follow_up', 'MOCK: Return for A1C results review in 1 week', 3),
  ('act_004', 'ins_002', 'lifestyle', 'MOCK: Aim for 7-8 hours of sleep per night', 1),
  ('act_005', 'ins_002', 'lifestyle', 'MOCK: Try stress reduction: walks, breathing exercises', 2),
  ('act_006', 'ins_002', 'follow_up', 'MOCK: Blood pressure recheck in 2 weeks', 3),
  ('act_007', 'ins_002', 'warning', 'MOCK: If headaches worsen or vision changes occur, seek immediate care', 4);
