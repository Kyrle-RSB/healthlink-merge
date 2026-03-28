# The Idea

> CarePoint — A real-time AI healthcare traffic control system.

---

## Status: SELECTED

**Track:** Track 1 — Clinical AI
**Name:** CarePoint
**One-liner:** "We route patients through the healthcare system in real time — instead of letting the system fail them."
**Winning frame:** The system is not broken because of lack of effort — it is broken because of misalignment + complexity. CarePoint is the missing alignment layer.

---

## Problem & Opportunity Alignment

### Problems We Solve (YES) vs Don't Address (NO)

| Problem | CarePoint? | How |
|---------|-----------|-----|
| Don't know where to go → go to ER | **YES** | Core function: AI routes to right destination based on symptoms + context |
| Can't find a family doctor | **YES** | Routes to clinics, community health, NPs, virtual care as alternatives |
| Long waits due to backlog | **YES** | Shows real-time wait times, finds shortest wait, dynamic rerouting |
| Millions not having access to care | **YES** | No login, phone-accessible, multilingual, serves uninsured newcomers |
| Surgical/diagnostic backlogs | NO | Downstream problem — CarePoint is front-door, not surgical scheduling |
| Too much time on paperwork | NO | Provider-side documentation burden — not CarePoint's lane |
| Too much time documenting | **YES** (partial) | AI agent assist reduces intake documentation burden for attendants |
| System not designed around care delivery | **YES** | CarePoint IS the redesign — aligns routing with how care actually works |
| Healthcare becoming an operations system | **YES** | Dashboard provides system-level visibility for operations management |
| Wait times / congestion | **YES** | Dynamic rerouting reduces ER congestion by diverting 30%+ |
| Surgery turnover / diagnostic delays | NO | Beyond CarePoint's front-door scope |
| Workforce seeing too many patients | **YES** (indirect) | Fewer non-urgent ER patients = lower clinician burden |
| High burnout rates | **YES** (indirect) | Right patients at right settings = less overload |
| Too much time in non-clinical tasks | **YES** | AI agent assist handles intake analysis for lower-level workers |
| Unchallenged assumptions ("go to ER") | **YES** | CarePoint challenges the default assumption that ER is the only option |
| Building right solution to wrong problem | **YES** | We're solving ACCESS and ALIGNMENT, not adding tech to broken workflows |

### Opportunities We Deliver

| Opportunity | CarePoint? | How |
|-------------|-----------|-----|
| Team-based primary care | **YES** | Routes to NPs, community health workers, pharmacists — not just MDs |
| Expanded pharmacist/NP roles | **YES** | Pharmacy and community health are first-class routing destinations |
| Virtual care | **YES** | Telehealth is a routing destination with real-time availability |
| Centralized intake | **YES** | CarePoint IS centralized intake — single entry point for the whole system |
| Care moving closer to the patient | **YES** | Routes to community health, pharmacies, telehealth (home), virtual care |
| Works outside hospitals | **YES** | Phone/browser accessible; routes TO community, not within hospital |
| Decreasing complexity (not automating bad process) | **YES** | Simplifies "where do I go?" from calling 5 clinics into one conversation |
| Save time, simplify decisions, remove friction | **YES** | One entry point vs calling 5 places; attendant gets AI suggestions |
| Operations optimization / system visibility | **YES** | Dashboard shows real-time loads, routing analytics, capacity data |
| Alignment as the lever | **YES** | CarePoint IS the alignment layer between patient need and system capacity |

### Realities We Design For

| Reality | Our Response |
|---------|-------------|
| Adoption > innovation | No login, no app download, phone-accessible, zero friction |
| Healthcare complexity | Hard rules for safety + AI for nuance + human escalation path |
| AI rarely scales (78% stuck in pilot) | Cloudflare Workers = globally distributed, auto-scaling from day 1 |
| Patient data can't be at risk | All mock/synthetic; architecture supports consent model |
| Must be practical and usable | Designed for lowest-literacy user first (Maria — newcomer, Tagalog) |
| Must include patient + provider + tech | Patient chat + attendant assist + system dashboard |

