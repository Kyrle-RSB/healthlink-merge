# Patient Problems — Medical Conditions Reference

> Exhaustive catalog of medical conditions patients present with. Each condition includes clinical coding, severity, appropriate care destination, symptoms, and escalation triggers. ALL DATA IS MOCK/SYNTHETIC — for hackathon routing logic only.

---

## Data Structure

Each condition has:
- **Title** — common name
- **ICD-10-CA Code** — Canadian classification
- **Type** — acute, chronic, emergency, mental_health
- **Severity** — 1 (mild) to 5 (life-threatening)
- **CTAS Level** — Canadian Triage and Acuity Scale 1-5
- **Recommended Destination** — er, urgent_care, clinic, virtual, pharmacy, self_care, mental_health_crisis
- **Symptoms** — what the patient describes
- **Red Flags** — symptoms that escalate routing to ER regardless
- **Related Conditions** — comorbidities that affect routing
- **Wait Tolerance** — how long this can safely wait for care

---

## ER-Required (CTAS 1-2) — 8 Conditions

### PROB-001: Chest Pain / Suspected Myocardial Infarction
- **ICD-10:** I21.9
- **Type:** emergency
- **Severity:** 5
- **CTAS:** 1
- **Destination:** er
- **Symptoms:** chest pressure or squeezing, left arm or jaw pain, shortness of breath, diaphoresis (sweating), nausea, dizziness, sense of impending doom
- **Red Flags:** pain radiating to left arm/jaw, crushing chest pressure, sudden onset, history of cardiac disease
- **Related Conditions:** hypertension (I10), hyperlipidemia (E78.5), diabetes (E11.9), previous MI
- **Wait Tolerance:** immediate — call 911

### PROB-002: Stroke Symptoms (CVA)
- **ICD-10:** I63.9
- **Type:** emergency
- **Severity:** 5
- **CTAS:** 1
- **Destination:** er
- **Symptoms:** facial drooping, arm weakness (one side), speech difficulty or slurring, sudden confusion, sudden severe headache, vision loss, loss of balance
- **Red Flags:** any FAST symptoms (Face, Arms, Speech, Time), sudden onset of any neurological deficit
- **Related Conditions:** atrial fibrillation (I48.91), hypertension (I10), diabetes (E11.9)
- **Wait Tolerance:** immediate — time-critical (tPA window 3-4.5 hours)

### PROB-003: Severe Allergic Reaction / Anaphylaxis
- **ICD-10:** T78.2
- **Type:** emergency
- **Severity:** 5
- **CTAS:** 1
- **Destination:** er
- **Symptoms:** throat swelling, difficulty breathing, wheezing, widespread hives, rapid pulse, dizziness, nausea/vomiting, feeling of doom
- **Red Flags:** airway compromise, tongue/throat swelling, blood pressure drop, loss of consciousness
- **Related Conditions:** known allergies, previous anaphylaxis, asthma
- **Wait Tolerance:** immediate — use EpiPen if available, call 911

### PROB-004: Major Trauma / Severe Injury
- **ICD-10:** S72.009A (hip fracture example)
- **Type:** emergency
- **Severity:** 5
- **CTAS:** 1
- **Destination:** er
- **Symptoms:** visible deformity, severe pain, inability to move limb, visible bone/deep wound, significant bleeding, loss of consciousness after impact
- **Red Flags:** head injury with confusion, spinal pain after fall, uncontrolled bleeding, loss of sensation, mechanism of injury (MVA, fall from height)
- **Related Conditions:** anticoagulant use, osteoporosis (M81.0), bleeding disorders
- **Wait Tolerance:** immediate — stabilize and transport

### PROB-005: Severe Breathing Difficulty / Respiratory Failure
- **ICD-10:** J96.00
- **Type:** emergency
- **Severity:** 5
- **CTAS:** 1
- **Destination:** er
- **Symptoms:** gasping for air, blue lips/fingertips (cyanosis), unable to speak full sentences, chest retractions, using accessory muscles to breathe, altered consciousness
- **Red Flags:** cyanosis, inability to speak, altered mental status, respiratory rate > 30, oxygen saturation < 90%
- **Related Conditions:** COPD (J44.1), asthma (J45), heart failure (I50.9), pneumonia (J18.9)
- **Wait Tolerance:** immediate — call 911

