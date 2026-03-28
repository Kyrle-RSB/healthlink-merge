-- ============================================================
-- Seed Data — MOCK ONLY, no real patient data
-- ============================================================
-- All names, IDs, and details are synthetic/fictional.
-- This data is for development and demo purposes only.
-- ============================================================

-- Demo user (password: "demo123" — hashed with simple SHA-256 for dev only)
INSERT OR IGNORE INTO users (id, email, password_hash, role) VALUES
  ('usr_demo_001', 'demo@example.com', 'demo_hash_placeholder', 'admin'),
  ('usr_demo_002', 'viewer@example.com', 'demo_hash_placeholder', 'viewer');

-- Mock healthcare records
INSERT OR IGNORE INTO records (id, title, category, content, created_by) VALUES
  ('rec_001',
   'Annual Wellness Visit Summary',
   'visit_summary',
   'MOCK DATA: Patient (synthetic ID: SYN-1001) completed annual wellness visit. All vitals within normal range. BMI 24.2. No new concerns reported. Follow-up in 12 months.',
   'usr_demo_001'),

  ('rec_002',
   'Care Plan: Diabetes Management',
   'care_plan',
   'MOCK DATA: Synthetic care plan for Type 2 Diabetes management. Goals: HbA1c below 7%, daily glucose monitoring, 30 min exercise 5x/week. Medications: Metformin 500mg BID.',
   'usr_demo_001'),

  ('rec_003',
   'Mental Health Screening Results',
   'screening',
   'MOCK DATA: PHQ-9 score: 4 (minimal depression). GAD-7 score: 3 (minimal anxiety). No immediate intervention required. Rescreen in 6 months.',
   'usr_demo_001'),

  ('rec_004',
   'Medication Reconciliation',
   'medication',
   'MOCK DATA: Current medications for synthetic patient SYN-1002: Lisinopril 10mg daily, Atorvastatin 20mg daily, Aspirin 81mg daily. No drug interactions identified.',
   'usr_demo_002'),

  ('rec_005',
   'Post-Discharge Follow-Up',
   'follow_up',
   'MOCK DATA: Synthetic patient SYN-1003 discharged after 3-day stay for pneumonia. Antibiotics course completing on schedule. Oxygen saturation stable at 97%. Follow-up chest X-ray in 2 weeks.',
   'usr_demo_002');

-- ============================================================
-- HealthLink — Synthea-modeled seed data (ALL MOCK/SYNTHETIC)
-- ============================================================

INSERT OR IGNORE INTO patients (id, first_name, last_name, birth_date, gender, language, phone, postal_code, has_family_doctor, has_insurance, barriers, conditions_summary)
VALUES
  ('SYN-PAT-001', 'Maria', 'Santos (SYNTHETIC)', '1992-03-15', 'Female', 'tl', '250-555-0101', 'V8T 1A1', 0, 0, '["language","no_insurance","no_family_doctor","no_childcare"]', 'Abdominal pain, anxiety'),
  ('SYN-PAT-002', 'Robert', 'Chen (SYNTHETIC)', '1968-07-22', 'Male', 'en', '250-555-0102', 'V8R 3B2', 0, 1, '["no_family_doctor","lost_continuity"]', 'Type 2 diabetes, hypertension, hyperlipidemia'),
  ('SYN-PAT-003', 'Dorothy', 'MacLeod (SYNTHETIC)', '1945-01-08', 'Female', 'en', '250-555-0103', 'V8S 4C3', 1, 1, '["digital_divide","cognitive_decline","rural","lives_alone"]', 'Heart failure, osteoarthritis, mild cognitive decline'),
  ('SYN-PAT-004', 'James', 'Whiteduck (SYNTHETIC)', '1984-11-30', 'Male', 'en', '705-555-0104', 'P3E 2D4', 0, 1, '["geographic_isolation","jurisdictional_complexity","trust_deficit"]', 'Knee injury, chronic pain'),
  ('SYN-PAT-005', 'Amina', 'Hassan (SYNTHETIC)', '1979-08-14', 'Female', 'en', '250-555-0105', 'V8W 5E5', 1, 1, '["caregiver_burden","no_respite"]', 'Caregiver burnout, managing mother with diabetes and early dementia'),
  ('SYN-PAT-006', 'Tyler', 'Brooks (SYNTHETIC)', '2003-05-19', 'Male', 'en', '250-555-0106', 'V8P 6F6', 0, 1, '["no_family_doctor","cannot_afford_private","prescription_gap"]', 'Generalized anxiety disorder, major depressive disorder');

INSERT OR IGNORE INTO encounters (id, patient_id, encounter_date, encounter_type, reason, provider_name, status)
VALUES
  ('ENC-001', 'SYN-PAT-002', '2026-03-25', 'Office Visit', 'Diabetes follow-up — numbness in feet, overdue A1C', 'Dr. Sarah Okonkwo (MOCK)', 'completed'),
  ('ENC-002', 'SYN-PAT-003', '2026-03-20', 'Discharge', 'Post-fall hospitalization — discharge planning', 'Dr. Michael Torres (MOCK)', 'completed'),
  ('ENC-003', 'SYN-PAT-001', '2026-03-22', 'Walk-in', 'Persistent abdominal pain — 3 weeks, no prior workup', 'NP Alex Tremblay (MOCK)', 'completed'),
  ('ENC-004', 'SYN-PAT-006', '2026-03-18', 'ER Visit', 'Panic attack — 9 hour ER wait, acute anxiety', 'Dr. Priya Sharma (MOCK)', 'completed'),
  ('ENC-005', 'SYN-PAT-002', '2026-03-10', 'Lab Review', 'Review of overdue bloodwork results', 'Dr. Sarah Okonkwo (MOCK)', 'completed'),
  ('ENC-006', 'SYN-PAT-004', '2026-03-15', 'Telehealth', 'Knee pain follow-up — referral status unknown', 'Nurse Julie Fontaine (MOCK)', 'completed'),
  ('ENC-007', 'SYN-PAT-005', '2026-03-24', 'Office Visit', 'Caregiver stress assessment', 'Dr. Sarah Okonkwo (MOCK)', 'completed');

INSERT OR IGNORE INTO conditions (id, patient_id, encounter_id, code, description, onset_date, status)
VALUES
  ('COND-001', 'SYN-PAT-002', 'ENC-001', 'E11.9', 'Type 2 diabetes mellitus without complications', '2018-04-12', 'active'),
  ('COND-002', 'SYN-PAT-002', 'ENC-001', 'I10', 'Essential hypertension', '2019-01-08', 'active'),
  ('COND-003', 'SYN-PAT-002', 'ENC-001', 'E78.5', 'Hyperlipidemia, unspecified', '2019-06-15', 'active'),
  ('COND-004', 'SYN-PAT-002', 'ENC-001', 'G62.9', 'Peripheral neuropathy, unspecified', '2026-03-25', 'active'),
  ('COND-005', 'SYN-PAT-003', 'ENC-002', 'I50.9', 'Heart failure, unspecified', '2022-08-01', 'active'),
  ('COND-006', 'SYN-PAT-003', 'ENC-002', 'M19.90', 'Osteoarthritis, unspecified', '2020-03-10', 'active'),
  ('COND-007', 'SYN-PAT-003', 'ENC-002', 'G31.84', 'Mild cognitive impairment', '2024-11-15', 'active'),
  ('COND-008', 'SYN-PAT-003', 'ENC-002', 'W19', 'Fall, unspecified', '2026-03-15', 'resolved'),
  ('COND-009', 'SYN-PAT-001', 'ENC-003', 'R10.9', 'Abdominal pain, unspecified', '2026-03-01', 'active'),
  ('COND-010', 'SYN-PAT-001', 'ENC-003', 'F41.1', 'Generalized anxiety disorder', '2025-12-01', 'active'),
  ('COND-011', 'SYN-PAT-006', 'ENC-004', 'F41.0', 'Panic disorder', '2025-09-10', 'active'),
  ('COND-012', 'SYN-PAT-006', 'ENC-004', 'F32.1', 'Major depressive disorder, moderate', '2025-06-01', 'active'),
  ('COND-013', 'SYN-PAT-004', 'ENC-006', 'M23.91', 'Internal derangement of knee', '2025-07-20', 'active'),
  ('COND-014', 'SYN-PAT-004', 'ENC-006', 'M25.561', 'Pain in right knee', '2025-07-20', 'active'),
  ('COND-015', 'SYN-PAT-005', 'ENC-007', 'Z73.0', 'Caregiver burnout', '2025-11-01', 'active'),
  ('COND-016', 'SYN-PAT-005', 'ENC-007', 'F43.8', 'Adjustment disorder, chronic stress', '2026-01-15', 'active');

