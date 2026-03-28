# FULL SCOPE — HealthLink / CarePoint

> The complete product vision, problem statements, and functional requirements.

---

## 1. PROBLEM STATEMENTS

### 1.1 Healthcare Provider Overwhelm
Healthcare professionals don't want everyone coming into the wrong facilities. When the system is overwhelmed, they need a way to relieve the pressure by having a clear path and process to deal with the workload efficiently.

### 1.2 Patient Navigation Gap
Patients don't know where to go in an "emergency" other than the emergency room. They lack visibility into what care options exist, which are available, and which is appropriate for their situation.

### 1.3 System Capacity Bottleneck
When the system is overwhelmed, patients can't wait too long to get answers that are helpful. They need help as soon as possible, and it needs to be the appropriate help for what their problem actually is — not a one-size-fits-all ER visit.

---

## 2. CORE SOLUTION

An AI-first triage and routing platform where the first point of contact is an AI assistant, so nobody is waiting on hold to get their problem resolution initiated. The system connects patients to the right care, at the right facility, at the right time — based on real-time capacity, clinical urgency, and patient context.

---

## 3. LIVE CALL DASHBOARD

The dashboard must accurately reflect:

- **How long each call has been waiting** — real-time duration counters
- **AI assistant assessment results** — card details updating live as the AI gathers information
- **Urgency ranking** — who has the most urgent need, visible at a glance
- **Wait priority** — who has been waiting the longest
- **Resolution estimate** — how long the problem should take to solve, based on historical data for that problem type

---

## 4. AI VOICE ASSISTANT (First Point of Contact)

### 4.1 Call Pickup
When a call is picked up, an AI voice bot serves as the assistant. No hold queues — the AI begins immediately.

### 4.2 Patient Identification
The phone number auto-associates to the patient's expected profile. The AI then validates identity through:

1. **BC Services Card number**
2. **Voice authentication** from past calls (if previously set up)
3. **Date of birth**
4. Other standard healthcare authentication questions as appropriate

### 4.3 Intake Process
Once authenticated, the AI begins asking questions — by voice if it's a phone call, or by text if app-based. The AI completes intake of all necessary information to assess:

- **Urgency level**
- **Nature of the problem**
- **Key clinical elements** that can be gathered without a human provider

### 4.4 Triage Scoring
The AI must determine a triage score to **95% confidence**. If it cannot reach this threshold, it must:

- Bump the patient up by **one triage level** (err on the side of caution)
- State the reason as **"AI low confidence"**

### 4.5 Handoff to Queue
After intake is complete, the AI tells the patient they will be waiting for the next available provider. The patient is then flagged across the system to the **3–5 healthcare facilities** with the most capacity and lowest utilization at that moment, so the patient gets service as fast as possible at the level they need.

---

## 5. ACCESS CHANNELS

### 5.1 Phone-First, App-Second
The primary channel is phone-based. App-based access via the BC Services Card app is secondary.

- **Phone**: Call in, AI picks up, voice-based interaction
- **BC Services Card App**: If the patient has the app, they can use it to initiate a call. Features become live once connected with the AI or a health professional

### 5.2 Call Transcript & Persistence
Once a call is live — whether by phone or app — the voice is logged as a transcript and saved to:

- The patient's **phone number file** (phone-based)
- Their **app database record** (app-based)

All transcripts are retained for future reference by both the patient and providers.

---

## 6. PROVIDER INTERFACE

### 6.1 Patient Card Context
When a patient enters the queue with a "complete" tag, the healthcare provider can open their card and see:

- **Everything the patient said/reported** during AI intake
- **Health history and file** for full context
- **AI triage assessment** with confidence level and reasoning

This ensures the provider has context going into the conversation — no cold starts, no repeated questions.

### 6.2 Primary Conversation Mode: Text
Text conversations are the primary mode because providers can service **multiple patients simultaneously** while maintaining context across conversations. The provider decides when to escalate to:

- **Phone call** — when voice is needed
- **Video call** — when visual assessment is needed

When any escalated conversation modal (phone or video) closes, it returns to the text modal so the patient doesn't lose connection, get frustrated, or have their queue position reset.

### 6.3 AI-Powered Question Suggestions
As the conversation progresses, an LLM connected to a RAG system analyzes the dialogue in real-time and determines the optimal questions to ask. These populate as **clickable buttons** at the bottom of the provider's interface, so they can ask questions with a single click instead of typing manually.