### PROB-006: Severe Abdominal Pain with Fever
- **ICD-10:** R10.0
- **Type:** emergency
- **Severity:** 4
- **CTAS:** 2
- **Destination:** er
- **Symptoms:** intense abdominal pain, rigid abdomen, rebound tenderness, fever > 38.5C, vomiting, inability to eat/drink, blood in stool
- **Red Flags:** rigid abdomen (possible peritonitis), fever + severe pain (possible appendicitis/perforation), blood in vomit/stool
- **Related Conditions:** previous abdominal surgery, Crohn's disease (K50), ulcerative colitis (K51)
- **Wait Tolerance:** within 1-2 hours — needs urgent assessment

### PROB-007: Active Seizure / Status Epilepticus
- **ICD-10:** G40.909
- **Type:** emergency
- **Severity:** 5
- **CTAS:** 1
- **Destination:** er
- **Symptoms:** convulsions, loss of consciousness, tongue biting, incontinence, confusion after seizure, repetitive movements
- **Red Flags:** seizure lasting > 5 minutes, multiple seizures without recovery, first-ever seizure, seizure with head injury, seizure in pregnancy
- **Related Conditions:** epilepsy (G40), brain tumor, metabolic disorders, alcohol withdrawal
- **Wait Tolerance:** immediate — call 911

### PROB-008: Overdose / Poisoning
- **ICD-10:** T50.901A
- **Type:** emergency
- **Severity:** 5
- **CTAS:** 1
- **Destination:** er
- **Symptoms:** altered consciousness, respiratory depression, confusion, vomiting, seizures, pinpoint or dilated pupils, slurred speech
- **Red Flags:** unresponsive, not breathing, seizures, unknown substance, intentional self-harm
- **Related Conditions:** substance use disorder, mental health conditions, chronic pain
- **Wait Tolerance:** immediate — call 911, administer naloxone if opioid suspected

---

## Urgent Care Appropriate (CTAS 3-4) — 8 Conditions

### PROB-009: Minor Laceration Needing Sutures
- **ICD-10:** S01.80XA
- **Type:** acute
- **Severity:** 2
- **CTAS:** 4
- **Destination:** urgent_care
- **Symptoms:** clean cut > 1cm, controlled bleeding, visible subcutaneous tissue, wound edges gaping
- **Red Flags:** uncontrolled bleeding, deep wound with tendon/nerve involvement, wound on face/hand/joint, embedded foreign body
- **Related Conditions:** anticoagulant use, diabetes (wound healing), immunocompromised
- **Wait Tolerance:** 4-6 hours (clean wound), 1-2 hours (contaminated)

### PROB-010: Suspected Minor Fracture
- **ICD-10:** S62.009A
- **Type:** acute
- **Severity:** 3
- **CTAS:** 3
- **Destination:** urgent_care
- **Symptoms:** swelling, bruising, pain with movement, point tenderness, limited range of motion, possible deformity
- **Red Flags:** visible bone, loss of sensation below injury, no pulse below injury, open fracture, inability to bear any weight
- **Related Conditions:** osteoporosis (M81.0), anticoagulant use
- **Wait Tolerance:** 2-4 hours — ice and elevate while waiting

### PROB-011: Moderate Asthma Exacerbation
- **ICD-10:** J45.41
- **Type:** acute
- **Severity:** 3
- **CTAS:** 3
- **Destination:** urgent_care
- **Symptoms:** wheezing, chest tightness, shortness of breath on exertion, reduced peak flow (50-80% personal best), cough, difficulty sleeping due to breathing
- **Red Flags:** inability to speak sentences, peak flow < 50%, blue lips, no improvement with reliever inhaler, drowsiness/confusion
- **Related Conditions:** COPD, allergies, upper respiratory infection
- **Wait Tolerance:** 1-2 hours — use reliever inhaler while waiting

### PROB-012: Complicated Urinary Tract Infection
- **ICD-10:** N39.0
- **Type:** acute
- **Severity:** 2
- **CTAS:** 3
- **Destination:** urgent_care
- **Symptoms:** flank pain, fever > 38C, frequent and painful urination, blood in urine, nausea/vomiting, chills
- **Red Flags:** high fever (> 39C), severe flank pain, rigors (shaking chills), pregnancy, immunocompromised, diabetic
- **Related Conditions:** diabetes (E11.9), kidney stones (N20), pregnancy
- **Wait Tolerance:** 2-4 hours — needs antibiotics relatively soon

