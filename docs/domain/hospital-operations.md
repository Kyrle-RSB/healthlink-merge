# Hospital Operations — How Healthcare Facilities Work

> Reference document for CarePoint routing logic. Covers how patients flow through the healthcare system, how departments interact, and where the system breaks down. ALL DATA IS MOCK/SYNTHETIC.

---

## 1. Emergency Department Flow

### Patient Journey Through the ER

```
Patient Arrives (walk-in, ambulance, or referral)
    |
Registration / Check-in
    | (name, health card, chief complaint)
    |
Triage Assessment (Triage Nurse)
    | Assigns CTAS level (1-5)
    | Takes vital signs
    | Brief clinical assessment
    | Initiates basic interventions if needed
    |
+---+---+---+---+---+
|   |   |   |   |   |
CTAS 1  CTAS 2  CTAS 3  CTAS 4  CTAS 5
Immediate  <=15min  <=30min  <=60min  <=120min
Resus bay  Monitored  Acute area  Fast track  Fast track
    |
Physician Assessment
    | History, physical exam
    | Orders investigations
    |
Investigations
    | Blood work -> Lab (results in 30-90 min)
    | Imaging -> X-ray (30 min), CT (1-2h), Ultrasound (1-4h)
    | ECG -> immediate
    | Point-of-care testing -> 5-15 min
    |
Reassessment with Results
    | Physician reviews all results
    | Consults specialist if needed (can add hours)
    |
Disposition Decision
    +---+---+---+---+
    |   |   |   |   |
Discharge  Admit  Transfer  Leave AMA  LWBS
    |        |       |          |         |
Home with    Wait for   To higher   Patient   Left Without
instructions  bed       level care  leaves    Being Seen
    |        |
    |     Bed assigned -> Unit
    |     (Can wait 12-24h for bed)
    |
Follow-up Instructions
    | Discharge summary
    | Prescriptions
    | Follow-up appointments (often unfilled)
    | Warning signs to return
```

### Key Bottlenecks
1. **Triage to physician:** CTAS 4-5 patients wait 1-4+ hours
2. **Lab/imaging results:** Add 1-4 hours to visit
3. **Specialist consult:** Can add 2-8 hours (specialist may be at home, on-call)
4. **Bed wait (admitted patients):** 12-24+ hours in ER waiting for inpatient bed
5. **ALC patients:** Alternate Level of Care patients in hospital beds waiting for long-term care or home care — block beds from new admissions

### CTAS (Canadian Triage and Acuity Scale)

| Level | Name | Target Time to Physician | Examples |
|-------|------|--------------------------|----------|
| 1 | Resuscitation | Immediate | Cardiac arrest, major trauma, active seizure |
| 2 | Emergent | <=15 minutes | Chest pain, stroke symptoms, severe breathing difficulty, overdose |
| 3 | Urgent | <=30 minutes | Moderate abdominal pain, asthma attack, high fever with rash |
| 4 | Less Urgent | <=60 minutes | Sprained ankle, ear infection, minor laceration, UTI |
| 5 | Non-Urgent | <=120 minutes | Cold symptoms, medication refill, chronic issue follow-up |

### Why CarePoint Matters Here
- **30% of ER visits** could be managed elsewhere (CTAS 4-5)
- **13% leave without being seen** (LWBS) — the system failed them
- **Patients don't know CTAS levels** — they just know they're waiting
- **No visibility into alternatives** — ER feels like the only option
- CarePoint intercepts at CTAS 4-5 and offers faster, appropriate alternatives

---

## 2. Hospital Admission Flow

```
ER Physician orders admission
    |
Bed Management contacted
    | Checks bed availability by unit type
    | Medical (general), Surgical, ICU, Cardiac, Psych, Obstetrics
    |
+---+---+
|       |
Bed     No bed
available  available
    |       |
Patient     Patient waits in ER
transferred  (becomes "ER boarder")
to unit      Can wait 12-24+ hours
    |
Unit Nurse receives patient
    | Admission assessment
    | Medication reconciliation
    | Nursing care plan
    |
Attending Physician consulted
    | May be different from ER physician
    | Writes admission orders
    | Treatment plan
```