### Design Principles Applied

| Principle | Evidence |
|-----------|---------|
| Do not add steps | Patient: one conversation instead of calling 5 clinics |
| Do not increase cognitive load | Attendant: AI provides suggestions instead of clinical training |
| Simplify decisions | System picks the best destination; patient just describes symptoms |
| Remove friction | No account, no login, no app download, works on any phone |
| Challenge assumptions early | We challenge "go to ER" as default; we challenge "need a doctor to navigate" |

---

### The Problem (1 sentence)

People default to the ER because the healthcare system offers no clear, accessible alternative — 30% of ER visits could be managed elsewhere, but patients have zero visibility into what's available, open, and appropriate for their situation.

### Who It's For (primary user)

**Primary:** Any person with a health concern and no clear path to care — especially those without a family doctor (6.5M Canadians), newcomers navigating an unfamiliar system, and anyone who would otherwise sit in a 4-hour ER wait for something a clinic could handle in 30 minutes.

**Secondary:** The healthcare system itself — ER physicians drowning in non-urgent visits, hospitals at 95%+ capacity, and the invisible network of clinics, urgent care centres, pharmacies, and virtual care services that have capacity but no way to reach the patients who need them.

### What It Does (1 paragraph)

CarePoint is a single entry point where a patient describes their situation in plain language. AI understands their symptoms, urgency, and context (history, barriers, language). The system pulls real-time facility data — ER loads, clinic availability, wait times — and makes a routing decision: not a diagnosis, but a destination. "You don't need the ER for this — Cool Aid Community Health Centre can see you in 60 minutes, they have translation services, and they serve newcomers without insurance." If circumstances change — the ER gets busier, a closer clinic opens up — CarePoint dynamically reroutes. A split-screen dashboard shows the patient conversation on the left and the system brain on the right: facility loads, routing decisions, confidence levels, sentiment.

### Why Now (system readiness)

- 500,000 Canadians left ERs without being seen in 2024
- 30% of ER visits could be managed elsewhere
- Virtual care infrastructure exists but patients don't know about it
- Pharmacists in BC can now assess minor ailments — a new care pathway most people don't know exists
- AI can now understand natural language well enough to do symptom-to-destination routing safely
- Real-time data aggregation is technically possible — it just hasn't been connected to patient-facing tools

### The Patient Story (lead the pitch with this)

Maria Santos. 34. Arrived from the Philippines 2 months ago. She's had stomach pain for 3 weeks. She doesn't have a family doctor. Her health insurance hasn't kicked in yet. She doesn't fully understand the system. She took her two kids to the ER — waited 6 hours — and left without being seen because her children were hungry and tired.

What if, instead of going to the ER, Maria had opened CarePoint on her phone? In Tagalog, she describes her symptoms. The system recognizes: persistent abdominal pain, no emergency red flags, newcomer without insurance. It knows the ER wait is 3 hours. It also knows Cool Aid Community Health Centre — 15 minutes away — serves newcomers, has translation services, and can see her today with a 60-minute wait.

Maria goes to the right place. She gets seen. Her kids don't wait 6 hours. The ER has one fewer non-urgent patient.

That's CarePoint.

### How AI Helps (specific, not generic)

1. **Natural language understanding:** Patient describes symptoms in their own words. AI extracts clinical signals (symptom keywords, severity indicators, red flags) without requiring medical terminology.

2. **Context assembly (RAG):** AI pulls the patient's history (conditions, medications, past encounters) and the current system state (facility loads, wait times, availability) into a unified context for decision-making.

3. **Routing decision:** AI evaluates complaint + patient context + system state and outputs a structured routing decision with confidence score. Hard rules prevent unsafe routing (chest pain always goes to ER). Soft routing uses AI judgment for ambiguous cases.