INSERT OR IGNORE INTO medications (id, patient_id, encounter_id, code, description, dosage, frequency, status, start_date)
VALUES
  ('MED-001', 'SYN-PAT-002', 'ENC-001', '860975', 'Metformin 500mg', '500mg', 'Twice daily with meals', 'active', '2018-04-15'),
  ('MED-002', 'SYN-PAT-002', 'ENC-001', '314076', 'Lisinopril 10mg', '10mg', 'Once daily', 'active', '2019-01-10'),
  ('MED-003', 'SYN-PAT-002', 'ENC-001', '316672', 'Atorvastatin 20mg', '20mg', 'Once daily at bedtime', 'active', '2019-06-20'),
  ('MED-004', 'SYN-PAT-003', 'ENC-002', '866924', 'Furosemide 40mg', '40mg', 'Once daily', 'active', '2022-08-10'),
  ('MED-005', 'SYN-PAT-003', 'ENC-002', '104491', 'Metoprolol 25mg', '25mg', 'Twice daily', 'active', '2022-08-10'),
  ('MED-006', 'SYN-PAT-003', 'ENC-002', '197361', 'Acetaminophen 500mg', '500mg', 'Every 6 hours as needed', 'active', '2020-03-15'),
  ('MED-007', 'SYN-PAT-003', 'ENC-002', '308136', 'Lisinopril 5mg', '5mg', 'Once daily', 'active', '2022-08-10'),
  ('MED-008', 'SYN-PAT-003', 'ENC-002', '310798', 'Aspirin 81mg', '81mg', 'Once daily', 'active', '2022-08-10'),
  ('MED-009', 'SYN-PAT-003', 'ENC-002', '312961', 'Potassium Chloride 20mEq', '20mEq', 'Once daily', 'active', '2022-08-15'),
  ('MED-010', 'SYN-PAT-003', 'ENC-002', '197884', 'Docusate Sodium 100mg', '100mg', 'Twice daily', 'active', '2026-03-15'),
  ('MED-011', 'SYN-PAT-006', 'ENC-004', '312036', 'Sertraline 50mg', '50mg', 'Once daily', 'active', '2026-03-18'),
  ('MED-012', 'SYN-PAT-006', 'ENC-004', '197696', 'Lorazepam 0.5mg', '0.5mg', 'As needed for acute anxiety', 'active', '2026-03-18'),
  ('MED-013', 'SYN-PAT-004', 'ENC-006', '198240', 'Naproxen 500mg', '500mg', 'Twice daily with food', 'active', '2025-07-25'),
  ('MED-014', 'SYN-PAT-001', 'ENC-003', '198108', 'Omeprazole 20mg', '20mg', 'Once daily before breakfast', 'active', '2026-03-22');

INSERT OR IGNORE INTO observations (id, patient_id, encounter_id, code, description, value, unit, observation_date)
VALUES
  ('OBS-001', 'SYN-PAT-002', 'ENC-001', '8480-6', 'Systolic Blood Pressure', '148', 'mmHg', '2026-03-25'),
  ('OBS-002', 'SYN-PAT-002', 'ENC-001', '8462-4', 'Diastolic Blood Pressure', '92', 'mmHg', '2026-03-25'),
  ('OBS-003', 'SYN-PAT-002', 'ENC-001', '4548-4', 'Hemoglobin A1c', '8.2', '%', '2026-03-25'),
  ('OBS-004', 'SYN-PAT-002', 'ENC-001', '2339-0', 'Fasting Glucose', '165', 'mg/dL', '2026-03-25'),
  ('OBS-005', 'SYN-PAT-002', 'ENC-001', '29463-7', 'Body Weight', '92', 'kg', '2026-03-25'),
  ('OBS-006', 'SYN-PAT-002', 'ENC-001', '8302-2', 'Body Height', '175', 'cm', '2026-03-25'),
  ('OBS-007', 'SYN-PAT-002', 'ENC-001', '39156-5', 'BMI', '30.0', 'kg/m2', '2026-03-25'),
  ('OBS-008', 'SYN-PAT-003', 'ENC-002', '8480-6', 'Systolic Blood Pressure', '135', 'mmHg', '2026-03-20'),
  ('OBS-009', 'SYN-PAT-003', 'ENC-002', '8462-4', 'Diastolic Blood Pressure', '78', 'mmHg', '2026-03-20'),
  ('OBS-010', 'SYN-PAT-003', 'ENC-002', '8867-4', 'Heart Rate', '76', 'bpm', '2026-03-20'),
  ('OBS-011', 'SYN-PAT-003', 'ENC-002', '2710-2', 'Oxygen Saturation', '96', '%', '2026-03-20'),
  ('OBS-012', 'SYN-PAT-003', 'ENC-002', '29463-7', 'Body Weight', '58', 'kg', '2026-03-20'),
  ('OBS-013', 'SYN-PAT-001', 'ENC-003', '8480-6', 'Systolic Blood Pressure', '118', 'mmHg', '2026-03-22'),
  ('OBS-014', 'SYN-PAT-001', 'ENC-003', '8462-4', 'Diastolic Blood Pressure', '74', 'mmHg', '2026-03-22'),
  ('OBS-015', 'SYN-PAT-001', 'ENC-003', '8867-4', 'Heart Rate', '88', 'bpm', '2026-03-22'),
  ('OBS-016', 'SYN-PAT-001', 'ENC-003', '8310-5', 'Body Temperature', '37.1', 'C', '2026-03-22'),
  ('OBS-017', 'SYN-PAT-006', 'ENC-004', '8480-6', 'Systolic Blood Pressure', '132', 'mmHg', '2026-03-18'),
  ('OBS-018', 'SYN-PAT-006', 'ENC-004', '8867-4', 'Heart Rate', '112', 'bpm', '2026-03-18'),
  ('OBS-019', 'SYN-PAT-006', 'ENC-004', '2710-2', 'Oxygen Saturation', '99', '%', '2026-03-18'),
  ('OBS-020', 'SYN-PAT-002', 'ENC-005', '4548-4', 'Hemoglobin A1c', '7.8', '%', '2026-03-10'),
  ('OBS-021', 'SYN-PAT-002', 'ENC-005', '2093-3', 'Total Cholesterol', '225', 'mg/dL', '2026-03-10'),
  ('OBS-022', 'SYN-PAT-002', 'ENC-005', '2571-8', 'Triglycerides', '198', 'mg/dL', '2026-03-10'),
  ('OBS-023', 'SYN-PAT-002', 'ENC-005', '18262-6', 'LDL Cholesterol', '142', 'mg/dL', '2026-03-10'),
  ('OBS-024', 'SYN-PAT-005', 'ENC-007', '8480-6', 'Systolic Blood Pressure', '142', 'mmHg', '2026-03-24'),
  ('OBS-025', 'SYN-PAT-005', 'ENC-007', '8462-4', 'Diastolic Blood Pressure', '88', 'mmHg', '2026-03-24'),
  ('OBS-026', 'SYN-PAT-005', 'ENC-007', '8867-4', 'Heart Rate', '82', 'bpm', '2026-03-24');

-- ============================================================
-- CarePoint — Facilities (ALL MOCK/SYNTHETIC)
-- Greater Victoria / Capital Regional District
-- Real facility names & addresses used for demo realism,
-- but ALL operational data (wait times, capacity, load) is MOCK.
-- ============================================================

