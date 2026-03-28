# All Ideas

> Every idea generated during ideation. Unfiltered. Scored later. The best idea is not the most complex — it's the one the system is ready for.

---

## Scoring Criteria

Each idea will be evaluated against:

| Criteria | Weight | Question |
|----------|--------|----------|
| **Problem validity** | 25% | Is this a real, researched, validated problem? |
| **Adoption readiness** | 25% | Would a patient/provider/system actually use this? |
| **Demo-ability** | 20% | Can we show this working in 3-5 minutes? |
| **Buildability** | 15% | Can we build this in 8-16 hours with our stack? |
| **Differentiation** | 10% | Is this meaningfully different from what exists? |
| **Emotional impact** | 5% | Will judges feel this? |

Scale: 1 (low) to 5 (high)

---

## Ideas: Track 1 — Front Door / Navigation

### IDEA-101: AI Care Navigator
**What:** Patient describes their situation in plain language. AI determines urgency, suggests the right care setting (ER, urgent care, walk-in, virtual, pharmacy, 811), and provides next steps.
- Problem: People default to ER because they don't know where else to go
- User: Unattached patients, anyone unsure where to go
- AI role: Natural language understanding → care setting classification → actionable guidance
- Differentiator: Multilingual, accessible by phone/text, not just app
- Risk: Liability if triage is wrong. Must include disclaimers. Must say "call 911" for emergencies.

### IDEA-102: "Find Me a Doctor" — Provider Matching
**What:** Real-time directory of providers accepting new patients, filterable by language, location, specialty, availability.
- Problem: 6.5M Canadians can't find a family doctor. Current methods are word-of-mouth and luck.
- User: Unattached patients, newcomers
- Risk: Data freshness. Requires provider participation. Exists in some form provincially but is terrible.

### IDEA-103: Newcomer Health Onboarding
**What:** Multilingual, step-by-step guide to the Canadian healthcare system for new immigrants. Covers: how to get a health card, what's covered, how to find a doctor, what to do in an emergency, what a walk-in clinic is.
- Problem: Newcomers face 30% higher harmful events from language/system barriers
- User: New immigrants, refugees
- AI role: Conversational guide in their language, answers questions about the system
- Differentiator: Not a static PDF — interactive, personalized to their province and situation

### IDEA-104: Symptom-to-Service Router
**What:** Patient enters symptoms, system maps to appropriate service level (not a diagnosis — a routing decision).
- Problem: People don't know if their situation is ER-worthy or walk-in-appropriate
- User: Anyone with a health concern and no doctor
- Risk: Thin line between routing and diagnosing. Must be very clear about limitations.

---

## Ideas: Track 2 — Referral Fix

### IDEA-201: Referral Tracker
**What:** End-to-end referral tracking. Patient and referring provider can see: sent → received → scheduled → completed → results returned. Automated nudges when referrals go stale.
- Problem: 50% of referrals never completed. Patients wait months for appointments that don't exist.
- User: Patients, PCPs, care coordinators
- AI role: Parse referral documents, extract status, flag anomalies
- Differentiator: Patient-facing (patients can see their own referral status). Fax-compatible (ingests fax confirmations).

### IDEA-202: Smart Referral Intake
**What:** AI pre-checks referrals before they're sent. Ensures required info is included (tests, history, reason). Reduces rejection rate.
- Problem: 69% of PCPs say they send history, but only 34% of specialists receive it. Referrals rejected for missing info.
- User: PCPs, clinic admin
- AI role: Check referral completeness against specialist requirements. Flag missing prerequisites.

### IDEA-203: Referral + Wait Time Transparency
**What:** Combines referral tracking with estimated wait times for different specialists/facilities. Lets PCP and patient choose shortest wait.
- Problem: Wait lists are per-provider. No system-wide view. Patients don't know they could see a different specialist in 4 weeks instead of 40.
- User: PCPs, patients
- Differentiator: Turns per-provider queues into a system-wide marketplace of availability.

---

## Ideas: Track 3 — Clinician Relief

### IDEA-301: AI Visit Summarizer
**What:** After a patient visit, AI generates a structured clinical note from key inputs (complaint, findings, plan). Physician reviews and edits rather than writing from scratch.
- Problem: Physicians spend more time charting than with patients. 3+ hours/day on documentation.
- User: Family physicians, NPs
- AI role: Generate structured notes from minimal input. Draft referral letters. Generate patient-friendly summaries.
- Risk: Clinical accuracy is critical. Must be review-and-edit, not auto-submit.