### PROB-013: Moderate Allergic Reaction
- **ICD-10:** T78.40
- **Type:** acute
- **Severity:** 3
- **CTAS:** 3
- **Destination:** urgent_care
- **Symptoms:** widespread hives/urticaria, itching, mild facial swelling (no airway), localized angioedema, mild nausea
- **Red Flags:** any throat tightness, voice changes, tongue swelling, difficulty breathing, dizziness (escalate to ER — PROB-003)
- **Related Conditions:** known allergies, asthma, previous anaphylaxis
- **Wait Tolerance:** 1-2 hours — take antihistamine, monitor for progression

### PROB-014: Animal or Insect Bite
- **ICD-10:** S01.85XA
- **Type:** acute
- **Severity:** 2
- **CTAS:** 4
- **Destination:** urgent_care
- **Symptoms:** puncture wound, swelling, redness, pain, possible bleeding, concern about infection or rabies
- **Red Flags:** bite from unknown/wild animal (rabies risk), deep puncture to hand/face, signs of infection (red streaks, pus, fever), snake bite
- **Related Conditions:** immunocompromised, diabetes, anticoagulant use
- **Wait Tolerance:** 4-8 hours (clean bite), 1-2 hours (high-risk bite)

### PROB-015: Minor Burns (< 10% BSA)
- **ICD-10:** T30.0
- **Type:** acute
- **Severity:** 3
- **CTAS:** 3
- **Destination:** urgent_care
- **Symptoms:** redness, blistering, pain, swelling, skin peeling
- **Red Flags:** burns to face/hands/feet/genitals, circumferential burns, chemical or electrical burns, inhalation injury, burn > 10% body surface area
- **Related Conditions:** diabetes (healing), immunocompromised
- **Wait Tolerance:** 2-4 hours — cool with running water for 20 min, cover with clean cloth

### PROB-016: Foreign Body (Ear/Nose/Eye Surface)
- **ICD-10:** T17.1
- **Type:** acute
- **Severity:** 2
- **CTAS:** 4
- **Destination:** urgent_care
- **Symptoms:** discomfort, sensation of something stuck, tearing (eye), hearing change (ear), nasal discharge/bleeding
- **Red Flags:** penetrating eye injury, button battery in nose/ear (chemical burn risk), complete airway obstruction, sharp object
- **Related Conditions:** none typically
- **Wait Tolerance:** 2-6 hours (non-battery), 1 hour (battery in nose/ear)

---

## Walk-in Clinic / Family Doctor (CTAS 4-5) — 9 Conditions

### PROB-017: Upper Respiratory Infection (Cold/Flu)
- **ICD-10:** J06.9
- **Type:** acute
- **Severity:** 1
- **CTAS:** 5
- **Destination:** clinic
- **Symptoms:** cough, runny nose, sore throat, mild fever (< 38.5C), body aches, sneezing, nasal congestion, fatigue
- **Red Flags:** high fever (> 39C) lasting > 3 days, difficulty breathing, chest pain, confusion, inability to keep fluids down
- **Related Conditions:** asthma, COPD, immunocompromised, elderly
- **Wait Tolerance:** 24-48 hours — rest and fluids

### PROB-018: Ear Infection / Otitis Media
- **ICD-10:** H66.90
- **Type:** acute
- **Severity:** 2
- **CTAS:** 4
- **Destination:** clinic
- **Symptoms:** ear pain, fever, reduced hearing, fluid drainage from ear, irritability (children), pulling at ear
- **Red Flags:** severe pain with high fever, swelling behind ear (mastoiditis), facial weakness, neck stiffness
- **Related Conditions:** recent URI, allergies, recurrent ear infections
- **Wait Tolerance:** 24-48 hours — pain relief with OTC meds

### PROB-019: Simple Urinary Tract Infection
- **ICD-10:** N39.0
- **Type:** acute
- **Severity:** 2
- **CTAS:** 4
- **Destination:** clinic
- **Symptoms:** burning urination, frequency, urgency, cloudy urine, mild lower abdominal discomfort, no fever
- **Red Flags:** fever, flank pain, blood in urine, nausea/vomiting (escalate to PROB-012 urgent care)
- **Related Conditions:** diabetes, pregnancy, recurrent UTIs, kidney stones
- **Wait Tolerance:** 24-48 hours — increase fluid intake

### PROB-020: Skin Rash / Dermatitis
- **ICD-10:** L30.9
- **Type:** acute
- **Severity:** 1
- **CTAS:** 5
- **Destination:** clinic
- **Symptoms:** itching, redness, dry patches, bumps or blisters, flaking skin, localized swelling
- **Red Flags:** rapidly spreading rash with fever, purple spots that don't blanch (petechiae), blistering over large area, rash after new medication
- **Related Conditions:** allergies, eczema, psoriasis, autoimmune conditions
- **Wait Tolerance:** days to weeks depending on severity