INSERT OR IGNORE INTO facilities (id, name, type, address, latitude, longitude, phone, hours, services, capacity_total, capacity_current, wait_minutes, accepting_patients, departments)
VALUES
  -- ============ HOSPITALS ============
  ('FAC-001', 'Royal Jubilee Hospital (MOCK)', 'hospital_trauma', '1952 Bay St, Victoria, BC V8R 1J8', 48.4352, -123.3258, '250-370-8000', '24/7', '["emergency","surgery","icu","imaging","lab","pharmacy","psychiatry","obstetrics","cardiology","neurology","renal","cancer_centre"]', 500, 460, 180, 1, '["er","icu","medsurg","or","obstetrics","psychiatry","cardiology","neurology","lab","imaging","pharmacy","renal"]'),
  ('FAC-002', 'Victoria General Hospital (MOCK)', 'hospital_community', '1 Hospital Way, Victoria, BC V8Z 6R5', 48.4629, -123.3963, '250-727-4212', '24/7', '["emergency","surgery","imaging","lab","pharmacy","general_medicine","orthopedics","maternity"]', 180, 140, 120, 1, '["er","medsurg","or","lab","imaging","pharmacy","orthopedics","maternity"]'),
  ('FAC-003', 'Saanich Peninsula Hospital (MOCK)', 'hospital_community', '2166 Mt Newton Cross Rd, Saanichton, BC V8M 2B2', 48.5913, -123.4104, '250-544-7676', '24/7', '["emergency","imaging","lab","pharmacy","general_medicine","rehabilitation"]', 75, 49, 45, 1, '["er","medsurg","lab","imaging","pharmacy","rehab"]'),

  -- ============ URGENT CARE CENTRES ============
  ('FAC-004', 'Westshore Urgent & Primary Care Centre (MOCK)', 'urgent_care', '2780 Peatt Rd, Langford, BC V9B 3P7', 48.4498, -123.5056, '250-519-3212', '8am-8pm daily', '["xray","sutures","fractures","wound_care","iv_fluids","nebulizer","primary_care_attachment"]', 25, 14, 30, 1, '["urgent_care"]'),
  ('FAC-005', 'Saanich Peninsula Urgent & Primary Care Centre (MOCK)', 'urgent_care', '2166 Mt Newton Cross Rd, Saanichton, BC V8M 2B2', 48.5913, -123.4104, '250-544-7642', '8am-8pm daily', '["urgent_care","primary_care_attachment","chronic_disease"]', 20, 12, 35, 1, '["urgent_care"]'),
  ('FAC-006', 'Victoria Urgent & Primary Care Centre — Quadra (MOCK)', 'urgent_care', '2520 Quadra St, Victoria, BC V8T 4E1', 48.4398, -123.3536, '250-519-3090', '8am-8pm daily', '["urgent_care","primary_care_attachment","chronic_disease","mental_health"]', 20, 11, 40, 1, '["urgent_care"]'),
  ('FAC-007', 'Esquimalt Urgent & Primary Care Centre (MOCK)', 'urgent_care', '845 Esquimalt Rd, Esquimalt, BC V9A 3M7', 48.4310, -123.3950, '250-519-3080', '8am-8pm daily', '["urgent_care","primary_care_attachment","chronic_disease"]', 18, 10, 25, 1, '["urgent_care"]'),

  -- ============ WALK-IN CLINICS ============
  ('FAC-008', 'James Bay Walk-in Clinic (MOCK)', 'walkin_clinic', '230 Menzies St, Victoria, BC V8V 2G7', 48.4128, -123.3758, '250-388-9934', '8am-8pm M-F, 10am-4pm Sat-Sun', '["assessment","prescriptions","referrals","lab_requisitions"]', 12, 8, 45, 1, '["clinic"]'),
  ('FAC-009', 'Burnside Medical Walk-In Clinic (MOCK)', 'walkin_clinic', '50 Burnside Rd W, Victoria, BC V9A 1B3', 48.4448, -123.3870, '250-388-4341', '9am-5pm M-F', '["assessment","prescriptions","referrals"]', 10, 6, 50, 1, '["clinic"]'),
  ('FAC-010', 'Tillicum Mall Medical Clinic (MOCK)', 'walkin_clinic', '3170 Tillicum Rd, Victoria, BC V9A 7C5', 48.4490, -123.3900, '250-381-8112', '9am-5pm M-Sat', '["walk_in","family_medicine","prescriptions"]', 10, 7, 55, 1, '["clinic"]'),
  ('FAC-011', 'Shelbourne Medical Walk-In Clinic (MOCK)', 'walkin_clinic', '3200 Shelbourne St, Victoria, BC V8P 5G8', 48.4510, -123.3440, '250-595-2345', '9am-5pm M-F', '["walk_in","assessment","prescriptions"]', 10, 5, 40, 1, '["clinic"]'),
  ('FAC-012', 'Medical Arts Walk-In Clinic (MOCK)', 'walkin_clinic', '1105 Pandora Ave, Victoria, BC V8V 3P9', 48.4280, -123.3600, '250-380-7227', '9am-5pm M-F', '["walk_in","assessment","prescriptions","minor_procedures"]', 8, 4, 35, 1, '["clinic"]'),
  ('FAC-013', 'Colwood Medical Walk-In (MOCK)', 'walkin_clinic', '1913 Sooke Rd, Colwood, BC V9B 1V8', 48.4350, -123.4850, '250-478-2281', '9am-5pm M-F', '["walk_in","assessment","prescriptions"]', 8, 5, 45, 1, '["clinic"]'),
  ('FAC-014', 'Sidney Medical Clinic (MOCK)', 'walkin_clinic', '2537 Beacon Ave, Sidney, BC V8L 1Y3', 48.6505, -123.3990, '250-656-0161', '9am-5pm M-F', '["walk_in","family_practice","prescriptions"]', 8, 4, 30, 1, '["clinic"]'),
  ('FAC-015', 'Westshore Walk-In Clinic (MOCK)', 'walkin_clinic', '2849 Peatt Rd, Langford, BC V9B 3P7', 48.4500, -123.5040, '250-474-5512', '9am-5pm M-F', '["walk_in","assessment","prescriptions"]', 8, 6, 50, 1, '["clinic"]'),
  ('FAC-016', 'Cook Street Village Medical Clinic (MOCK)', 'walkin_clinic', '230 Cook St, Victoria, BC V8V 3X3', 48.4150, -123.3580, '250-384-7151', '9am-5pm M-F', '["walk_in","family_practice","prescriptions"]', 8, 3, 25, 1, '["clinic"]'),
  ('FAC-017', 'Uptown Medical Clinic (MOCK)', 'walkin_clinic', '3551 Blanshard St, Victoria, BC V8Z 0B9', 48.4470, -123.3610, '250-475-0022', '9am-5pm M-Sat', '["walk_in","family_practice","prescriptions"]', 10, 5, 35, 1, '["clinic"]'),
  ('FAC-018', 'Sooke Family Health Clinic (MOCK)', 'walkin_clinic', '6750 West Coast Rd, Sooke, BC V9Z 0T1', 48.3740, -123.7350, '250-642-5222', '9am-5pm M-F', '["walk_in","family_practice","prescriptions"]', 6, 3, 30, 1, '["clinic"]'),

  -- ============ COMMUNITY HEALTH CENTRES ============
  ('FAC-019', 'Cool Aid Community Health Centre (MOCK)', 'community_health', '713 Johnson St, Victoria, BC V8W 1M8', 48.4292, -123.3655, '250-383-1977', '8am-6pm M-F', '["primary_care","social_services","translation","newcomer_support","mental_health","addictions","nutrition","harm_reduction"]', 30, 24, 60, 1, '["primary_care","social_services","mental_health"]'),
  ('FAC-020', 'Victoria Community Health Centre (MOCK)', 'community_health', '1947 Cook St, Victoria, BC V8T 3P8', 48.4330, -123.3560, '250-388-2200', '8:30am-4:30pm M-F', '["public_health_nursing","immunizations","prenatal","well_baby","sexual_health"]', 25, 15, 20, 1, '["public_health"]'),
  ('FAC-021', 'Saanich Community Health Centre (MOCK)', 'community_health', '3995 Quadra St, Victoria, BC V8X 1J8', 48.4530, -123.3530, '250-519-3490', '8:30am-4:30pm M-F', '["public_health","community_nursing","immunizations"]', 20, 10, 15, 1, '["public_health"]'),
  ('FAC-022', 'Peninsula Community Health Centre (MOCK)', 'community_health', '2170 Mt Newton Cross Rd, Saanichton, BC V8M 2B2', 48.5910, -123.4100, '250-519-3490', '8:30am-4:30pm M-F', '["community_health","home_care_coordination","chronic_disease"]', 15, 8, 20, 1, '["public_health"]'),
  ('FAC-023', 'AVI Health & Community Services (MOCK)', 'community_health', '713 Johnson St, Victoria, BC V8W 1M8', 48.4292, -123.3655, '250-384-2366', '9am-5pm M-F', '["hiv_hcv_support","harm_reduction","overdose_prevention","lgbtq2s_health","peer_support"]', 20, 12, 10, 1, '["community_health","harm_reduction"]'),
  ('FAC-024', 'Our Place Society Health Services (MOCK)', 'community_health', '919 Pandora Ave, Victoria, BC V8V 3P4', 48.4285, -123.3625, '250-388-7112', '7am-9pm daily', '["drop_in_clinic","meals","sheltering","outreach","primary_care"]', 25, 20, 30, 1, '["community_health","outreach"]'),

  -- ============ MENTAL HEALTH / CRISIS ============
  ('FAC-025', 'Eric Martin Pavilion — Psychiatric Services (MOCK)', 'mental_health', '1952 Bay St, Victoria, BC V8R 1J8', 48.4352, -123.3258, '250-370-8000', '24/7', '["inpatient_psychiatric","psychiatric_emergency","crisis_stabilization"]', 40, 32, 90, 1, '["psychiatry","crisis"]'),
  ('FAC-026', 'Island Crisis Care Centre (MOCK)', 'mental_health_crisis', '2328 Trent St, Victoria, BC V8R 4Z3', 48.4320, -123.3210, '250-370-8585', '24/7', '["crisis_stabilization","psychiatric_assessment","counseling","safety_planning","substance_crisis","peer_support"]', 20, 9, 20, 1, '["mental_health","crisis"]'),
  ('FAC-027', 'Access Mental Health & Substance Use (MOCK)', 'mental_health', '2328 Trent St, Victoria, BC V8R 4Z3', 48.4320, -123.3210, '250-370-8252', '8:30am-4:30pm M-F', '["intake","referral","mental_health","substance_use","case_management"]', 15, 10, 0, 1, '["mental_health","intake"]'),
  ('FAC-028', 'CMHA Victoria — Yates (MOCK)', 'mental_health', '1116 Yates St, Victoria, BC V8V 3M5', 48.4260, -123.3600, '250-389-1211', '9am-5pm M-F', '["counselling","peer_support","housing_support","recovery_programs"]', 20, 14, 0, 1, '["mental_health"]'),
  ('FAC-029', 'Foundry Victoria (MOCK)', 'mental_health', '818 Douglas St, Victoria, BC V8W 2B6', 48.4240, -123.3640, '250-383-3552', '10am-6pm M-F', '["youth_12_24","primary_care","mental_health","substance_use","peer_support"]', 15, 8, 15, 1, '["mental_health","youth"]'),
  ('FAC-030', 'Beacon Community Services — Mental Health (MOCK)', 'mental_health', '2723 Quadra St, Victoria, BC V8T 4E4', 48.4380, -123.3530, '250-519-5801', '9am-5pm M-F', '["counselling","seniors_mental_health","youth_services"]', 10, 6, 0, 1, '["mental_health","counselling"]'),
  ('FAC-031', 'Vancouver Island Crisis Society (MOCK)', 'mental_health_crisis', 'Phone-based service', 0, 0, '250-386-6323', '24/7', '["crisis_phone_line","suicide_prevention","distress_support"]', 10, 5, 0, 1, '["crisis","phone"]'),
  ('FAC-032', 'Rapid Access Addiction Clinic (MOCK)', 'mental_health', 'Victoria, BC (via Island Health referral)', 48.4300, -123.3550, '250-370-8252', '8:30am-4:30pm M-F', '["same_day_addiction_medicine","oat_opioid_agonist_therapy","harm_reduction"]', 15, 10, 15, 1, '["mental_health","addictions"]'),

  -- ============ PHARMACIES (Minor Ailment Assessment) ============
  ('FAC-033', 'Shoppers Drug Mart — Douglas St (MOCK)', 'pharmacy', '1222 Douglas St, Victoria, BC V8W 2E1', 48.4256, -123.3641, '250-381-4421', '8am-10pm daily', '["minor_ailment_assessment","immunizations","medication_review","bp_check","prescription_dispensing"]', 50, 10, 5, 1, '["pharmacy"]'),
  ('FAC-034', 'Shoppers Drug Mart — Hillside (MOCK)', 'pharmacy', '1644 Hillside Ave, Victoria, BC V8T 2C5', 48.4370, -123.3470, '250-592-1232', '8am-10pm daily', '["minor_ailment_assessment","immunizations","medication_review"]', 40, 8, 5, 1, '["pharmacy"]'),
  ('FAC-035', 'Shoppers Drug Mart — Broadmead (MOCK)', 'pharmacy', '777 Royal Oak Dr, Victoria, BC V8X 4V1', 48.4660, -123.3620, '250-727-3505', '8am-10pm daily', '["minor_ailment_assessment","immunizations","medication_review"]', 40, 8, 5, 1, '["pharmacy"]'),
  ('FAC-036', 'Shoppers Drug Mart — Colwood (MOCK)', 'pharmacy', '1913 Sooke Rd, Colwood, BC V9B 1V8', 48.4350, -123.4850, '250-478-1223', '8am-10pm daily', '["minor_ailment_assessment","immunizations","medication_review"]', 35, 7, 5, 1, '["pharmacy"]'),
  ('FAC-037', 'Shoppers Drug Mart — Sidney (MOCK)', 'pharmacy', '2425 Bevan Ave, Sidney, BC V8L 4M9', 48.6510, -123.3980, '250-656-1168', '8am-10pm daily', '["minor_ailment_assessment","immunizations","medication_review"]', 30, 5, 5, 1, '["pharmacy"]'),
  ('FAC-038', 'London Drugs — Hillside Centre (MOCK)', 'pharmacy', '1590 Hillside Ave, Victoria, BC V8T 2C2', 48.4370, -123.3480, '250-370-3084', '8am-10pm daily', '["minor_ailment_assessment","immunizations","travel_health","medication_review"]', 50, 12, 10, 1, '["pharmacy"]'),
  ('FAC-039', 'London Drugs — Westshore Town Centre (MOCK)', 'pharmacy', '2945 Jacklin Rd, Langford, BC V9B 0A1', 48.4510, -123.5000, '250-474-0005', '8am-10pm daily', '["minor_ailment_assessment","immunizations","travel_health","medication_review"]', 45, 10, 10, 1, '["pharmacy"]'),
  ('FAC-040', 'London Drugs — Mayfair (MOCK)', 'pharmacy', '3147 Douglas St, Victoria, BC V8Z 3K3', 48.4420, -123.3620, '250-382-7323', '9am-9pm daily', '["minor_ailment_assessment","immunizations","medication_review"]', 40, 8, 10, 1, '["pharmacy"]'),
  ('FAC-041', 'Pharmasave — James Bay (MOCK)', 'pharmacy', '230 Menzies St, Victoria, BC V8V 2G7', 48.4128, -123.3758, '250-384-1195', '9am-6pm M-Sat', '["minor_ailment_assessment","immunizations","compounding","medication_review"]', 20, 4, 5, 1, '["pharmacy"]'),
  ('FAC-042', 'Pharmasave — Cook Street Village (MOCK)', 'pharmacy', '301 Cook St, Victoria, BC V8V 3X7', 48.4150, -123.3580, '250-388-4211', '9am-6pm M-Sat', '["minor_ailment_assessment","immunizations","medication_review"]', 20, 3, 5, 1, '["pharmacy"]'),
  ('FAC-043', 'Pharmasave — Sidney (MOCK)', 'pharmacy', '2416 Beacon Ave, Sidney, BC V8L 1X4', 48.6505, -123.3985, '250-656-1148', '9am-6pm M-Sat', '["minor_ailment_assessment","immunizations","medication_review"]', 20, 4, 5, 1, '["pharmacy"]'),
  ('FAC-044', 'Peoples Pharmacy — Downtown (MOCK)', 'pharmacy', '1012 Douglas St, Victoria, BC V8W 2C3', 48.4230, -123.3650, '250-383-4055', '9am-6pm M-F', '["minor_ailment_assessment","immunizations","prescription_dispensing"]', 15, 3, 5, 1, '["pharmacy"]'),

  -- ============ VIRTUAL CARE ============
  ('FAC-045', 'Telus Health MyCare (MOCK)', 'telehealth', 'Virtual — app-based', 0, 0, '1-888-835-8726', '24/7', '["video_consult","phone_consult","prescription_renewal","triage","mental_health","follow_up"]', 100, 30, 10, 1, '["virtual"]'),
  ('FAC-046', 'Maple by WELL Health (MOCK)', 'telehealth', 'Virtual — app-based', 0, 0, '1-844-627-5387', '24/7', '["video_consult","prescription_renewal","specialist_referral","mental_health"]', 80, 20, 15, 1, '["virtual"]'),
  ('FAC-047', 'HealthLink BC — 811 (MOCK)', 'telehealth', 'Phone-based province-wide', 0, 0, '811', '24/7', '["nurse_advice","pharmacist_advice","dietitian","health_information"]', 200, 80, 20, 1, '["virtual","phone"]'),

  -- ============ INDIGENOUS HEALTH ============
  ('FAC-048', 'Victoria Native Friendship Centre (MOCK)', 'indigenous_health', '231 Regina Ave, Victoria, BC V8Z 1J6', 48.4368, -123.3577, '250-384-3211', '9am-5pm M-F', '["culturally_safe_care","traditional_healing","nihb_navigation","mental_health","addictions","elder_care","advocacy"]', 20, 7, 15, 1, '["indigenous_health","mental_health"]'),
  ('FAC-049', 'Surrounded by Cedar Child & Family Services (MOCK)', 'indigenous_health', '1581 Hillside Ave, Victoria, BC V8T 2C1', 48.4370, -123.3475, '250-383-2990', '9am-5pm M-F', '["indigenous_child_welfare","family_support","cultural_connections"]', 15, 8, 0, 1, '["indigenous_health","family"]'),
  ('FAC-050', 'Tsawout First Nation Health Centre (MOCK)', 'indigenous_health', '7728 Tetayut Rd, Saanichton, BC V8M 2H4', 48.5850, -123.3850, '250-652-9101', '9am-5pm M-F', '["primary_care","community_health_nursing","traditional_healing"]', 10, 4, 15, 1, '["indigenous_health"]'),
  ('FAC-051', 'Songhees Wellness Centre (MOCK)', 'indigenous_health', 'Songhees First Nation, Esquimalt, BC', 48.4310, -123.3980, '250-386-1043', '9am-5pm M-F', '["health_and_wellness","cultural_programs","mental_health"]', 10, 5, 10, 1, '["indigenous_health"]'),
  ('FAC-052', 'Esquimalt First Nation Health (MOCK)', 'indigenous_health', 'Esquimalt First Nation, Esquimalt, BC', 48.4300, -123.4050, '250-381-7861', '9am-5pm M-F', '["community_health","mental_health","elder_care"]', 10, 4, 10, 1, '["indigenous_health"]'),

  -- ============ SPECIALIZED CLINICS ============
  ('FAC-053', 'Island Sexual Health (MOCK)', 'specialized_clinic', '3960 Quadra St, Victoria, BC V8X 1J6', 48.4436, -123.3536, '250-592-3479', '9am-5pm M-F', '["sti_testing","contraception","pregnancy_options","gender_affirming_care","sexual_health"]', 20, 8, 15, 1, '["public_health","sexual_health"]'),
  ('FAC-054', 'BC Cancer — Victoria Centre (MOCK)', 'specialized_clinic', '2410 Lee Ave, Victoria, BC V8R 6V5', 48.4340, -123.3230, '250-519-5500', '8am-4pm M-F', '["cancer_treatment","radiation","chemotherapy","clinical_trials","oncology"]', 60, 40, 0, 1, '["oncology"]'),
  ('FAC-055', 'Queen Alexandra Centre for Childrens Health (MOCK)', 'specialized_clinic', '2400 Arbutus Rd, Victoria, BC V8N 1V7', 48.4560, -123.3280, '250-519-5380', '8:30am-4:30pm M-F', '["pediatric_rehabilitation","developmental_services","child_youth_mental_health"]', 30, 20, 0, 1, '["pediatrics","rehab"]'),
  ('FAC-056', 'Renal Program — Royal Jubilee (MOCK)', 'specialized_clinic', '1952 Bay St, Victoria, BC V8R 1J8', 48.4352, -123.3258, '250-370-8000', '7am-6pm M-Sat', '["dialysis","nephrology","renal_care"]', 25, 18, 0, 1, '["renal"]'),
  ('FAC-057', 'Victoria Heart Institute (MOCK)', 'specialized_clinic', '1952 Bay St, Victoria, BC V8R 1J8', 48.4352, -123.3258, '250-595-1884', '8am-4pm M-F', '["cardiac_catheterization","echocardiography","cardiac_rehabilitation"]', 20, 14, 0, 1, '["cardiology"]'),
  ('FAC-058', 'Victoria Pain Clinic (MOCK)', 'specialized_clinic', '304-1120 Yates St, Victoria, BC V8V 3M9', 48.4260, -123.3590, '250-381-7246', '9am-5pm M-F', '["chronic_pain_management","nerve_blocks","medication_management"]', 10, 8, 0, 1, '["pain_management"]'),

  -- ============ FAMILY PRACTICE (Not Accepting) ============
  ('FAC-059', 'Esquimalt Family Practice (MOCK)', 'family_practice', '1153 Esquimalt Rd, Victoria, BC V9A 3N7', 48.4320, -123.4024, '250-386-7498', '8am-5pm M-F', '["primary_care","chronic_disease","preventive","mental_health","referrals","minor_procedures"]', 15, 14, 0, 0, '["primary_care"]'),
  ('FAC-060', 'Fernwood Family Practice (MOCK)', 'family_practice', '1302 Gladstone Ave, Victoria, BC V8R 1R8', 48.4330, -123.3460, '250-595-2345', '8:30am-5pm M-F', '["primary_care","preventive","chronic_disease","mental_health"]', 12, 12, 0, 0, '["primary_care"]'),
  ('FAC-061', 'Oak Bay Family Medicine (MOCK)', 'family_practice', '2167 Oak Bay Ave, Victoria, BC V8R 1G2', 48.4330, -123.3190, '250-598-9822', '8:30am-5pm M-F', '["primary_care","preventive","chronic_disease"]', 10, 10, 0, 0, '["primary_care"]'),
  ('FAC-062', 'Langford Family Practice (MOCK)', 'family_practice', '2829 Peatt Rd, Langford, BC V9B 3P7', 48.4500, -123.5050, '250-478-8855', '8am-5pm M-F', '["primary_care","chronic_disease","minor_procedures"]', 12, 11, 0, 0, '["primary_care"]'),

  -- ============ PUBLIC HEALTH / OTHER ============
  ('FAC-063', 'Saanich Public Health Unit (MOCK)', 'public_health', '3995 Quadra St, Victoria, BC V8X 1J8', 48.4530, -123.3530, '250-519-3490', '8:30am-4:30pm M-F', '["immunizations","communicable_disease","prenatal","well_baby"]', 15, 8, 10, 1, '["public_health"]'),
  ('FAC-064', 'Gorge Road Hospital / Priory (MOCK)', 'specialized_clinic', '63 Gorge Rd E, Victoria, BC V9A 1L2', 48.4420, -123.3830, '250-519-3400', '24/7', '["long_term_care","complex_care","rehabilitation","palliative"]', 100, 92, 0, 1, '["long_term_care","rehab"]'),
  ('FAC-065', 'Aberdeen Hospital (MOCK)', 'specialized_clinic', '1450 Hillside Ave, Victoria, BC V8T 2B7', 48.4370, -123.3500, '250-370-5641', '24/7', '["residential_care","complex_care","dementia_care"]', 130, 125, 0, 1, '["residential_care"]');