### IDEA-302: Inbox Triage
**What:** AI categorizes and prioritizes patient portal messages. Drafts responses for routine requests (prescription renewals, appointment requests, form completions). Flags urgent messages.
- Problem: 157% increase in portal messages post-COVID. 6x burnout risk for high-volume inbox.
- User: Physicians, clinic staff
- AI role: Classify message urgency and type. Draft responses. Route to appropriate team member.
- Differentiator: Reduces the second unpaid shift.

### IDEA-303: Smart Sick Note / Form Generator
**What:** AI generates standard medical forms (sick notes, insurance forms, disability forms) from visit context. Physician approves with one click.
- Problem: Canada-specific: 18.5M hours/year on unnecessary admin. Forms are a huge chunk.
- User: Physicians, clinic admin
- AI role: Template population from patient context. Standard language generation.
- Risk: Legal requirements for form content vary by province and employer.

---

## Ideas: Track 4 — Care Transitions

### IDEA-401: Discharge Companion
**What:** Patient-facing discharge plan that is clear, actionable, and accessible. Includes medications, follow-up appointments (actually booked, not "follow up with your doctor"), warning signs, and who to call.
- Problem: 50% of readmitted patients had zero physician contact between discharge and readmission. Discharge summaries are unreadable.
- User: Patients being discharged, caregivers
- AI role: Translate clinical discharge summary into plain-language, actionable steps. Generate medication schedule. Create checklist.
- Differentiator: Caregiver gets a copy. Available by phone. Multilingual.

### IDEA-402: Post-Discharge Check-In Bot
**What:** Automated 48-72 hour post-discharge check-in via text/phone. Asks structured questions about symptoms, medication adherence, follow-up scheduling. Escalates to human if concerning.
- Problem: 75% of readmissions are preventable. The gap between discharge and follow-up is where patients fall.
- User: Recently discharged patients, caregivers
- AI role: Conversational check-in. Symptom assessment. Escalation logic.
- Risk: Must not provide medical advice. Escalation path must be clear and real.

### IDEA-403: Care Transition Coordinator Dashboard
**What:** Provider-facing dashboard showing all recently discharged patients, their follow-up status, medication reconciliation status, and flags for those at risk of readmission.
- Problem: No visibility into post-discharge outcomes. ALC patients block beds because discharge planning is poor.
- User: Discharge planners, care coordinators, home care teams
- Differentiator: Connects hospital to community. Shows the gap that causes readmissions.

---

## Ideas: Track 5 — Caregiver Coordination

### IDEA-501: Caregiver Hub
**What:** Single dashboard where a caregiver can see their loved one's appointments, medications, providers, care plan, and upcoming tasks. Shared access model with patient consent.
- Problem: 7.8M unpaid caregivers. 89% never assessed. 45% cite system navigation as top barrier.
- User: Family caregivers, sandwich generation
- AI role: Summarize care plans in plain language. Flag medication interactions. Suggest questions for next appointment.
- Differentiator: Caregiver is a FIRST-CLASS user, not an afterthought. Phone-accessible.

### IDEA-502: Caregiver-Provider Bridge
**What:** Secure messaging between caregiver and care team, with patient consent. Caregiver can ask questions, report changes, get updates without being physically present.
- Problem: Long-distance caregivers (3-hour drives to advocate for parents). No formal communication channel.
- User: Long-distance caregivers, providers
- Risk: Privacy/consent model needed. Who sees what.

### IDEA-503: Caregiver Resource Navigator
**What:** AI-powered tool that connects caregivers to relevant resources: respite care, financial support, community services, support groups. Based on their specific situation (province, condition, needs).
- Problem: Resources exist but are scattered, poorly advertised, and hard to find.
- User: Caregivers
- AI role: Match caregiver situation to available resources. Personalized recommendations.

---

## Ideas: Track 6 — Operational Intelligence

### IDEA-601: Wait Time Transparency Dashboard
**What:** Real-time (simulated) view of wait times across specialties, facilities, and regions. Shows capacity, estimated waits, and trending.
- Problem: 28.6 weeks median wait. No visibility into system-wide capacity. Per-provider queues.
- User: Administrators, schedulers, and potentially patients
- Demo potential: Very high — dashboards are visual and impressive.

### IDEA-602: Predictive No-Show + Backfill
**What:** AI predicts which appointments are likely to no-show based on patterns. Automatically offers slot to next person on waitlist.
- Problem: 18-20% no-show rate. In a system with million-person wait lists, every wasted slot matters.
- User: Schedulers, patients on waitlists
- AI role: Predictive modeling. Automated outreach.
- Differentiator: Turns waste into access.