### 6.4 Dynamic Dashboard Population
As the conversation continues, UI elements populate and appear based on what is contextually needed:

- **Facility details** — capacity, wait times, services
- **Routing decision** — where to send the patient, with reasoning
- **2 alternatives** — backup facilities with their details
- **Map view** — when location is discussed, a map appears showing:
  - Where the patient is
  - Nearby facilities with status indicators and capacity data
- **Decision rationale** — why this routing was chosen

---

## 7. DEMO REQUIREMENTS

### 7.1 Provider-Driven Demo Flow
- Patient conversation pieces come in **automatically** (simulated)
- The provider in the demo **clicks on suggested questions** to ask
- The patient then responds (from a pre-seeded response database)

### 7.2 Deep Conversational Data
A deeply seeded database of conversational responses is needed for each demo patient so the demo functions realistically across multiple conversation paths.

---

## 8. PATIENTS WITHOUT BC HEALTH CARDS

For patients who do not have a BC Health Card or health service number:

1. The healthcare provider can opt to **text them a temporary authorization** into the platform
2. Instead of health card authentication, the auth attaches to:
   - **Incoming phone number**
   - **Name and date of birth**
   - Other AI-gathered authentication answers
3. Context is saved to a file based on that phone number
4. The provider can **send them a link** to a temporarily authenticated instance of the application
5. Anyone with internet can access the platform through this link and proceed with receiving services

---

## 9. SYSTEM FLOW SUMMARY

```
PATIENT CALLS IN (phone or app)
    ↓
AI VOICE ASSISTANT picks up immediately (no hold)
    ↓
AUTO-IDENTIFY via phone number → expected profile
    ↓
VALIDATE IDENTITY (BC card, voice auth, DOB, etc.)
    ↓
AI INTAKE (voice or text questions)
    ├─ Assess urgency
    ├─ Determine problem nature
    ├─ Gather clinical elements
    └─ Calculate triage score (≥95% confidence or bump +1 level)
    ↓
PATIENT QUEUED with "intake complete" tag
    ↓
FLAGGED to 3–5 facilities with best capacity match
    ↓
PROVIDER OPENS CARD (full context: transcript, history, AI assessment)
    ↓
TEXT CONVERSATION (primary) with AI-suggested questions
    ├─ Escalate to phone when needed
    ├─ Escalate to video when needed
    └─ Always returns to text (no connection loss)
    ↓
DYNAMIC DASHBOARD populates: map, facilities, routing, alternatives
    ↓
ROUTING DECISION → patient directed to right care, right place, right time
```

---

## 10. GAP ANALYSIS — What's Built vs What's Needed

> Generated from codebase audit on March 28, 2026.

### 10.1 FULLY WORKING (no changes needed)

| # | Scope Requirement | Where It Lives |
|---|---|---|
| 1 | Triage scoring with vital thresholds | `src/carepoint/vital-scoring.ts` + `routing-engine.ts` |
| 2 | 14 hard rules for emergency detection | `routing-engine.ts` INSTANT_ER_KEYWORDS |
| 3 | 4 follow-up rules for ambiguous symptoms | `routing-engine.ts` FOLLOW_UP_KEYWORDS |
| 4 | Flag to 3–5 facilities with best capacity | `findBestFacility()` + `findAlternatives()` |
| 5 | Dynamic dashboard: map, facilities, routing, alternatives | `carepoint.js` map/facility/decision updates |
| 6 | Facility load bars with real-time wait times | D1 system_state + facility grid |
| 7 | Decision rationale (clinical reasoning) | `decision.clinical_reasoning` in routing response |
| 8 | Transcript persistence | `routing_sessions.conversation_log` (JSON) |
| 9 | Safety disclaimers + 911/811/988 fallbacks | Appended to all non-ER responses |
| 10 | Demo scenarios (9 patients, all 5 CTAS levels) | `carepoint.js` DEMOS + `dashboard.html` |
| 11 | Live Call Dashboard with 6 simultaneous calls | `dashboard.html` full simulation |
| 12 | Call duration counters | Both `dashboard.html` and `carepoint.js` |
| 13 | Zoom video call integration (backend) | `src/zoom/` + `src/api/zoom.ts` |