-- ============================================================
-- CarePoint — Problems / Medical Conditions (ALL MOCK/SYNTHETIC)
-- ============================================================

INSERT OR IGNORE INTO problems (id, title, icd10_code, type, severity, ctas_level, recommended_destination, symptoms, red_flags, related_conditions, typical_wait_tolerance)
VALUES
  -- ER-Required (CTAS 1-2)
  ('PROB-001', 'Chest Pain / Suspected MI', 'I21.9', 'emergency', 5, 1, 'er', '["chest pressure","left arm pain","jaw pain","shortness of breath","sweating","nausea","dizziness","sense of doom"]', '["radiating to left arm or jaw","crushing pressure","sudden onset","cardiac history"]', '["I10","E78.5","E11.9"]', 'immediate'),
  ('PROB-002', 'Stroke Symptoms', 'I63.9', 'emergency', 5, 1, 'er', '["facial drooping","arm weakness","speech difficulty","sudden confusion","severe headache","vision loss","balance loss"]', '["FAST symptoms","sudden neurological deficit","sudden worst headache"]', '["I48.91","I10","E11.9"]', 'immediate'),
  ('PROB-003', 'Severe Allergic Reaction / Anaphylaxis', 'T78.2', 'emergency', 5, 1, 'er', '["throat swelling","difficulty breathing","wheezing","widespread hives","rapid pulse","dizziness","nausea"]', '["airway compromise","tongue swelling","blood pressure drop","loss of consciousness"]', '["J45","T78.40"]', 'immediate'),
  ('PROB-004', 'Major Trauma / Severe Injury', 'S72.009A', 'emergency', 5, 1, 'er', '["visible deformity","severe pain","inability to move limb","visible bone","significant bleeding","loss of consciousness"]', '["head injury with confusion","spinal pain","uncontrolled bleeding","loss of sensation"]', '["M81.0"]', 'immediate'),
  ('PROB-005', 'Severe Breathing Difficulty', 'J96.00', 'emergency', 5, 1, 'er', '["gasping","blue lips","unable to speak sentences","chest retractions","accessory muscle use","altered consciousness"]', '["cyanosis","inability to speak","altered mental status","resp rate over 30","O2 sat below 90"]', '["J44.1","J45","I50.9","J18.9"]', 'immediate'),
  ('PROB-006', 'Severe Abdominal Pain with Fever', 'R10.0', 'emergency', 4, 2, 'er', '["intense abdominal pain","rigid abdomen","rebound tenderness","fever over 38.5","vomiting","blood in stool"]', '["rigid abdomen","fever with severe pain","blood in vomit or stool"]', '["K50","K51"]', 'within 1-2 hours'),
  ('PROB-007', 'Active Seizure', 'G40.909', 'emergency', 5, 1, 'er', '["convulsions","loss of consciousness","tongue biting","incontinence","confusion after seizure"]', '["seizure over 5 minutes","multiple seizures","first seizure","seizure with head injury","seizure in pregnancy"]', '["G40"]', 'immediate'),
  ('PROB-008', 'Overdose / Poisoning', 'T50.901A', 'emergency', 5, 1, 'er', '["altered consciousness","respiratory depression","confusion","vomiting","seizures","pinpoint pupils","slurred speech"]', '["unresponsive","not breathing","seizures","unknown substance","intentional self-harm"]', '["F10","F11"]', 'immediate'),

  -- Urgent Care (CTAS 3-4)
  ('PROB-009', 'Minor Laceration Needing Sutures', 'S01.80XA', 'acute', 2, 4, 'urgent_care', '["clean cut over 1cm","controlled bleeding","visible subcutaneous tissue","wound edges gaping"]', '["uncontrolled bleeding","deep wound","tendon or nerve involvement","wound on face or hand"]', '[]', '4-6 hours'),
  ('PROB-010', 'Suspected Minor Fracture', 'S62.009A', 'acute', 3, 3, 'urgent_care', '["swelling","bruising","pain with movement","point tenderness","limited range of motion","possible deformity"]', '["visible bone","loss of sensation","no pulse below injury","open fracture"]', '["M81.0"]', '2-4 hours'),
  ('PROB-011', 'Moderate Asthma Exacerbation', 'J45.41', 'acute', 3, 3, 'urgent_care', '["wheezing","chest tightness","shortness of breath on exertion","reduced peak flow","cough","difficulty sleeping"]', '["inability to speak sentences","peak flow below 50 percent","blue lips","no improvement with inhaler"]', '["J44.1"]', '1-2 hours'),
  ('PROB-012', 'Complicated UTI', 'N39.0', 'acute', 2, 3, 'urgent_care', '["flank pain","fever over 38","frequent painful urination","blood in urine","nausea","chills"]', '["high fever over 39","severe flank pain","rigors","pregnancy","immunocompromised"]', '["E11.9","N20"]', '2-4 hours'),
  ('PROB-013', 'Moderate Allergic Reaction', 'T78.40', 'acute', 3, 3, 'urgent_care', '["widespread hives","itching","mild facial swelling","localized angioedema","mild nausea"]', '["throat tightness","voice changes","tongue swelling","difficulty breathing","dizziness"]', '["J45"]', '1-2 hours'),
  ('PROB-014', 'Animal or Insect Bite', 'S01.85XA', 'acute', 2, 4, 'urgent_care', '["puncture wound","swelling","redness","pain","bleeding","concern about infection"]', '["bite from wild animal","deep puncture to hand or face","signs of infection","snake bite"]', '[]', '4-8 hours'),
  ('PROB-015', 'Minor Burns', 'T30.0', 'acute', 3, 3, 'urgent_care', '["redness","blistering","pain","swelling","skin peeling"]', '["burns to face hands feet genitals","circumferential burns","chemical or electrical","inhalation injury","over 10 percent BSA"]', '[]', '2-4 hours'),
  ('PROB-016', 'Foreign Body (Ear/Nose/Eye)', 'T17.1', 'acute', 2, 4, 'urgent_care', '["discomfort","sensation of something stuck","tearing","hearing change","nasal discharge"]', '["penetrating eye injury","button battery","complete airway obstruction","sharp object"]', '[]', '2-6 hours'),

  -- Walk-in / Clinic (CTAS 4-5)
  ('PROB-017', 'Upper Respiratory Infection', 'J06.9', 'acute', 1, 5, 'clinic', '["cough","runny nose","sore throat","mild fever","body aches","sneezing","nasal congestion","fatigue"]', '["high fever over 39 lasting 3 days","difficulty breathing","chest pain","confusion"]', '["J45","J44.1"]', '24-48 hours'),
  ('PROB-018', 'Ear Infection / Otitis Media', 'H66.90', 'acute', 2, 4, 'clinic', '["ear pain","fever","reduced hearing","fluid drainage","irritability","pulling at ear"]', '["severe pain with high fever","swelling behind ear","facial weakness","neck stiffness"]', '[]', '24-48 hours'),
  ('PROB-019', 'Simple UTI', 'N39.0', 'acute', 2, 4, 'clinic', '["burning urination","frequency","urgency","cloudy urine","mild lower abdominal discomfort"]', '["fever","flank pain","blood in urine","nausea or vomiting"]', '["E11.9"]', '24-48 hours'),
  ('PROB-020', 'Skin Rash / Dermatitis', 'L30.9', 'acute', 1, 5, 'clinic', '["itching","redness","dry patches","bumps or blisters","flaking skin","localized swelling"]', '["rapidly spreading rash with fever","purple non-blanching spots","blistering over large area","rash after new medication"]', '[]', 'days to weeks'),
  ('PROB-021', 'Non-traumatic Back Pain', 'M54.5', 'acute', 2, 4, 'clinic', '["muscle ache","stiffness","limited range of motion","pain worse with movement"]', '["loss of bladder or bowel control","leg weakness","fever with back pain","pain after trauma"]', '["M19.90","M81.0"]', '24-72 hours'),
  ('PROB-022', 'Non-emergent Headache', 'R51.9', 'acute', 2, 4, 'clinic', '["gradual onset","band-like tension","mild to moderate","no vision changes","responds to OTC medication"]', '["thunderclap worst-ever sudden","fever with stiff neck","vision changes","confusion","after head injury"]', '["I10"]', '24-48 hours'),
  ('PROB-023', 'Medication Refill Needed', 'Z76.0', 'chronic', 1, 5, 'clinic', '["running low on medication","no acute symptoms","stable condition"]', '["completely out of critical medication like insulin or blood thinners or seizure meds"]', '[]', '1-3 days'),
  ('PROB-024', 'Chronic Condition Follow-up', 'Z09', 'chronic', 1, 5, 'clinic', '["routine check","diabetes monitoring","blood pressure check","cholesterol review"]', '["new symptoms like chest pain or vision changes or numbness"]', '["E11.9","I10","I50.9"]', '1-4 weeks'),
  ('PROB-025', 'Sprained Ankle or Wrist', 'S93.401A', 'acute', 2, 4, 'clinic', '["swelling","bruising","pain with movement","able to bear some weight","tenderness over ligaments"]', '["unable to bear any weight","severe deformity","numbness below injury"]', '[]', '24-48 hours'),

  -- Virtual Care
  ('PROB-026', 'Mental Health Follow-up', 'F32.1', 'mental_health', 2, 4, 'virtual', '["ongoing depression or anxiety","medication side effects","sleep issues","mood changes"]', '["suicidal ideation","self-harm","psychosis","substance abuse crisis"]', '["F41.1","F32.1"]', '1-2 weeks'),
  ('PROB-027', 'Prescription Renewal Consultation', 'Z76.0', 'chronic', 1, 5, 'virtual', '["need to renew prescription","stable on medication","no new symptoms"]', '[]', '[]', '1-5 days'),
  ('PROB-028', 'Post-Surgical Follow-up', 'Z09', 'acute', 1, 5, 'virtual', '["healing well","no infection signs","routine post-op check","activity questions"]', '["wound infection signs","increased pain","wound opening"]', '[]', 'per protocol'),
  ('PROB-029', 'Mild Cold/Flu Assessment', 'J06.9', 'acute', 1, 5, 'virtual', '["mild congestion","low-grade fever","body aches","wanting guidance"]', '["high fever over 3 days","difficulty breathing","unable to keep fluids down"]', '[]', 'same-day'),
  ('PROB-030', 'Chronic Disease Monitoring', 'Z09', 'chronic', 1, 5, 'virtual', '["routine check-in","reviewing home readings","blood pressure logs","glucose readings"]', '["BP over 180/120","glucose over 20 mmol/L","rapid weight gain with edema"]', '["E11.9","I10","I50.9"]', '1-4 weeks'),

  -- Pharmacy / Self-Care
  ('PROB-031', 'Common Cold Symptoms', 'J00', 'acute', 1, 5, 'pharmacy', '["mild congestion","sneezing","runny nose","mild sore throat","no fever"]', '["symptoms lasting over 10 days","worsening after improvement","high fever"]', '[]', 'self-manage'),
  ('PROB-032', 'Mild Muscle Ache', 'M79.1', 'acute', 1, 5, 'self_care', '["soreness after activity","mild stiffness","no swelling","improves with rest"]', '["severe pain","swelling","dark urine","fever","not improving after 1 week"]', '[]', 'self-manage'),
  ('PROB-033', 'Mild Seasonal Allergies', 'J30.1', 'chronic', 1, 5, 'pharmacy', '["sneezing","watery itchy eyes","runny nose","nasal congestion","seasonal pattern"]', '["wheezing","difficulty breathing"]', '["J45"]', 'self-manage'),
  ('PROB-034', 'Mild Heartburn', 'K21.0', 'chronic', 1, 5, 'pharmacy', '["burning after meals","sour taste","discomfort lying down"]', '["severe chest pain","difficulty swallowing","weight loss","vomiting blood"]', '[]', 'self-manage'),
  ('PROB-035', 'Minor Cuts and Scrapes', 'T14.0', 'acute', 1, 5, 'self_care', '["small wound under 1cm","superficial","bleeding controlled with pressure"]', '["bleeding wont stop after 10 min","deep wound","wound edges gaping"]', '[]', 'self-manage');