### IDEA-603: Bed & Discharge Tracker
**What:** Real-time hospital bed status, discharge readiness, and ALC patient tracking. Connects to community resources for discharge planning.
- Problem: ALC patients blocking acute beds. Hospitals at 85%+ occupancy.
- User: Bed managers, discharge planners
- Risk: Requires realistic simulation data to demo well.

---

## Ideas: Track 7 — Equity & Inclusion

### IDEA-701: Multilingual Health Navigator
**What:** IDEA-101 (AI Care Navigator) but specifically designed for and tested with newcomer/immigrant populations. Available in 10+ languages. Culturally informed responses.
- Problem: 30% higher harmful events from language barriers. 60.7% using family as interpreters.
- User: Newcomers, immigrants, refugees
- Differentiator: Not "English app with Google Translate" — built multilingual from ground up.

### IDEA-702: Senior-First Health Portal
**What:** Radically simplified patient portal designed for 75+ users. Large text, minimal steps, phone-first, caregiver shared access.
- Problem: Digital literacy score of 21.7 for 75+. The portal IS the barrier.
- User: Seniors, their caregivers
- Differentiator: Designed WITH seniors, not just FOR them.

### IDEA-703: Indigenous Health Connection
**What:** Culturally safe navigation tool for Indigenous communities. Connects to both Western and traditional health services. Community health worker assisted.
- Problem: 1 in 5 Indigenous people report unfair treatment. Jurisdictional gaps. Trust deficit.
- User: Indigenous patients, community health workers
- Risk: Must be developed WITH Indigenous communities, not FOR them. A hackathon may not be the right venue to build this. Better to acknowledge and design with sensitivity.

---

## Hybrid Ideas (Combining Tracks)

### IDEA-801: The Care Journey Tracker (Tracks 1 + 2 + 4)
**What:** A patient-facing tool that follows their entire care journey: from "I have a problem" → finding the right care → referral tracking → specialist visit → follow-up → recovery. One continuous thread instead of fragmented touchpoints.
- Combines: Navigation (101) + Referral tracking (201) + Discharge companion (401)
- User: Any patient, especially unattached ones
- AI role: Journey orchestration, status updates, plain-language explanations, next-step guidance
- Risk: Scope. Must pick which segment to demo.

### IDEA-802: Caregiver + Transition Bridge (Tracks 4 + 5)
**What:** When a patient is discharged, the caregiver automatically gets the discharge plan, medication list, follow-up schedule, and a check-in system. Designed for the caregiver as primary user.
- Combines: Discharge companion (401) + Caregiver hub (501)
- User: Caregivers of elderly/chronically ill patients being discharged
- Emotional resonance: Very high. Everyone knows a Dot MacLeod.

### IDEA-803: Navigator + Equity (Tracks 1 + 7)
**What:** AI care navigator specifically designed for the most underserved: newcomers, seniors, those without doctors. Multilingual, phone-first, plain language, no assumptions about digital literacy.
- Combines: AI Care Navigator (101) + Newcomer onboarding (103) + Senior-first design (702)
- User: The people most excluded by the current system
- Differentiator: Designed for the floor, not the ceiling.

### IDEA-804: Provider Relief + Patient Clarity (Tracks 3 + 4)
**What:** AI generates the clinical note for the provider AND a patient-friendly version of the same encounter. One input, two outputs. Provider saves time, patient understands what happened.
- Combines: Visit summarizer (301) + Discharge companion (401)
- User: Physicians (saves time) + Patients (gains understanding)
- AI role: Dual-output generation from single encounter context
- Differentiator: Addresses both sides of the same problem simultaneously.

---

## Idea Scoring (To Be Completed)

| ID | Idea | Problem | Adoption | Demo | Build | Different | Emotion | Total |
|----|------|---------|----------|------|-------|-----------|---------|-------|
| 101 | AI Care Navigator | | | | | | | |
| 102 | Find Me a Doctor | | | | | | | |
| 103 | Newcomer Health Onboarding | | | | | | | |
| 201 | Referral Tracker | | | | | | | |
| 202 | Smart Referral Intake | | | | | | | |
| 203 | Referral + Wait Transparency | | | | | | | |
| 301 | AI Visit Summarizer | | | | | | | |
| 302 | Inbox Triage | | | | | | | |
| 401 | Discharge Companion | | | | | | | |
| 402 | Post-Discharge Check-In | | | | | | | |
| 501 | Caregiver Hub | | | | | | | |
| 601 | Wait Time Dashboard | | | | | | | |
| 602 | Predictive No-Show | | | | | | | |
| 701 | Multilingual Health Nav | | | | | | | |
| 801 | Care Journey Tracker | | | | | | | |
| 802 | Caregiver + Transition | | | | | | | |
| 803 | Navigator + Equity | | | | | | | |
| 804 | Provider + Patient Clarity | | | | | | | |