### 10.2 PARTIAL (needs specific additions to be complete)

| # | Scope Requirement | What Exists | What's Missing to Complete |
|---|---|---|---|
| P1 | AI assessment results updating on cards | Triage score calculated internally | Expose score/level/reasoning on dashboard call cards in real-time |
| P2 | Urgency ranking — sort by most urgent | Each call has urgency score | Cards not sorted by urgency; need dynamic reordering |
| P3 | AI question suggestions (RAG) | `/api/assistant/suggest` with GPT + quick response buttons | Not true RAG — no vector retrieval. Needs Pinecone/embedding search for clinical knowledge |
| P4 | Provider text conversation | Patient↔CarePoint AI chat works | No provider↔patient messaging — provider can't type to patient |
| P5 | Provider escalate to phone/video | Zoom meeting creation API exists | No "Escalate to Video" button in provider UI linked to current session |
| P6 | Demo with clickable provider questions | 6 quick response buttons exist | Need deeper branching responses — patient should respond to provider clicks, not just log them |
| P7 | Deep conversational response database | 9 scripted scenarios (6–14 turns each) | Need branching response trees so provider clicking different questions gets different patient responses |
| P8 | Deepgram voice transcription | WebSocket integration built | Needs API key configured + no outbound call handling |
| P9 | Temp auth for patients without health cards | Anonymous patient_id works | No temp token, no expiry, no phone-number-based file, no link generation |

### 10.3 NOT BUILT (needs new implementation)

| # | Scope Requirement | What's Needed |
|---|---|---|
| N1 | AI voice bot as first contact | RingCentral/Twilio inbound call → AI voice agent (TTS + STT) |
| N2 | Phone number auto-association to patient | Lookup `patients.phone` on incoming call, auto-load profile |
| N3 | BC Services Card validation | Card format validation + identity verification questions |
| N4 | Voice authentication from past calls | Speaker embedding enrollment + verification (future, not hackathon) |
| N5 | Resolution time estimates (historical) | New table tracking problem_type → avg_resolution_minutes |
| N6 | Queue system with "intake complete" tag | New status enum in routing_sessions + queue UI |
| N7 | Provider dashboard (accept/view queued patients) | New page: provider sees queue of intake-complete patients, clicks to open |
| N8 | Text returns after phone/video closes | Session state machine: text → phone → text (preserve connection) |
| N9 | Phone-first access channel | RingCentral inbound number → AI pickup → transcription → routing |
| N10 | BC Services Card app integration | Deep link / web portal that activates on call connection |

---

## 11. IMPLEMENTATION PLAN (Prioritized for Demo Impact)

### Phase 1 — Provider Dashboard + Queue (Highest Demo Impact)
**New page: `frontend/provider.html`** — The missing piece that ties everything together.

- **Queue view**: Shows all patients with "intake complete" status, sorted by urgency then wait time
- **Patient cards**: Show AI assessment, triage score, wait duration, chief complaint
- **Click to open**: Full patient context (transcript, history, meds, conditions, AI reasoning)
- **Text conversation**: Provider types to patient, AI suggests questions as clickable buttons
- **Branching responses**: Patient auto-responds based on provider's question selection
- **Escalate buttons**: "Start Video Call" (creates Zoom meeting), "Start Phone Call"
- **After escalation closes**: Returns to text view

### Phase 2 — Queue System + Intake Complete Flow
- Add `status = 'intake_complete'` to routing_sessions
- After AI chat completes intake → mark session as intake_complete
- Provider dashboard polls for intake_complete sessions
- Provider claims a session → status becomes 'provider_active'

### Phase 3 — Urgency Sorting + Resolution Estimates
- Sort dashboard cards by triage level (L1 first) then by wait duration
- Add `estimated_resolution_minutes` to problems table (based on CTAS level defaults)
- Display on cards: "Est. ~15 min" based on problem type match

### Phase 4 — Phone Number Association + BC Card Validation
- On chat start, if phone number provided, lookup `patients.phone` in D1
- Auto-load patient profile if match found
- BC Services Card format validation (regex for BC card format)
- Identity verification questions in AI conversation flow

### Phase 5 — Temporary Auth + Link Generation
- Generate temp token (`crypto.randomUUID`) stored in KV with 24h TTL
- Provider clicks "Send Link" → generates URL with token
- Patient opens link → authenticated session attached to phone number
