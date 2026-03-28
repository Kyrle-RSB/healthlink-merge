# Side-by-Side Comparison: HealthLink (Kyrle) vs SILA (Saleem)

> Use this to decide which side wins for each element during merge.
> Mark each row: **HL** (keep HealthLink), **SILA** (keep SILA), **MERGE** (combine both), **DROP** (neither)

---

## 1. TECH STACK

| Element | HealthLink (Kyrle) | SILA (Saleem) | Decision |
|---------|-------------------|---------------|----------|
| Runtime | Cloudflare Workers (edge, serverless) | Node.js + Express (Railway) | |
| Language | TypeScript (strict) | JavaScript (ESM) | |
| Frontend | Vanilla HTML/CSS/JS (no build) | React 18 + Vite + Tailwind CSS | |
| Database | D1 (SQLite) + FTS5 | In-memory (patients.js, facilities.js) | |
| Cache | KV Namespace | None | |
| File Storage | R2 Bucket | None | |
| AI Provider | OpenAI GPT (raw fetch) | Claude API (Anthropic) planned, client-side triage | |
| Real-time | Polling (30s reroute, 12s tick) | Socket.IO (WebSocket) | |
| Maps | None in patient UI | Leaflet.js (CartoDB dark tiles) | |
| Deployment | Wrangler → healthlink.madeonmerit.com | Railway (planned) | |
| CSS | Custom properties, hand-written | Tailwind CSS 3.4 + custom keyframes | |

---

## 2. FRONTEND PAGES

| Page | HealthLink | SILA | Decision |
|------|-----------|------|----------|
| Landing/Launch | Hero + problem stats + hamburger nav | DemoLaunchScreen with floating medical particles + feature grid | |
| Patient Chat | Split-screen: chat bubbles + dashboard | PatientPhonePanel: iPhone simulator with waveform | |
| System Dashboard | Facility load bars + routing feed + stats | LiveCallDashboard: 3-col grid of CallCards + split-view | |
| Health Worker View | Admin dashboard (sidebar nav, 10 views) | HealthWorkerPanel: verification checklist + transcript + routing | |
| Post-Triage | Journey comparison + impact card | PostTriageScreen: recommended facility + alternatives + next steps + notification | |
| Admin | Full admin SPA (patients, facilities, problems, staff, sessions, analytics, integrations, meetings) | None | |
| Health Diagnostic | 68-feature health check dashboard | None | |
| Call Transcription | Modal with transcript + AI suggestions | ConversationTranscript with keyword highlighting | |

---

## 3. UI COMPONENTS

| Component | HealthLink | SILA | Decision |
|-----------|-----------|------|----------|
| Chat bubbles | patient/carepoint/system with ARIA | Left/right by speaker with avatars + keyword highlighting (14 medical terms) | |
| Typing indicator | Three-dot CSS animation | Three pulsing dots | |
| Patient selector | Dropdown with 6 personas | Auto from simulation (6 scenarios) | |
| Language toggle | EN/TL/FR dropdown | None | |
| Facility map | None in patient UI | Leaflet with color-coded markers + recommended pulse + legend | |
| Facility load bars | Horizontal bars (green/yellow/red) | Capacity utilization bars in FacilityList | |
| Triage/routing card | Destination + confidence bar + reasoning | SVG circular gauge (0-100) + care level badge + routing box | |
| Sentiment indicator | Emoji + label (8 sentiments) | None | |
| Reroute notification | Slide-in banner with accept/dismiss | NotificationBanner with 30s countdown + progress bar | |
| Phone simulator | None | iPhone frame (9:19 aspect), notch, waveform, speaking indicator | |
| Call cards (multi-call) | None (single conversation) | CallCard with avatar, status badge, metrics, pulse-glow | |
| Verification checklist | None | 5-item expandable: Identity, Health Card, Symptoms, History, Triage | |
| Patient info accordion | Expandable in admin detail view | 4-panel accordion: Demographics, Conditions, Medications, Allergies | |
| Impact metrics | Impact card with annual savings projection | None | |
| Journey comparison | Before/after side-by-side card | None | |
| AI assistant drawer | Bottom-right streaming chat panel | None | |
| Sidebar navigation | Collapsible with 13 sections | Header only (no sidebar) | |
| Quick response buttons | 6 intake templates | None | |
| Integration config forms | OpenAI/Zoom/RingCentral with setup instructions | None | |
| Health check dashboard | 68 features, search, filter, diagnose | None | |
| Demo controls | Scenario selector + Play/Reset | "Start Demo" button on launch screen | |
| Competitive comparison | CarePoint vs 811 vs MyChart vs OceanMD table | None | |