-- ============================================================
-- CarePoint — Staff (ALL MOCK/SYNTHETIC)
-- ============================================================

INSERT OR IGNORE INTO staff (id, first_name, last_name, role, department, facility_id, is_client_facing, skills, shift_pattern, on_duty)
VALUES
  -- Royal Jubilee Hospital
  ('STAFF-001', 'Dr. Sarah', 'Okonkwo (MOCK)', 'Emergency Physician', 'Emergency', 'FAC-001', 1, '["emergency_medicine","trauma","ACLS","intubation"]', '12h rotating', 1),
  ('STAFF-002', 'Dr. Michael', 'Park (MOCK)', 'Emergency Physician', 'Emergency', 'FAC-001', 1, '["emergency_medicine","pediatric_emergency","procedural_sedation"]', '12h rotating', 0),
  ('STAFF-003', 'Nurse Jennifer', 'Walsh (MOCK)', 'Triage Nurse', 'Emergency', 'FAC-001', 1, '["CTAS_assessment","crisis_communication","rapid_assessment"]', '12h rotating', 1),
  ('STAFF-004', 'Nurse Priya', 'Sharma (MOCK)', 'Registered Nurse', 'Emergency', 'FAC-001', 1, '["IV_therapy","wound_care","medication_admin","cardiac_monitoring"]', '12h rotating', 1),
  ('STAFF-005', 'Dr. Wei', 'Chen (MOCK)', 'Cardiologist', 'Cardiology', 'FAC-001', 1, '["cardiac_catheterization","echocardiography","heart_failure"]', 'Weekday + on-call', 1),
  ('STAFF-006', 'Marie', 'Fontaine (MOCK)', 'Social Worker', 'Discharge Planning', 'FAC-001', 1, '["discharge_planning","crisis_intervention","community_resources"]', 'Weekday 8-5', 1),

  -- Victoria General Hospital
  ('STAFF-007', 'Dr. Michael', 'Torres (MOCK)', 'Emergency Physician', 'Emergency', 'FAC-002', 1, '["emergency_medicine","orthopedic_emergencies"]', '12h rotating', 1),
  ('STAFF-008', 'Nurse Alex', 'Tremblay (MOCK)', 'Nurse Practitioner', 'Primary Care', 'FAC-002', 1, '["independent_prescribing","chronic_disease","health_assessment"]', 'Weekday 8-6', 1),

  -- Saanich Peninsula Hospital
  ('STAFF-009', 'Dr. Lisa', 'Nakamura (MOCK)', 'Emergency Physician', 'Emergency', 'FAC-003', 1, '["emergency_medicine","rural_medicine"]', '12h rotating', 1),

  -- Westshore Urgent Care
  ('STAFF-010', 'Dr. James', 'Patel (MOCK)', 'Physician', 'Urgent Care', 'FAC-004', 1, '["sutures","fracture_management","wound_care","xray_interpretation"]', '10h shift', 1),
  ('STAFF-011', 'Nurse Kelly', 'Morgan (MOCK)', 'Registered Nurse', 'Urgent Care', 'FAC-004', 1, '["triage","IV_therapy","wound_care","nebulizer"]', '10h shift', 1),

  -- Walk-in Clinic
  ('STAFF-012', 'Dr. Emily', 'Wong (MOCK)', 'Family Physician', 'Clinic', 'FAC-008', 1, '["primary_care","minor_procedures","referrals"]', 'Weekday 8-8', 1),

  -- Cool Aid Community Health
  ('STAFF-013', 'NP Chris', 'Daniels (MOCK)', 'Nurse Practitioner', 'Primary Care', 'FAC-019', 1, '["primary_care","newcomer_health","addictions","mental_health"]', 'Weekday 8-6', 1),
  ('STAFF-014', 'Rosa', 'Martinez (MOCK)', 'Patient Navigator', 'Community Support', 'FAC-019', 1, '["system_navigation","multilingual_spanish_tagalog","cultural_competency","resource_connection"]', 'Weekday 9-5', 1),
  ('STAFF-015', 'David', 'Thompson (MOCK)', 'Social Worker', 'Social Services', 'FAC-019', 1, '["housing_support","financial_navigation","crisis_support","newcomer_services"]', 'Weekday 8-5', 1),

  -- Pharmacy
  ('STAFF-016', 'Dr. Amir', 'Khalil (MOCK)', 'Pharmacist', 'Pharmacy', 'FAC-033', 1, '["medication_counseling","vaccination","minor_ailment_assessment","drug_interactions"]', 'Rotating 8-10', 1),

  -- Telehealth
  ('STAFF-017', 'Dr. Karen', 'Singh (MOCK)', 'Physician', 'Virtual Care', 'FAC-045', 1, '["telehealth","primary_care","prescription_renewal","mental_health_screening"]', 'Rotating 24/7', 1),

  -- Crisis Care Centre
  ('STAFF-018', 'Dr. Robert', 'Nguyen (MOCK)', 'Psychiatrist', 'Mental Health', 'FAC-026', 1, '["psychiatric_assessment","crisis_intervention","psychopharmacology","risk_assessment"]', 'Weekday + on-call', 1),
  ('STAFF-019', 'Nurse Sarah', 'Mitchell (MOCK)', 'Psychiatric Nurse', 'Mental Health', 'FAC-026', 1, '["mental_health_assessment","crisis_stabilization","safety_planning","de-escalation"]', '12h rotating', 1),
  ('STAFF-020', 'Jake', 'Rivera (MOCK)', 'Peer Support Worker', 'Mental Health', 'FAC-026', 1, '["lived_experience","peer_support","crisis_support","recovery_planning"]', 'Rotating', 1),

  -- Indigenous Health
  ('STAFF-021', 'Elder Mary', 'Williams (MOCK)', 'Elder / Traditional Healer', 'Indigenous Health', 'FAC-048', 1, '["traditional_healing","cultural_guidance","ceremony","elder_support"]', 'Weekday 9-5', 1),
  ('STAFF-022', 'Tom', 'Joseph (MOCK)', 'Community Health Worker', 'Indigenous Health', 'FAC-048', 1, '["nihb_navigation","cultural_liaison","health_education","community_outreach"]', 'Weekday 9-5', 1);

