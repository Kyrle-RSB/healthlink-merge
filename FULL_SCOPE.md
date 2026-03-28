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

> Updated: March 28, 2026 — all phases implemented.

### 10.1 FULLY WORKING

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
| 14 | AI assessment results on dashboard cards | `dashboard.html` — aiSummary + triage score on each card |
| 15 | Urgency ranking — cards sorted by urgency | `dashboard.html` — `getSortedPatients()` sorts by score then wait |
| 16 | Resolution time estimates | `routing-engine.ts` `getResolutionEstimate()` by CTAS + displayed on cards |
| 17 | Provider dashboard (queue → converse → route) | `frontend/provider.html` — 1281-line standalone page |
| 18 | Provider text conversation with branching AI questions | `provider.html` — 6 patients × 8-12 branching response trees |
| 19 | Provider escalate to phone/video | `provider.html` escalation buttons + `src/api/provider.ts` escalate endpoint |
| 20 | Text returns after phone/video closes | `src/api/provider.ts` deescalate endpoint → status back to provider_active |
| 21 | Demo with clickable provider questions | `provider.html` — AI-suggested question pills, patient auto-responds |
| 22 | Deep conversational response database | `provider.html` — 6 patients with full branching conversation trees |
| 23 | Queue system with intake_complete tag | `src/api/provider.ts` + `carepoint.ts` — auto-marks intake_complete after routing |
| 24 | Phone number auto-association to patient | `src/api/carepoint.ts` + `queries-carepoint.ts` queryPatientByPhone |
| 25 | BC Services Card validation | `src/carepoint/bc-card.ts` — format validation (10-digit, formatted output) |
| 26 | Temp auth + link generation | `src/api/provider.ts` — KV-backed tokens with 24h TTL, link generation |
| 27 | Confidence threshold enforcement | `routing-engine.ts` — bumps triage +1 level when confidence < 0.70, states "AI low confidence" |

### 10.2 REQUIRES EXTERNAL SERVICE CONFIGURATION (built but needs API keys/accounts)

| # | Scope Requirement | What's Built | What's Needed to Activate |
|---|---|---|---|
| E1 | Deepgram voice transcription | WebSocket integration in `call-transcribe.js` | Deepgram API key in admin integrations |
| E2 | Zoom video calls | Full SDK in `src/zoom/`, admin config UI | Zoom S2S OAuth + Meeting SDK credentials |
| E3 | AI question suggestions (GPT-powered) | `/api/assistant/suggest` endpoint + UI | OpenAI API key in admin integrations |
| E4 | AI routing decisions (GPT-powered) | `/api/chat` with `ROUTING_SYSTEM_PROMPT` | OpenAI API key in admin integrations |

### 10.3 FUTURE ROADMAP (requires external services not available in hackathon)

| # | Scope Requirement | Status | Notes |
|---|---|---|---|
| F1 | AI voice bot as first contact (inbound calls) | Infrastructure ready | Needs RingCentral inbound number config — SDK and admin UI built |
| F2 | Voice authentication from past calls | Not built | Requires speaker embedding service (e.g., Azure Speaker Recognition) — post-hackathon |
| F3 | Phone-first inbound call channel | Infrastructure ready | Needs RingCentral/Twilio inbound number provisioning |
| F4 | BC Services Card app deep integration | Not built | Requires BC Ministry of Health API partnership — post-hackathon |
| F5 | True RAG with vector retrieval | Pinecone integration stubbed | Needs Pinecone API key + clinical knowledge base indexed |