> Scoring happens next. Fill in after track and user decisions are made.

---

## WHAT WE ARE BUILDING (Unified Concept)

### Core Idea

We are building a real-time AI healthcare navigation system that:

- guides patients to the right level of care
- reduces unnecessary ER visits
- dynamically reroutes patients based on availability
- connects fragmented systems (urgent care, ER, clinics, virtual care)

This is not just triage.
This is **system orchestration + patient routing**.

---

### THE REAL PROBLEM (From Conversations)

#### 1. Access is broken
- People must manually choose a clinic to call
- They call multiple places trying to find shortest wait
- No centralized visibility

#### 2. ER is the default fallback
- It is the only guaranteed human touchpoint
- Even non-emergency patients go there
- Leads to: 10-12 hour waits, overload

#### 3. Systems are disconnected
- Clinics don't know who is waiting in ER
- ER doesn't know about cancellations or availability nearby
- Patients have zero visibility into alternatives

#### 4. No personalization or context
- Every call = treated like a new person
- No history
- No continuity
- No smart routing

---

### OUR SOLUTION (CLEAR DEFINITION)

**A SINGLE ENTRY SYSTEM THAT:**

#### 1. Understands the patient
- Symptoms
- Urgency
- Sentiment
- Context (via RAG)

#### 2. Pulls real-time context
- Patient profile (mocked via dataset)
- System state (availability, ER load)
- Past interactions

Done via:
- RAG + MCP style context injection
- Exposed through an API endpoint

#### 3. Makes a routing decision

**NOT diagnosis — destination decision**

Outputs:
- ER
- Clinic
- Virtual care
- Pharmacy / self-care

#### 4. Dynamically reroutes patients
- Before ER: "You don't need ER — go here instead"
- During ER wait: "There's a clinic opening nearby — do you want to switch?"

#### 5. Humanizes the experience
- Feels like guidance, not a system
- Gives confidence
- Reduces anxiety

Critical insight: People go to ER because it feels human — we must match that.

---

### SYSTEM ARCHITECTURE (FINAL FORM)

```
User (phone / interface)
    |
AI Intake (voice / chat)
    |
Context Engine (RAG via endpoint)
    |
Decision Engine (triage + confidence)
    |
Routing Engine
    -> ER
    -> Clinic
    -> Virtual
    -> Pharmacy
    |
Dashboard (system visibility)
```

---

### KEY TECH PIECES

#### 1. Entry Interface
- Twilio OR RingCentral (phone/video)

#### 2. Context Endpoint (CRITICAL)

"Expose RAG as endpoint"

Example:

```
POST /get-patient-context

Input:
  phone number OR scenario

Output:
  patient profile
  history
  recommendations
```

#### 3. AI Layer
- OpenAI for reasoning
- RAG for context

#### 4. Routing Logic
- Confidence-based decisions
- Multi-path outputs

#### 5. Dashboard UI
- Sentiment
- Routing
- Patient state
- System load

---

### DEMO STRUCTURE (FINAL DECISION)

**NO LIVE CALLS** — Pre-scripted automated flow instead:
- Simulated call plays
- AI responds
- UI updates live

#### Demo Scenarios (Locked In)

**Scenario 1 — Avoid ER**
- Patient calls
- Mild issue
- Routed to clinic or virtual

**Scenario 2 — ER Reroute**
- Patient already waiting in ER
- System detects: not critical + nearby availability
- Reroutes them out

#### UI Structure — Split Screen
- **Left:** Phone / conversation
- **Right:** System dashboard ("System brain vs patient experience")

---

### KEY DESIGN PRINCIPLES

1. **Solve outside the hospital first** — "Pull it out into the community"
2. **Do NOT add complexity** — Reduce friction, simplify decisions
3. **Don't just triage — orchestrate** — Move patients dynamically
4. **Adoption > sophistication** — Must feel usable, must feel human

---

### CRISP POSITIONING

This is: **A real-time healthcare traffic control system**

NOT: chatbot, symptom checker, booking tool

**One-liner:** "We route patients through the healthcare system in real time — instead of letting the system fail them."

---

### NEXT STEPS

Use this as the base and:
1. Turn it into a Claude Code build prompt
2. Start with: intake -> routing -> output (ONE FLOW)
3. Add: RAG endpoint + simple UI
4. THEN layer extras