---

## 4. UX & DESIGN

| Feature | HealthLink | SILA | Decision |
|---------|-----------|------|----------|
| Theme | Dark (patient), Light (admin) | Dark throughout (dashboard-bg #0F172A) | |
| Brand | CarePoint | SILA / BC HealthTriage AI | |
| Animations | 13 effects (fadeIn, cardSlide, pulse, load bars, etc.) | 21 keyframe animations + glass morphism + gradient utilities + glow effects | |
| Typography | System fonts (-apple-system) | Inter (Google Fonts, 300-800) | |
| Color system | CSS custom properties (12 colors) | Tailwind tokens (22 custom colors) + triage color scale | |
| Mobile responsive | Yes (768px, 1024px breakpoints) | Yes (responsive grid 3→2→1 columns) | |
| Accessibility | Skip-to-content, ARIA live regions, role=log, screen reader announcements | .focus-ring class, .hide-mobile/.hide-desktop | |
| Navigation | Hamburger (landing), sidebar (admin), split-screen (carepoint) | Header + view state machine (launch→dashboard→post-triage) | |
| Error states | 911/811/988 fallbacks, graceful API failure | None visible | |
| Loading states | Typing indicator, "Loading..." text | Typing indicator in transcript | |

---

## 5. AI / LLM

| Feature | HealthLink | SILA | Decision |
|---------|-----------|------|----------|
| Routing engine | Hard rules (14 ER keywords + 4 follow-up) + FTS matching (35 problems) + GPT soft routing | Client-side triage scoring (vital thresholds + symptom weights) — no LLM | |
| Multi-turn conversation | Yes (conversation history + sentiment tone map) | No (scripted transcript simulation) | |
| AI assistant | Two-stage RAG (planner → queries → streaming answerer) | None | |
| Attendant assist | Real-time suggestions from transcript (ask/info/route/escalate) | None | |
| Transcription | Deepgram WebSocket (live) + demo simulation | None (text-based simulation only) | |
| Embeddings/vectors | Pinecone semantic search | None | |
| Reading levels | Simple/standard/detailed content generation | None | |
| Confidence scoring | AI output accuracy 0-100 | Triage score 0-100 (vital/symptom algorithm) | |
| Sentiment detection | Client-side keyword matching (8 sentiments) | None | |
| Follow-up questions | Asks clarifying question before ER for ambiguous symptoms | None | |

---

## 6. ROUTING / TRIAGE ENGINE

| Feature | HealthLink | SILA | Decision |
|---------|-----------|------|----------|
| Emergency detection | 14 keyword groups → instant ER | Vital thresholds (HR>120, O2<90, etc.) → score-based | |
| Ambiguity handling | 4 follow-up rules (breathing, headache, fainting, falls) | None — score determines level | |
| Destinations | 7: ER, urgent_care, clinic, virtual, pharmacy, self_care, mental_health_crisis | 5: ER, Hospital, UPCC, Clinic, Pharmacy/Virtual | |
| Facility matching | Filter by type → boost for barriers/Indigenous/NP → sort by wait | Filter by triage level → sort by distance | |
| Dynamic rerouting | Real D1 state changes + polling + accept/decline | NotificationBanner with 30s countdown (UI only) | |
| Confidence/scoring | AI confidence 0-1.0 + hard rule confidence 0.95 | Triage score 0-100 (vital + symptom weights) | |
| Context awareness | Patient history, barriers, medications, conditions, facility loads | Vitals, symptoms, conditions (from patient data file) | |

---

## 7. DATA

| Dataset | HealthLink | SILA | Decision |
|---------|-----------|------|----------|
| Patients (DB) | 6 seeded (D1) + 2K CSV | 6 hardcoded (patients.js) + 2K CSV | |
| Encounters | 7 seeded + 10K CSV | In patient data (recentEncounters) | |
| Conditions | 16 seeded (ICD-10) | In patient data (conditions with ICD) | |
| Medications | 14 seeded | In patient data (medications) | |
| Observations | 26 seeded | In patient data (vitals, labResults) | |
| Facilities | 12 seeded (D1) + loads/wait | 12 hardcoded (facilities.js) with wait/beds | |
| Staff | 22 seeded | None | |
| Problems | 35 seeded (ICD-10, CTAS, symptoms, red flags) | None (triage logic is algorithmic) | |
| System state | 23 metrics seeded | None (facilities have static wait times) | |
| Drug reference | 100 CSV | None | |
| FHIR examples | 3 JSON | 3 JSON (same source) | |
| Population health | 78 communities + 960 wait times + 400 opioid | 78 communities + 960 wait times + 400 opioid | |
| Allergies | None in schema | In patient data (with severity) | |
| Scenarios | 3 demo scripts (Maria, Tyler, Robert) | 6 call scripts (Margaret, Jose, Tiffany, Peter, Anna, Lee) | |

---

## 8. DEMO SCENARIOS

| Scenario | HealthLink | SILA | Decision |
|----------|-----------|------|----------|
| #1 | Maria Santos — newcomer, stomach pain → clinic (with Tagalog) | Margaret Johnson — chest pain → ER Level 1 | |
| #2 | Tyler Brooks — panic attack → follow-up question → Crisis Care | Jose Ramirez — ankle injury → ER override | |
| #3 | Robert Chen — diabetic neuropathy → dynamic reroute | Tiffany Liu — abdominal pain → UPCC | |
| #4 | (none) | Peter Callahan — headaches → Family Doctor | |
| #5 | (none) | Anna Hall — allergies → Pharmacist | |
| #6 | (none) | Lee Jackson — cold symptoms → 8-1-1 Nurse | |
| Call simulation | Auto-typed messages + call modal transcript | Socket.IO real-time with staggered call arrivals + phases | |
| Multi-call view | None (single conversation) | 6 simultaneous calls in dashboard grid | |

---

## 9. BACKEND / API

| Category | HealthLink (43 routes) | SILA (4 routes) | Decision |
|----------|----------------------|-----------------|----------|
| Health check | GET /api/health + 68-feature diagnostic | GET /api/health | |
| Auth | Login/register + Bearer tokens + demo bypass | None | |
| Records CRUD | 3 endpoints | None | |
| File upload | 2 endpoints (R2) | None | |
| Chat/routing | POST /api/chat (main) | None (client-side) | |
| Rerouting | POST /api/reroute + GET check | None (client-side notification) | |
| Facilities | GET list + GET detail | GET /api/facilities | |
| Patients | GET list + GET detail | None (hardcoded) | |
| Sessions | GET list + GET detail | GET /api/calls | |
| Analytics | GET /api/analytics | None | |
| AI assistant | POST /api/assistant/chat (streaming) | None | |
| Suggest | POST /api/assistant/suggest | None | |
| AI features | 6 endpoints (transcribe, reading-level, confidence, embed, search, vectors) | None | |
| Integrations | 5 endpoints (CRUD + test) | None | |
| Meetings | 4 endpoints + webhook | None | |
| Demo control | POST /api/demo/simulate | POST /api/demo/start | |
| WebSocket | None (polling) | Socket.IO (6 event types) | |

---

## 10. INTEGRATIONS

| Service | HealthLink | SILA | Decision |
|---------|-----------|------|----------|
| OpenAI | Configured + working + admin form | Not used | |
| Anthropic/Claude | Supported in assistant LLM | Planned (in spec, not built) | |
| Deepgram | Stubbed (WebSocket transcription) | Not used | |
| Pinecone | Stubbed (vector search) | Not used | |
| Zoom | Stubbed (config form + JWT) | Not used | |
| RingCentral | Stubbed (config form) | Not used | |
| Twilio | Not used | Planned (in spec, not built) | |
| ElevenLabs | Not used | Planned (TTS, in spec, not built) | |
| Socket.IO | Not used | Built (real-time events) | |
| Leaflet.js | Not used | Built (map with custom markers) | |

---

## 11. SAFETY & COMPLIANCE

| Feature | HealthLink | SILA | Decision |
|---------|-----------|------|----------|
| PHI detection | 7 regex patterns + scrubbing | None | |
| Mock data assertion | MOCK/SYNTHETIC markers enforced | "BC HealthTriage AI" branding, synthetic data | |
| Safety disclaimer | Appended to all non-ER responses (911 fallback) | None | |
| Content classification | safe/caution/blocked levels | None | |
| Agent pipeline safety | Pre/post step PHI checks, 1MB limit, 10 step max | None | |
| Emergency hard rules | 14 instant ER + 4 follow-up | Vital threshold scoring | |
| Encryption | AES-256-GCM for API keys | None (SECRETS.md excluded) | |
| Compliance docs | PIPEDA/provincial privacy table in THE_IDEA.md | None | |
| CORS | All responses | Express CORS middleware | |
| Request size limit | 10MB | None | |

---

## 12. DOCUMENTATION

| Document | HealthLink | SILA | Decision |
|----------|-----------|------|----------|
| Project spec | CLAUDE.md + THE_IDEA.md | CLAUDE.md + UI_PROMPT.md | |
| Research | RESEARCH_FINDINGS.md (45K+ words) | data-deep-dive.md + claude.md research | |
| Tracks/scoring | TRACKS.md | hackathon-challenge-tracks.pdf | |
| Constraints | CONSTRAINTS.md | Inline in CLAUDE.md | |
| Issues | ISSUES.md (18 issues, priority matrix) | None | |
| Ideas | ALL_IDEAS.md (24 ideas, 7 tracks) | claude.md (3 scored ideas) | |
| Domain knowledge | 4 docs (problems, staff, facilities, operations) | None | |
| Seed data docs | SEED_DATA.md | patient-profile-analysis.md | |
| Brand voice | None (inline CSS) | BRAND_VOICE.md (colors, fonts, principles) | |
| API contract | None (routes self-documenting) | API_ENDPOINTS.md (25+ endpoints specified) | |
| Deployment | In CLAUDE.md | DEPLOYMENT.md (Railway, checklist, deadline) | |
| Presentation | In THE_IDEA.md demo flow | PRESENTATION.md (7-slide outline + timing) | |
| Roadmap | None | ROADMAP.md (2-person parallel workstreams) | |
| UX spec | None | UX_DEMO.md (4 screens, component map) | |
| Scenarios | In seed.sql + carepoint.js | SCENARIOS.md (6 patient scripts) | |
| Team | None | TEAM.md (template) | |
| BC healthcare analysis | RESEARCH_FINDINGS.md | bc-healthcare-funding-vs-data-analysis.md | |
| Alignment matrix | THE_IDEA.md (YES/NO for all problems) | None | |

---

## 13. VISUAL / PRESENTATION QUALITY

| Element | HealthLink | SILA | Decision |
|---------|-----------|------|----------|
| Launch screen | Hero text + stat cards + CTA buttons | Floating medical particles + gradient orbs + feature grid | |
| Color palette | Dark (#0f1117) + blue primary (#3b82f6) | Dark (#0F172A) + bc-blue (#003366) + 22 custom tokens | |
| Animations | 13 effects (functional: load bars, cards, notifications) | 21 keyframes + glass morphism + glow effects + gradient shift + shimmer + waveform | |
| Phone simulator | None | iPhone frame with notch, waveform, speaking indicator | |
| Map visualization | None in patient UI | Leaflet dark tiles, color-coded markers, recommended pulse, legend | |
| Multi-call dashboard | None (single conversation) | 3-col grid of CallCards with status badges + pulse-glow | |
| Triage visualization | Confidence bar (horizontal) | SVG circular gauge with animated counter (0→score) | |
| Presentation deck | None in repo | 8-slide PPTX | |

---

## 14. UNIQUE STRENGTHS

| Strength | HealthLink | SILA |
|----------|-----------|------|
| Production infrastructure | Cloudflare Workers, D1, KV, R2 — live URL | Local dev + Railway planned |
| Database persistence | 16 tables, FTS5, real SQL queries | In-memory JS objects |
| AI depth | Two-stage RAG, streaming, 10 prompts, attendant assist | Client-side triage algorithm |
| Admin/ops visibility | Full admin dashboard (10 views) | None |
| Health monitoring | 68-feature self-diagnostic | None |
| Integration framework | OpenAI/Zoom/RingCentral config + encryption | None |
| Clinical safety | 14 ER rules + 4 follow-ups + PHI detection + disclaimers | Vital threshold scoring |
| Multilingual | Tagalog + French | None |
| Visual polish | Functional, clean, professional | Stunning: particles, glass morphism, phone simulator, waveforms |
| Multi-call simulation | None | 6 simultaneous calls with staggered arrivals + phases |
| Map visualization | None | Leaflet with facility markers, routing, legend |
| Real-time events | Polling | Socket.IO WebSocket |
| Triage scoring | AI confidence + hard rules | Algorithmic vital/symptom scoring (transparent) |
| Component library | Vanilla (no reusable components) | React (13 composable components) |
| Brand identity | CarePoint (functional) | SILA (Inuktitut for "life force") + full brand voice spec |
| Presentation assets | None | 8-slide PPTX + timing budget + speaker notes |
| 6 scenarios vs 3 | 3 demos (Maria, Tyler, Robert) | 6 scenarios covering all 5 care levels |

---

## 15. MERGE DECISION MATRIX

**For each category, recommend which side to use:**

| Category | Recommendation | Reasoning |
|----------|---------------|-----------|
| **Runtime/deployment** | HL | Live on Cloudflare with custom domain, DB persistence |
| **Frontend framework** | SILA | React + Tailwind is more polished, component reuse |
| **Patient-facing UI** | SILA | Phone simulator, map, multi-call, visual polish far superior |
| **Admin dashboard** | HL | Full admin SPA with 10 views — SILA has none |
| **AI/LLM engine** | HL | Two-stage RAG, streaming, attendant assist, follow-up questions |
| **Triage scoring** | MERGE | HL's hard rules + SILA's vital algorithm = best of both |
| **Routing logic** | HL | 7 destinations, barrier-aware, Indigenous/NP boost, dynamic reroute |
| **Facility matching** | MERGE | HL's D1 data + SILA's distance sorting + map visualization |
| **Demo scenarios** | MERGE | HL's 3 (deep, multi-turn) + SILA's 6 (broad, multi-call) |
| **Database** | HL | 16 tables, FTS5, 35 problems, 22 staff — SILA has in-memory only |
| **Real-time events** | SILA | Socket.IO is superior to polling |
| **Safety/guardrails** | HL | PHI detection, disclaimers, hard rules, encryption — SILA has none |
| **Map/visualization** | SILA | Leaflet with custom markers, routing arcs, legend |
| **Animations/polish** | SILA | 21 animations, glass morphism, gradient effects, phone simulator |
| **Brand/identity** | SILA | Full brand voice spec, SILA name, color system |
| **Presentation deck** | SILA | 8-slide PPTX with timing budget — HL has none |
| **Documentation** | HL | 17 .md files including 45K-word research, alignment matrix |
| **Integrations** | HL | OpenAI/Zoom/RingCentral/Deepgram framework — SILA has none |
| **Health monitoring** | HL | 68-feature diagnostic — SILA has none |
| **Multilingual** | HL | Tagalog + French — SILA has none |
| **Clinical data depth** | HL | 35 problems, 22 staff, 4 domain docs — SILA has none |
| **Compliance** | HL | PIPEDA table, encryption, PHI detection — SILA has none |

---

## 16. RECOMMENDED MERGE STRATEGY

**Base:** HealthLink (Cloudflare Workers + D1 + full backend)
**Bring from SILA:**
1. React frontend components (DemoLaunchScreen, CallCard, PatientPhonePanel, FacilityMap, TriageScore, ConversationTranscript, PostTriageScreen, NotificationBanner)
2. Tailwind CSS + 21 animations + glass morphism + brand colors
3. Leaflet.js map integration with facility markers
4. 6 call scenarios (expand from 3 to 6+)
5. Socket.IO for real-time events (replace polling)
6. Triage scoring algorithm (merge with HL's hard rules)
7. Presentation deck (8-slide PPTX)
8. Brand voice spec (SILA name + colors)
9. Phone simulator UI pattern
10. Multi-call dashboard grid view

**Keep from HealthLink:**
1. Cloudflare Workers runtime + D1 database + KV + R2
2. All 43 API endpoints
3. Two-stage RAG AI assistant
4. Attendant AI assist with suggestions
5. Safety guardrails (PHI, disclaimers, hard rules, follow-ups)
6. Admin dashboard (10 views)
7. Integration framework (OpenAI/Zoom/RingCentral)
8. Health diagnostic system (68 features)
9. Multilingual support (Tagalog/French)
10. All documentation (17 .md files)
11. Encryption (AES-256-GCM)
12. Clinical domain data (35 problems, 22 staff, 4 docs)