4. **Sentiment detection:** AI reads the patient's emotional state (anxious, confused, distressed) and adjusts communication tone. People go to the ER because it feels human — CarePoint must match that.

5. **Dynamic rerouting:** AI monitors system state changes and proactively offers better options when they become available.

### What We're NOT Building (scope boundaries)

- NOT a diagnosis tool — we route to care, we don't provide care
- NOT a symptom checker — we don't tell you what's wrong, we tell you where to go
- NOT a booking system — we point you to the right place, we don't manage appointments
- NOT a chatbot — we're a routing engine with a conversational interface
- NOT ambient listening or voice-to-chart
- NOT replacing 811 — we're the layer between "I have a problem" and "here's where to go"
- NOT HIPAA/PIPEDA compliant in this demo — all data is synthetic

### The Demo Flow (3-5 minute walkthrough)

1. **The Story (60s):** Meet Maria. She's been in Canada 2 months. Stomach pain for 3 weeks. No doctor. No insurance yet. She went to the ER — waited 6 hours — left without being seen. This happens 500,000 times a year in Canada.

2. **The Problem (30s):** The healthcare system has capacity — clinics, urgent care, virtual care, pharmacies — but patients can't see it. The ER is the only guaranteed human touchpoint. So everyone goes there. And then everyone waits.

3. **Demo Scenario 1 — Maria (90s):** Maria opens CarePoint. Types her symptoms. System pulls her context (newcomer, no insurance, no doctor, language barrier). Sees ER wait is 3 hours. Finds Cool Aid Community Health Centre — 60 min wait, translation services, serves newcomers. Routes her there. Dashboard shows the routing decision, confidence score, and ER load staying stable.

4. **Demo Scenario 2 — Tyler's Panic Attack (60s):** Tyler, 23, racing heart, can't breathe. History of anxiety. System asks: chest pain? No. Routes to Crisis Care Centre instead of ER — specialized care, 20 min wait vs 3 hours. Dashboard shows mental health routing and sentiment shifting from distressed to calmer.

5. **Demo Scenario 3 — Robert's Reroute (60s):** Robert is already at the ER for foot numbness (diabetic). CTAS 4 — not urgent. After 90 minutes, CarePoint detects: Westshore Urgent Care just had cancellations, 15-minute wait. Offers Robert a switch. He accepts. Dashboard shows ER load decrease. This is dynamic system orchestration.

6. **The Impact (30s):** Three patients. Three better outcomes. Fewer ER visits. Shorter waits. Right care at the right place. This isn't a chatbot — it's healthcare traffic control.

### Architecture (high level)

```
Patient (phone / browser)
    |
CarePoint Chat Interface
    |
POST /api/chat
    |
Context Engine (RAG)
    | - Patient profile (D1: conditions, meds, encounters)
    | - Problem matching (D1 FTS: symptoms -> known conditions)
    | - System state (KV: facility loads, wait times)
    | - Domain knowledge (R2: operations, protocols)
    |
Routing Engine
    | - Hard rules (CTAS 1-2 -> ER always)
    | - AI soft routing (GPT: complaint + context -> destination)
    | - Facility matching (filter by service, sort by wait)
    | - Confidence scoring
    |
Response + Dashboard Update
    | - Patient gets: plain language guidance + facility recommendation
    | - Dashboard gets: routing decision, confidence, sentiment, facility loads
    |
Dynamic Rerouter (monitors system state changes)
    | - If conditions change -> offer reroute to patient
```

**Stack:** Cloudflare Workers (TypeScript), D1 (SQLite), KV (cache), R2 (docs), OpenAI GPT (routing logic), Vanilla HTML/CSS/JS frontend.

### Adoption Story (why would someone use this?)

**Patient adoption:** It's a phone-accessible website. No app download. No account creation. No login. You have a health problem, you describe it, you get told where to go. It's faster than calling 811. It's smarter than Googling "walk-in clinic near me." It's less scary than going to the ER.