-- ============================================================
-- CarePoint — Initial System State (ALL MOCK/SYNTHETIC)
-- ============================================================

INSERT OR IGNORE INTO system_state (id, facility_id, metric_name, metric_value, recorded_at)
VALUES
  -- Hospitals
  ('SS-001', 'FAC-001', 'er_load_pct', 92.0, '2026-03-28T10:00:00Z'),
  ('SS-002', 'FAC-001', 'wait_minutes', 180.0, '2026-03-28T10:00:00Z'),
  ('SS-003', 'FAC-001', 'beds_available', 40.0, '2026-03-28T10:00:00Z'),
  ('SS-004', 'FAC-002', 'er_load_pct', 78.0, '2026-03-28T10:00:00Z'),
  ('SS-005', 'FAC-002', 'wait_minutes', 120.0, '2026-03-28T10:00:00Z'),
  ('SS-006', 'FAC-002', 'beds_available', 40.0, '2026-03-28T10:00:00Z'),
  ('SS-007', 'FAC-003', 'er_load_pct', 65.0, '2026-03-28T10:00:00Z'),
  ('SS-008', 'FAC-003', 'wait_minutes', 45.0, '2026-03-28T10:00:00Z'),
  ('SS-009', 'FAC-003', 'beds_available', 26.0, '2026-03-28T10:00:00Z'),
  -- Urgent Care
  ('SS-010', 'FAC-004', 'load_pct', 56.0, '2026-03-28T10:00:00Z'),
  ('SS-011', 'FAC-004', 'wait_minutes', 30.0, '2026-03-28T10:00:00Z'),
  ('SS-012', 'FAC-005', 'load_pct', 60.0, '2026-03-28T10:00:00Z'),
  ('SS-013', 'FAC-005', 'wait_minutes', 35.0, '2026-03-28T10:00:00Z'),
  ('SS-014', 'FAC-006', 'load_pct', 55.0, '2026-03-28T10:00:00Z'),
  ('SS-015', 'FAC-006', 'wait_minutes', 40.0, '2026-03-28T10:00:00Z'),
  ('SS-016', 'FAC-007', 'load_pct', 50.0, '2026-03-28T10:00:00Z'),
  ('SS-017', 'FAC-007', 'wait_minutes', 25.0, '2026-03-28T10:00:00Z'),
  -- Walk-in Clinics (sample)
  ('SS-018', 'FAC-008', 'load_pct', 67.0, '2026-03-28T10:00:00Z'),
  ('SS-019', 'FAC-008', 'wait_minutes', 45.0, '2026-03-28T10:00:00Z'),
  ('SS-020', 'FAC-009', 'load_pct', 60.0, '2026-03-28T10:00:00Z'),
  ('SS-021', 'FAC-009', 'wait_minutes', 50.0, '2026-03-28T10:00:00Z'),
  ('SS-022', 'FAC-012', 'load_pct', 50.0, '2026-03-28T10:00:00Z'),
  ('SS-023', 'FAC-012', 'wait_minutes', 35.0, '2026-03-28T10:00:00Z'),
  ('SS-024', 'FAC-016', 'load_pct', 38.0, '2026-03-28T10:00:00Z'),
  ('SS-025', 'FAC-016', 'wait_minutes', 25.0, '2026-03-28T10:00:00Z'),
  -- Community Health
  ('SS-026', 'FAC-019', 'load_pct', 80.0, '2026-03-28T10:00:00Z'),
  ('SS-027', 'FAC-019', 'wait_minutes', 60.0, '2026-03-28T10:00:00Z'),
  ('SS-028', 'FAC-020', 'load_pct', 60.0, '2026-03-28T10:00:00Z'),
  ('SS-029', 'FAC-020', 'wait_minutes', 20.0, '2026-03-28T10:00:00Z'),
  -- Mental Health / Crisis
  ('SS-030', 'FAC-026', 'load_pct', 45.0, '2026-03-28T10:00:00Z'),
  ('SS-031', 'FAC-026', 'wait_minutes', 20.0, '2026-03-28T10:00:00Z'),
  ('SS-032', 'FAC-029', 'load_pct', 53.0, '2026-03-28T10:00:00Z'),
  ('SS-033', 'FAC-029', 'wait_minutes', 15.0, '2026-03-28T10:00:00Z'),
  -- Pharmacies (sample)
  ('SS-034', 'FAC-033', 'load_pct', 20.0, '2026-03-28T10:00:00Z'),
  ('SS-035', 'FAC-033', 'wait_minutes', 5.0, '2026-03-28T10:00:00Z'),
  ('SS-036', 'FAC-038', 'load_pct', 24.0, '2026-03-28T10:00:00Z'),
  ('SS-037', 'FAC-038', 'wait_minutes', 10.0, '2026-03-28T10:00:00Z'),
  -- Virtual
  ('SS-038', 'FAC-045', 'load_pct', 30.0, '2026-03-28T10:00:00Z'),
  ('SS-039', 'FAC-045', 'wait_minutes', 10.0, '2026-03-28T10:00:00Z'),
  -- Indigenous Health
  ('SS-040', 'FAC-048', 'load_pct', 35.0, '2026-03-28T10:00:00Z'),
  ('SS-041', 'FAC-048', 'wait_minutes', 15.0, '2026-03-28T10:00:00Z');