### PROB-021: Non-traumatic Back Pain
- **ICD-10:** M54.5
- **Type:** acute
- **Severity:** 2
- **CTAS:** 4
- **Destination:** clinic
- **Symptoms:** muscle ache, stiffness, limited range of motion, pain worse with movement, pain localized to lower/upper back
- **Red Flags:** loss of bladder/bowel control (cauda equina), weakness in legs, fever with back pain, pain after significant trauma, unrelenting pain not relieved by rest
- **Related Conditions:** osteoarthritis, disc herniation, osteoporosis, kidney stones
- **Wait Tolerance:** 24-72 hours — OTC pain relief, ice/heat, gentle movement

### PROB-022: Non-emergent Headache
- **ICD-10:** R51.9
- **Type:** acute
- **Severity:** 2
- **CTAS:** 4
- **Destination:** clinic
- **Symptoms:** gradual onset, tension-type (band-like), mild to moderate intensity, no vision changes, responsive to OTC medication
- **Red Flags:** thunderclap headache (worst ever, sudden), fever + stiff neck, vision changes, confusion, headache after head injury, progressively worsening over days
- **Related Conditions:** migraine, tension headache, hypertension, medication overuse
- **Wait Tolerance:** 24-48 hours — OTC pain relief, rest, hydrate

### PROB-023: Medication Refill Needed
- **ICD-10:** Z76.0
- **Type:** chronic
- **Severity:** 1
- **CTAS:** 5
- **Destination:** clinic
- **Symptoms:** running low on regular medication, no acute symptoms, stable condition
- **Red Flags:** completely out of critical medication (insulin, blood thinners, seizure meds, cardiac meds) — escalate urgency
- **Related Conditions:** whatever condition the medication treats
- **Wait Tolerance:** depends on medication — insulin/cardiac = same day, others = 1-3 days

### PROB-024: Chronic Condition Follow-up
- **ICD-10:** Z09
- **Type:** chronic
- **Severity:** 1
- **CTAS:** 5
- **Destination:** clinic
- **Symptoms:** routine check for diabetes, hypertension, cholesterol, thyroid, etc. No acute symptoms.
- **Red Flags:** new symptoms (chest pain, vision changes, numbness, severe fatigue) — reassess routing
- **Related Conditions:** diabetes, hypertension, heart failure, COPD, thyroid disease
- **Wait Tolerance:** 1-4 weeks for routine; same week if overdue for critical monitoring (e.g., A1C > 6 months overdue)

### PROB-025: Sprained Ankle or Wrist
- **ICD-10:** S93.401A
- **Type:** acute
- **Severity:** 2
- **CTAS:** 4
- **Destination:** clinic
- **Symptoms:** swelling, bruising, pain with movement, able to bear some weight (ankle), tenderness over ligaments
- **Red Flags:** unable to bear any weight (possible fracture — escalate to urgent care), severe deformity, numbness below injury
- **Related Conditions:** previous sprains, hypermobility
- **Wait Tolerance:** 24-48 hours — RICE (rest, ice, compression, elevation)

---

## Virtual Care / Telehealth (5 Conditions)

### PROB-026: Mental Health Follow-up
- **ICD-10:** F32.1
- **Type:** mental_health
- **Severity:** 2
- **CTAS:** 4
- **Destination:** virtual
- **Symptoms:** ongoing depression or anxiety symptoms, medication side effects to discuss, therapy progress check, sleep issues, mood changes
- **Red Flags:** suicidal ideation or self-harm (escalate to mental_health_crisis or ER), psychosis, substance abuse crisis
- **Related Conditions:** depression, anxiety, PTSD, bipolar disorder
- **Wait Tolerance:** 1-2 weeks routine, same-day if medication issues or worsening

### PROB-027: Prescription Renewal Consultation
- **ICD-10:** Z76.0
- **Type:** chronic
- **Severity:** 1
- **CTAS:** 5
- **Destination:** virtual
- **Symptoms:** need to renew existing prescription, stable on current medication, no new symptoms
- **Red Flags:** none typically — but if new symptoms arise, reassess
- **Related Conditions:** whatever is being treated
- **Wait Tolerance:** 1-5 days depending on medication type