**System adoption:** Hospitals want fewer non-urgent ER patients. Clinics want to fill their capacity. Virtual care providers want to reach patients who don't know they exist. CarePoint is the connective tissue. It doesn't require any facility to change their workflow — it just sends them patients they're already equipped to serve.

**The key insight:** People go to the ER because it's the only place that feels human — someone will see you, eventually. CarePoint must match that feeling. Not a form. Not a flowchart. A conversation that gives you confidence and sends you to the right place.

### What Judges Will Ask (and our answers)

**Q: How is this different from 811 / HealthLink BC?**
A: 811 is a nurse-staffed phone line with 30-60 minute waits. It tells you what to do but not where to go. CarePoint knows what's open right now, how long the wait is, and which facility matches your specific situation (language, insurance, location). It's routing, not just triage.

**Q: Would a provider actually use this?**
A: Providers don't use it — patients do. But providers benefit: fewer non-urgent ER patients, better-matched patient flow to clinics and urgent care, reduced pressure on the system. No provider workflow change required.

**Q: What about privacy/compliance?**
A: All demo data is synthetic. In production, CarePoint would require a privacy impact assessment, patient consent for profile access, PIPEDA compliance, and provincial health privacy law compliance. We've designed consent into the UX. The architecture is stateless by default — no persistent patient data is stored without consent.

**Q: How does this scale?**
A: Cloudflare Workers = globally distributed, serverless, auto-scaling. D1 handles structured data. KV handles real-time state. Each routing decision is an independent AI call. No single point of failure. Could serve an entire health region.

**Q: What's the AI doing specifically?**
A: Three things. (1) Natural language understanding: extracting symptoms and urgency from plain text. (2) Context-aware routing: combining patient history + system state + clinical knowledge to pick the best destination. (3) Confidence scoring: telling you how sure it is, so the patient and the system both know when a human should intervene.

### Success Metric (one number)

**ER diversion rate:** The percentage of CarePoint interactions where a patient who would have gone to the ER is successfully routed to a more appropriate care setting. Target: 30%+ (matching the research finding that 30% of ER visits could be managed elsewhere).

### Compliance & Regulatory Path

CarePoint is a demo with synthetic data. For production deployment:

| Requirement | Status | Path to Compliance |
|-------------|--------|-------------------|
| **PIPEDA** (federal privacy) | Acknowledged | Privacy Impact Assessment required; consent-based data access |
| **Provincial health privacy** (PHIPA, HIA, etc.) | Acknowledged | Province-specific compliance for each deployment region |
| **Data residency** | Ready | Cloudflare Workers supports Canadian data locality |
| **Patient consent** | Designed in | Consent model built into UX (patient authorizes profile access) |
| **AI transparency** | Implemented | Confidence scores visible; AI never claims to diagnose |
| **Clinical safety** | Implemented | Hard rules prevent unsafe routing; safety disclaimers on all non-ER responses |
| **Audit trail** | Implemented | Every routing decision logged with clinical reasoning in routing_sessions table |
| **Encryption** | Implemented | AES-256-GCM for API keys; HTTPS for all data in transit |

### Future Work (what we'd build next)

1. **Real-time facility data integration:** Connect to actual ER wait time feeds (many provinces publish these)
2. **Multilingual voice interface:** Phone-based conversational routing in 10+ languages
3. **Post-visit follow-up:** "You were routed to the clinic yesterday — how did it go? Do you need anything else?"
4. **Referral tracking:** Track specialist referrals and alert patients when things stall
5. **Provider dashboard:** Let clinics/urgent care update their availability in real time
6. **811 integration:** Work alongside 811 as the routing layer after nurse triage
7. **Insurance/coverage awareness:** Route based on what's covered (MSP, NIHB, private, uninsured)
8. **Predictive load modeling:** Forecast ER surges before they happen and pre-route patients

---

> "The best healthcare system in the world is useless if people can't find the right door."