### Key Metrics
- **ER boarder time:** Hours spent in ER after admission decision (target: < 4h, reality: often 12-24h)
- **Bed occupancy:** > 85% = no surge capacity; many hospitals at 95-100%+
- **ALC rate:** 15-20% of hospital beds occupied by patients waiting for post-acute care

---

## 3. Discharge Flow

```
Physician writes discharge order
    |
Medication Reconciliation
    | Compare admission meds vs discharge meds
    | New prescriptions written
    | Patient counseled on changes
    |
Discharge Summary Written
    | Diagnosis, treatment, course
    | Medications at discharge
    | Follow-up plan
    | Pending results
    | (Often delayed — 34% reach family doctor within 48h)
    |
Patient Education
    | Discharge instructions (often 3+ pages of jargon)
    | Warning signs to return
    | Activity restrictions
    | (50% of patients don't understand their instructions)
    |
Follow-up Arranged
    | Family doctor follow-up (often "follow up with your doctor" — not actually booked)
    | Specialist follow-up if needed
    | Home care referral if needed
    | (50% have zero physician contact between discharge and readmission)
    |
Discharge Executed
    | Patient leaves
    | Room cleaned (environmental services)
    | Bed available for next patient
    |
Post-Discharge (THE GAP)
    | 18.4% readmitted within 30 days
    | Medication errors common
    | Caregiver often not informed
    | Discharge summary lost or delayed
```

### Where Care Falls Apart
1. **Discharge summary delay:** Only 34% reach the family doctor within 48 hours
2. **No one books follow-up:** "Follow up with your doctor" is not an appointment
3. **Patient confusion:** Discharge instructions are written for clinicians, not patients
4. **Caregiver gap:** Family/caregiver often not notified or included
5. **Medication errors:** Changes made in hospital not communicated to community pharmacy

### CarePoint Opportunity
- Post-discharge routing: "Your discharge instructions say follow up in 1 week. Let me find you an available provider."
- Caregiver notification: "Your mother was discharged today. Here's her care plan in plain language."

---

## 4. Referral Pathway

```
Family Doctor / NP identifies need for specialist
    |
Referral Written
    | Patient info, reason for referral, relevant history
    | Test results attached (ideally)
    |
Referral Sent
    +---+---+
    |       |
By Fax    By eReferral
(56% of   (growing but not universal)
referrals)
    |       |
Fax sent   Digital submission
No confirmation  Confirmation received
    |
Specialist Office Receives (or doesn't)
    +---+---+---+
    |       |       |
Accepted  Rejected  Lost/Never received
    |       |       |
Waitlisted  Faxed back  Nobody knows
    |       to referring  Patient thinks
    |       doctor        they're waiting
    |       (30% of       |
    |       rejections    REFERRAL BLACK HOLE
    |       reach patient)
    |
Wait (median: 28.6 weeks GP to treatment)
    |
Patient Notified of Appointment
    | (if they're lucky)
    |
Appointment Occurs
    |
Report Sent Back to Family Doctor
    | (often delayed or lost)
    |
Follow-up Plan
```

### The Numbers
- **50% of specialist referrals** are never completed
- **56% still sent by fax** in Canada
- **65% never result** in a scheduled appointment
- **69% of PCPs say** they send patient history — only **34% of specialists** actually receive it
- **$800K-$900K lost per physician** from referrals that never convert
- **Nearly 50% of malpractice claims** involve failure to follow up on referrals

### CarePoint Opportunity
- Referral tracking: show patient their referral status
- Smart routing: if specialist has long wait, suggest alternative specialist or facility
- Notification: alert patient when referral is received/rejected

---

## 5. Department Interactions