### PROB-028: Post-Surgical Follow-up
- **ICD-10:** Z09
- **Type:** acute
- **Severity:** 1
- **CTAS:** 5
- **Destination:** virtual
- **Symptoms:** healing well, no signs of infection, routine post-op check, questions about activity restrictions
- **Red Flags:** wound infection signs (redness spreading, pus, fever), increased pain, wound dehiscence — escalate to clinic or urgent care
- **Related Conditions:** surgical procedure specific
- **Wait Tolerance:** per surgical protocol (typically 1-2 weeks post-op)

### PROB-029: Mild Cold/Flu Assessment
- **ICD-10:** J06.9
- **Type:** acute
- **Severity:** 1
- **CTAS:** 5
- **Destination:** virtual
- **Symptoms:** mild congestion, low-grade fever, body aches, wanting guidance on self-care, concern about COVID/flu/RSV
- **Red Flags:** high fever > 3 days, difficulty breathing, unable to keep fluids down — escalate
- **Related Conditions:** immunocompromised, elderly, chronic lung disease
- **Wait Tolerance:** same-day or next-day virtual appointment

### PROB-030: Chronic Disease Monitoring
- **ICD-10:** Z09
- **Type:** chronic
- **Severity:** 1
- **CTAS:** 5
- **Destination:** virtual
- **Symptoms:** routine check-in, reviewing home blood pressure logs, glucose readings, weight tracking, symptom diary
- **Red Flags:** significantly abnormal readings (BP > 180/120, glucose > 20 mmol/L, rapid weight gain with edema)
- **Related Conditions:** diabetes, hypertension, heart failure, COPD
- **Wait Tolerance:** 1-4 weeks

---

## Pharmacy / Self-Care (5 Conditions)

### PROB-031: Common Cold Symptoms
- **ICD-10:** J00
- **Type:** acute
- **Severity:** 1
- **CTAS:** 5
- **Destination:** pharmacy
- **Symptoms:** mild nasal congestion, sneezing, runny nose, mild sore throat, no fever or very low-grade (< 37.8C)
- **Red Flags:** symptoms lasting > 10 days, worsening after initial improvement, high fever
- **Related Conditions:** allergies (may mimic cold)
- **Wait Tolerance:** self-manage — pharmacist can recommend OTC treatment

### PROB-032: Mild Muscle Ache / Soreness
- **ICD-10:** M79.1
- **Type:** acute
- **Severity:** 1
- **CTAS:** 5
- **Destination:** self_care
- **Symptoms:** soreness after activity or exercise, mild stiffness, no swelling, pain improves with rest
- **Red Flags:** severe pain, swelling, dark-colored urine (rhabdomyolysis), fever, pain not improving after 1 week
- **Related Conditions:** fibromyalgia, overuse injury
- **Wait Tolerance:** self-manage with rest, OTC pain relief, gentle stretching

### PROB-033: Mild Seasonal Allergies
- **ICD-10:** J30.1
- **Type:** chronic
- **Severity:** 1
- **CTAS:** 5
- **Destination:** pharmacy
- **Symptoms:** sneezing, watery/itchy eyes, runny nose, nasal congestion, seasonal pattern
- **Red Flags:** wheezing, difficulty breathing (may indicate asthma component — escalate)
- **Related Conditions:** asthma, eczema
- **Wait Tolerance:** self-manage — pharmacist can recommend antihistamines

### PROB-034: Mild Heartburn / Acid Reflux
- **ICD-10:** K21.0
- **Type:** chronic
- **Severity:** 1
- **CTAS:** 5
- **Destination:** pharmacy
- **Symptoms:** burning sensation in chest after meals, sour taste in mouth, mild discomfort when lying down
- **Red Flags:** severe chest pain (could be cardiac — escalate to ER), difficulty swallowing, unintentional weight loss, vomiting blood
- **Related Conditions:** GERD, hiatal hernia, obesity
- **Wait Tolerance:** self-manage — pharmacist can recommend antacids/PPIs

### PROB-035: Minor Cuts and Scrapes
- **ICD-10:** T14.0
- **Type:** acute
- **Severity:** 1
- **CTAS:** 5
- **Destination:** self_care
- **Symptoms:** small wound < 1cm, superficial, no deep tissue visible, bleeding easily controlled with pressure
- **Red Flags:** wound won't stop bleeding after 10 min pressure, deep wound, wound edges gaping (needs sutures — escalate to urgent care)
- **Related Conditions:** diabetes (healing), anticoagulant use (bleeding)
- **Wait Tolerance:** self-manage — clean, apply pressure, bandage, watch for infection signs