### ER Interactions
| ER Contacts | Why | Information Flow |
|-------------|-----|-----------------|
| Lab | Blood work, cultures | Orders -> results (30-90 min) |
| Medical Imaging | X-ray, CT, MRI, US | Orders -> images + report (30 min - 4h) |
| Pharmacy | Medications | Orders -> dispensing |
| Bed Management | Admission beds | Request -> availability -> assignment |
| Specialist on-call | Consults | Page -> assessment -> recommendations |
| Social Work | Discharge planning, crisis | Referral -> assessment |
| Psychiatry | Mental health crisis | Consult -> assessment -> disposition |
| Respiratory Therapy | Breathing support | Order -> treatment |

### Inpatient Unit Interactions
| Unit Contacts | Why | Information Flow |
|---------------|-----|-----------------|
| Pharmacy | Medication management | Orders -> verification -> dispensing |
| Lab | Ongoing bloodwork | Orders -> results -> physician notification |
| Medical Imaging | Scheduled scans | Booking -> transport -> scan -> report |
| Physiotherapy | Mobility/rehab | Referral -> assessment -> treatment plan |
| Social Work | Discharge planning | Referral -> planning -> community resources |
| Dietary | Nutrition | Diet orders -> meal delivery |
| Respiratory Therapy | Oxygen, ventilators | Orders -> management |
| Spiritual Care | Patient support | Request -> visit |

### Community Connections (Post-Discharge)
| Hospital Contacts | Community Provider | Information Flow |
|-------------------|-------------------|-----------------|
| Discharge planner | Family doctor | Discharge summary (fax/mail, often delayed) |
| Discharge planner | Home care | Referral for home visits |
| Discharge planner | Community pharmacy | New prescriptions (patient carries) |
| Social worker | Community services | Resource connections |
| Specialist | Family doctor | Consultation report (fax, often delayed) |

---

## 6. System Load Dynamics

### Daily ER Volume Patterns
```
Volume
  |         ****
  |       **    **
  |     **        **
  |   **            ***
  | **                 **
  |*                     ***
  +--+--+--+--+--+--+--+--+--+--+--+--+
  12  2  4  6  8  10 12  2  4  6  8  10
  AM              NOON              PM

Peak: 10am - 8pm (highest 12pm - 4pm)
Trough: 2am - 6am
Monday: highest volume day
Friday/Saturday evenings: trauma/alcohol-related spike
```

### Facility Availability Patterns
| Time | ER | Urgent Care | Walk-in | Virtual | Pharmacy |
|------|-----|-------------|---------|---------|----------|
| 6am-8am | Open (low load) | Closed | Closed | Open (low) | Opening |
| 8am-12pm | Moderate | Open (low-moderate) | Open (moderate) | Moderate | Open |
| 12pm-4pm | High (peak) | Moderate-High | High | Moderate | Open |
| 4pm-8pm | High | High | Closing | Moderate | Open |
| 8pm-10pm | High (trauma spike) | Closing | Closed | Low | Closing |
| 10pm-12am | Moderate | Closed | Closed | Low | Closed |
| 12am-6am | Low-Moderate | Closed | Closed | Available | Closed |

### CarePoint uses these patterns to:
1. Route patients to facilities that are actually open
2. Predict load changes (ER will be busier in 2 hours)
3. Identify when rerouting makes sense (urgent care closing soon)
4. Suggest telehealth during off-hours when everything else is closed

---

## 7. Key Operational Metrics

| Metric | Target | Typical Reality | CarePoint Impact |
|--------|--------|----------------|-----------------|
| ER wait (CTAS 4-5) | < 60 min | 2-4+ hours | Divert 30% to appropriate care |
| LWBS rate | < 5% | 13% | Reduce by offering alternatives |
| 30-day readmission | < 10% | 18.4% | Post-discharge routing to follow-up |
| Referral completion | > 90% | 50% | Track and alert on stalled referrals |
| Discharge summary to PCP | < 48h | 34% within 48h | Not in current scope (future) |
| Patient satisfaction (ER) | > 80% | 40-60% | Humanized routing reduces frustration |
| Bed occupancy | < 85% | 95%+ | Divert non-ER patients before they become boarders |
