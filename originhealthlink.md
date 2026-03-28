# REPO AUDIT: healthcare-hackathon (CarePoint)

## 1. TECH STACK
- Framework: Cloudflare Workers (custom router, no framework)
- Language: TypeScript (strict mode, ES2022)
- Runtime/Platform: Cloudflare Workers
- Database: D1 (SQLite) with FTS5 full-text search
- Cache/Sessions: KV Namespace
- File Storage: R2 Bucket
- AI Provider: OpenAI GPT (gpt-4o-mini via raw fetch), Deepgram (transcription), Pinecone (vector search)
- Deployment: Wrangler CLI → healthlink.madeonmerit.com (custom domain)
- Frontend Framework: Vanilla HTML/CSS/JS (no React, no build step)
- CSS Approach: Custom properties (CSS variables), hand-written

## 2. ALL FILES BY TYPE

**TypeScript (.ts) — 62 files**
- src/index.ts
- src/types.ts
- src/api/router.ts
- src/api/health.ts
- src/api/health-check.ts
- src/api/records.ts
- src/api/upload.ts
- src/api/transcribe.ts
- src/api/reading-level.ts
- src/api/confidence.ts
- src/api/vectors.ts
- src/api/carepoint.ts
- src/api/assistant.ts
- src/api/suggest.ts
- src/api/integrations.ts
- src/api/meetings.ts
- src/auth/handlers.ts
- src/auth/middleware.ts
- src/auth/tokens.ts
- src/ai/client.ts
- src/ai/confidence.ts
- src/ai/embeddings.ts
- src/ai/prompts.ts
- src/ai/reading-level.ts
- src/ai/transcribe.ts
- src/assistant/classifier.ts
- src/assistant/entity-search.ts
- src/assistant/formatter.ts
- src/assistant/llm.ts
- src/assistant/planner.ts
- src/assistant/queries.ts
- src/agent/pipeline.ts
- src/agent/safety.ts
- src/agent/steps.ts
- src/agent/types.ts
- src/carepoint/context-engine.ts
- src/carepoint/monitor.ts
- src/carepoint/rerouter.ts
- src/carepoint/routing-engine.ts
- src/carepoint/simulator.ts
- src/db/queries.ts
- src/db/queries-carepoint.ts
- src/db/supabase.ts
- src/db/supabase-queries.ts
- src/health/feature-registry.ts
- src/health/runner.ts
- src/integrations/encryption.ts
- src/lib/errors.ts
- src/lib/logger.ts
- src/lib/response.ts
- src/lib/validate.ts
- src/retrieval/document.ts
- src/retrieval/orchestrator.ts
- src/retrieval/structured.ts
- src/retrieval/types.ts
- src/retrieval/vector.ts
- src/safety/guardrails.ts
- src/safety/mock-data.ts
- src/storage/index.ts
- src/storage/kv.ts
- src/storage/pinecone.ts
- src/storage/r2.ts

**JavaScript (.js) — 7 files**
- frontend/admin.js
- frontend/api.js
- frontend/app.js
- frontend/assistant.js
- frontend/call-transcribe.js
- frontend/carepoint.js
- frontend/health.js

**HTML (.html) — 4 files**
- frontend/index.html
- frontend/admin.html
- frontend/carepoint.html
- frontend/health.html

**CSS (.css) — 4 files**
- frontend/styles.css
- frontend/admin.css
- frontend/carepoint.css
- frontend/health.css

**SQL (.sql) — 8 files**
- src/db/schema.sql
- src/db/seed.sql
- src/db/supabase-schema.sql
- templates/healthcare-schema.sql
- templates/healthcare-seed.sql
- templates/education-schema.sql
- templates/education-seed.sql
- templates/finance-schema.sql

**Markdown (.md) — 17 files**
- README.md
- CLAUDE.md
- THE_IDEA.md
- ALL_IDEAS.md
- TRACKS.md
- CONSTRAINTS.md
- ISSUES.md
- RESEARCH_FINDINGS.md
- SUMMARY_AND_RECOMMENDATION.md
- SEED_DATA.md
- GUIDE.md
- HIVE_MIND_ANALYSIS.md
- templates/TEMPLATES.md
- docs/domain/patient-problems.md
- docs/domain/hospital-staff.md
- docs/domain/facilities.md
- docs/domain/hospital-operations.md

**JSON (config files) — 4 files**
- package.json
- package-lock.json
- tsconfig.json
- .claude/settings.json

**Other files**
- wrangler.toml
- .dev.vars.example
- .gitignore
- scripts/setup.sh
- scripts/deploy.sh

## 3. DATABASE SCHEMA
- users — columns: id, email, password_hash, role, created_at, updated_at | indexes: (email UNIQUE)
- records — columns: id, title, category, content, created_by, created_at, updated_at | indexes: idx_records_category, idx_records_created_at
- records_fts — FTS5 virtual table on (title, category, content)
- patients — columns: id, first_name, last_name, birth_date, gender, language, phone, postal_code, has_family_doctor, has_insurance, barriers, conditions_summary, created_at | indexes: (none explicit)
- encounters — columns: id, patient_id, encounter_date, encounter_type, reason, provider_name, facility_id, status, created_at | indexes: idx_encounters_patient
- conditions — columns: id, patient_id, encounter_id, code, description, onset_date, status | indexes: idx_conditions_patient
- medications — columns: id, patient_id, encounter_id, code, description, dosage, frequency, status, start_date, end_date | indexes: idx_medications_patient
- observations — columns: id, patient_id, encounter_id, code, description, value, unit, observation_date | indexes: idx_observations_patient
- generated_notes — columns: id, encounter_id, patient_id, clinical_note, patient_summary, language, created_at | indexes: idx_generated_notes_encounter
- facilities — columns: id, name, type, address, latitude, longitude, phone, hours, services, capacity_total, capacity_current, wait_minutes, accepting_patients, departments, created_at, updated_at | indexes: idx_facilities_type, idx_facilities_accepting
- staff — columns: id, first_name, last_name, role, department, facility_id, is_client_facing, skills, shift_pattern, on_duty, created_at | indexes: idx_staff_facility, idx_staff_role
- problems — columns: id, title, icd10_code, type, severity, ctas_level, recommended_destination, symptoms, red_flags, related_conditions, typical_wait_tolerance, created_at | indexes: idx_problems_destination, idx_problems_ctas
- problems_fts — FTS5 virtual table on (title, symptoms, red_flags)
- routing_sessions — columns: id, patient_id, status, initial_complaint, sentiment, urgency_score, confidence_score, recommended_destination, recommended_facility_id, actual_destination, rerouted_from, reroute_reason, conversation_log, context_snapshot, created_at, updated_at, completed_at | indexes: idx_sessions_patient, idx_sessions_status, idx_sessions_created
- system_state — columns: id, facility_id, metric_name, metric_value, recorded_at | indexes: idx_system_state_facility, idx_system_state_metric
- integration_configs — columns: id, provider, config, model, is_active, is_default, created_at, updated_at | indexes: (provider UNIQUE)
- meetings — columns: id, title, provider, external_meeting_id, join_url, host_url, password, status, scheduled_at, duration_minutes, attendees, notes, provider_data, created_at, updated_at | indexes: idx_meetings_status, idx_meetings_scheduled
- llm_usage — columns: id, provider, model, input_tokens, output_tokens, total_tokens, cost_estimate, query_type, created_at | indexes: idx_llm_usage_provider, idx_llm_usage_created

## 4. SEED DATA
- users — 2 rows | demo admin + viewer accounts
- records — 5 rows | wellness visit, diabetes care plan, mental health screening, medication reconciliation, post-discharge follow-up
- patients — 6 rows | Maria Santos (newcomer/Tagalog), Robert Chen (diabetic/orphaned), Dorothy MacLeod (elderly/rural), James Whiteduck (Indigenous), Amina Hassan (caregiver), Tyler Brooks (mental health)
- encounters — 7 rows | office visits, discharge, walk-in, ER, lab review, telehealth, caregiver assessment
- conditions — 16 rows | ICD-10 coded: diabetes, hypertension, heart failure, anxiety, depression, neuropathy, knee injury, caregiver burnout, etc.
- medications — 14 rows | Metformin, Lisinopril, Atorvastatin, Furosemide, Metoprolol, Sertraline, Lorazepam, Naproxen, Omeprazole, etc.
- observations — 26 rows | BP, HR, A1C, glucose, BMI, cholesterol, triglycerides, LDL, O2 sat, temperature, weight
- facilities — 12 rows | Royal Jubilee Hospital, Victoria General, Saanich Peninsula, Westshore Urgent Care, James Bay Walk-in, Cool Aid Community Health, Island Sexual Health, Shoppers Drug Mart, Telus Health MyCare, Island Crisis Care, Esquimalt Family Practice, Victoria Native Friendship Centre
- staff — 22 rows | EM physicians, NPs, triage nurses, RNs, cardiologist, social workers, pharmacists, psychiatrist, peer support, elder/traditional healer, community health workers
- problems — 35 rows | 8 ER-required (CTAS 1-2), 8 urgent care (CTAS 3-4), 9 clinic (CTAS 4-5), 5 virtual care, 5 pharmacy/self-care
- system_state — 23 rows | ER load %, wait minutes, beds available for all facilities

## 5. API ENDPOINTS
- GET /api/health — healthHandler — system health + DB connectivity check
- POST /api/auth/login — loginHandler — user authentication
- POST /api/auth/register — registerHandler — user registration
- GET /api/records — listRecords — paginated record listing
- GET /api/records/:id — getRecord — single record by ID
- POST /api/records — createRecord — create new record
- POST /api/upload — uploadFile — file upload to R2
- GET /api/uploads — listUploads — list R2 uploads
- POST /api/ai/transcribe — transcribeHandler — Deepgram audio transcription
- POST /api/ai/reading-level — readingLevelHandler — multi-level content generation
- POST /api/ai/confidence — confidenceHandler — AI output accuracy scoring
- POST /api/ai/embed — embedHandler — text to Pinecone vector
- POST /api/ai/search — vectorSearchHandler — semantic search via Pinecone
- GET /api/ai/vectors/stats — vectorStatsHandler — Pinecone index statistics
- POST /api/chat — chatHandler — main CarePoint routing conversation
- POST /api/reroute — rerouteHandler — accept/decline reroute offer
- GET /api/reroute/check/:sessionId — rerouteCheckHandler — poll for reroute availability
- GET /api/facilities — facilitiesListHandler — list all facilities
- GET /api/facilities/:id — facilityDetailHandler — single facility detail
- GET /api/sessions — sessionsListHandler — list routing sessions
- GET /api/sessions/:id — sessionDetailHandler — single session with conversation log
- GET /api/system/snapshot — systemSnapshotHandler — real-time system state
- GET /api/patients — patientsListHandler — list patients
- GET /api/patients/:id — patientDetailHandler — full patient profile (conditions, meds, encounters, observations)
- GET /api/problems — problemsListHandler — list medical problems
- GET /api/encounters — encountersListHandler — list all encounters
- GET /api/staff — staffListHandler — list all staff
- GET /api/analytics — analyticsHandler — routing stats, diversion rate, confidence distribution
- POST /api/assistant/chat — assistantChatHandler — two-stage RAG assistant (streaming)
- POST /api/assistant/suggest — suggestHandler — attendant assist suggestions from transcript
- GET /api/integrations — integrationsListHandler — list integration configs
- GET /api/integrations/:provider — integrationDetailHandler — single provider config
- PUT /api/integrations/:provider — integrationUpsertHandler — save provider config
- DELETE /api/integrations/:provider — integrationDeleteHandler — remove provider config
- POST /api/integrations/:provider/test — integrationTestHandler — test connection
- POST /api/meetings — meetingCreateHandler — create meeting
- GET /api/meetings — meetingsListHandler — list meetings
- GET /api/meetings/:id — meetingDetailHandler — meeting detail
- PATCH /api/meetings/:id/status — meetingStatusHandler — update meeting status
- POST /api/demo/simulate — demoSimulateHandler — trigger facility state changes
- GET /api/health/features — healthFeaturesHandler — run all 68 feature health checks
- POST /api/health/diagnose — healthDiagnoseHandler — deep diagnosis for failing features
- POST /api/webhooks/zoom — zoomWebhookHandler — Zoom meeting lifecycle webhook

## 6. FRONTEND PAGES / VIEWS
- Landing Page — / (index.html) — hero, problem stats, solution cards, hamburger nav
- CarePoint Chat — /carepoint.html — split-screen patient chat + system dashboard
- Admin Dashboard — /admin.html#dashboard — metrics, facility bars, routing feed, patient cards
- Admin Live Routing — /admin.html#routing — embedded carepoint iframe
- Admin Patients — /admin.html#patients — patient table + expandable detail
- Admin Problems — /admin.html#problems — filterable problems table
- Admin Encounters — /admin.html#encounters — encounter history table
- Admin Facilities — /admin.html#facilities — facility grid with load bars
- Admin Staff — /admin.html#staff — staff table by facility
- Admin Sessions — /admin.html#sessions — routing sessions with conversation logs
- Admin Analytics — /admin.html#analytics — diversion rate, confidence distribution, sentiment, competitive comparison
- Admin Integrations — /admin.html#integrations — OpenAI/Zoom/RingCentral config forms
- Admin Meetings — /admin.html#meetings — meeting CRUD
- Health Diagnostic — /health.html — 68-feature health check dashboard

## 7. UI COMPONENTS
- Chat bubble (patient/carepoint/system) — message display — carepoint.html
- Typing indicator — three-dot animation — carepoint.html
- Patient selector dropdown — switch between 6 personas — carepoint.html
- Language toggle (EN/TL/FR) — switch response language — carepoint.html
- Demo scenario selector + Play/Reset — demo automation — carepoint.html
- Routing decision card — destination + confidence bar + facility + reasoning — carepoint.html
- Confidence meter bar — color-coded 0-100% — carepoint.html
- Sentiment indicator — emoji + label — carepoint.html
- Facility load grid — name + load bar + wait time — carepoint.html
- Reroute notification banner — slide-in offer with accept/dismiss — carepoint.html
- Journey comparison card — before/after side-by-side — carepoint.html
- Impact projection card — metrics + annual savings — carepoint.html
- Call transcription modal — transcript + suggestions split view — carepoint.html
- Quick response buttons — clickable intake templates — carepoint.html (modal)
- AI suggestion cards — prioritized agent assist suggestions — carepoint.html (modal)
- Session feed — recent routing decisions — carepoint.html
- System stats row — active/routed/diverted counters — carepoint.html
- Metric cards (4 types: blue/green/red/purple/yellow) — dashboard metrics — admin.html
- Facility bar chart — horizontal load bars — admin.html
- Patient persona cards — clickable patient summary — admin.html
- Data tables (expandable rows) — patients, problems, encounters, staff, sessions — admin.html
- Patient detail panel — demographics + conditions + meds + encounters + observations — admin.html
- Facility grid cards — load + services + staff + accepting status — admin.html
- Conversation log viewer — patient/carepoint message bubbles — admin.html
- Analytics bar charts — destination distribution + sentiment + confidence — admin.html
- Competitive comparison table — CarePoint vs 811 vs MyChart vs OceanMD — admin.html
- Integration config forms — OpenAI/Zoom/RingCentral with setup instructions — admin.html
- Meeting create form — title, provider, datetime, duration — admin.html
- AI assistant drawer — bottom-right chat panel with streaming — admin.html
- Sidebar navigation — collapsible with sections — admin.html
- Hamburger menu overlay — slide-in navigation — index.html
- Problem stat cards (500K, 30%, 6.5M) — problem framing — index.html
- Health check feature list — grouped by category with expand — health.html
- Health diagnostic modal — step-by-step diagnosis — health.html
- Health summary bar — green/yellow/red/grey counts + score — health.html
- Skip-to-content link — keyboard accessibility — carepoint.html

## 8. UX FEATURES
- Navigation pattern: Hamburger menu (landing), sidebar (admin), split-screen (carepoint), hash routing (admin SPA)
- Mobile responsive: yes (media queries at 768px and 1024px)
- Accessibility features: skip-to-content link, ARIA live regions, role=log on chat, role=complementary on dashboard, aria-labels on messages, screen reader announcements
- Loading states: typing indicator in chat, "Loading..." text in dashboard
- Error states: safety fallback messages with 911/811/988 numbers, graceful API failure handling
- Animations/transitions: fadeIn on messages, cardSlideIn on decision, load bar width transitions, reroute notification slide-in/out, typing dot animation, card-enter animation
- Dark/light theme: dark (carepoint patient UI), light (admin dashboard)

## 9. AI / LLM FEATURES
- CarePoint Routing — gpt-4o-mini — converts symptoms to routing destination (ER/clinic/urgent/virtual/pharmacy/crisis) — POST /api/chat
- Multi-turn Conversation — gpt-4o-mini — maintains conversation history with sentiment-aware tone — POST /api/chat
- AI Assistant (two-stage RAG) — gpt-4o-mini — planner LLM → D1 queries → answerer LLM (streaming) — POST /api/assistant/chat
- Attendant Assist — gpt-4o-mini — analyzes call transcript, returns structured suggestions — POST /api/assistant/suggest
- Reading Level Generator — gpt-4o-mini — generates content at simple/standard/detailed levels — POST /api/ai/reading-level
- Confidence Scorer — gpt-4o-mini — scores AI output accuracy 0-100 — POST /api/ai/confidence
- Text Embedding — text-embedding-3-small — converts text to 1536-dim vectors — POST /api/ai/embed
- Audio Transcription — Deepgram nova-3 — speech-to-text with word timings — POST /api/ai/transcribe

## 10. RAG / RETRIEVAL
- StructuredRetriever (d1) — D1 database FTS5 — full-text search on records table
- DocumentRetriever (r2) — R2 object storage — lists/filters documents by keyword
- VectorRetriever (vector) — Pinecone — semantic search via embeddings
- CarePoint Context Engine — D1 (patients, conditions, meds, encounters, observations, problems, facilities, system_state) — parallel queries assembled into PatientContext
- Assistant Planner — D1 via 9 intent-specific query functions — pulls structured data before LLM

## 11. AI ASSISTANT
- Exists: yes
- Architecture: Two-stage RAG (planner LLM → 9 healthcare query functions → answerer LLM with streaming)
- UI location: Admin dashboard drawer (bottom-right, slides up)
- Streaming: yes (OpenAI + Anthropic SSE stream parsing)
- Features: patient lookup, facility status, problem info, routing history, staff lookup, encounter history, system overview, medication info, general summary, keyword classifier fallback, cross-table entity search (patients/staff/facilities by name), chat history in localStorage

## 12. ROUTING / DECISION ENGINE
- Hard Rules (instant ER) — 14 keyword groups for immediate emergency routing (chest pain, stroke, seizure, overdose, bleeding, anaphylaxis, vision loss, pregnancy, psychosis, suicidal ideation) — keyword matching
- Follow-Up Rules — 4 ambiguous symptom groups that ask clarifying question before routing (breathing difficulty, severe headache, fainting, falls) — keyword + softener matching
- FTS Problem Matching — matches patient complaint to 35 medical conditions via full-text search — returns CTAS level + recommended destination
- AI Soft Routing — GPT evaluates complaint + patient context + facility state for CTAS 3-5 ambiguous cases — structured JSON output
- Facility Selection — filters by destination type, boosts community health for patients with barriers, boosts Indigenous health for trust_deficit, boosts NP facilities for non-acute — sorted by wait time
- Dynamic Rerouter — monitors session + facility state, offers switch when better option saves 30+ min or 50% wait reduction — never reroutes CTAS 1-2
- Facility State Simulator — updates D1 with real state changes during demos (robert_reroute, er_surge, tick fluctuations, reset)

## 13. DEMO SCENARIOS
- Maria (ER Diversion) — SYN-PAT-001, newcomer from Philippines — stomach pain → routed to Cool Aid Community Health instead of ER, Tagalog translation shown — ~45s
- Tyler (Mental Health) — SYN-PAT-006, university student — panic attack with breathing difficulty → follow-up question → routed to Crisis Care Centre — ~30s
- Robert (Dynamic Reroute) — SYN-PAT-002, diabetic — foot numbness → routed to facility → simulator changes state → real reroute notification → accepts switch — ~45s
- Demo transcript simulations — Maria/Tyler/Robert attendant conversations play in call modal with AI suggestions

## 14. INTEGRATIONS (3rd Party)
- OpenAI — configured — GPT routing decisions, assistant chat, reading level, confidence, embeddings
- Deepgram — stubbed (requires API key) — real-time audio transcription via WebSocket
- Pinecone — stubbed (requires API key) — vector semantic search
- Zoom — stubbed (config form built) — video meeting creation, JWT signatures, webhook lifecycle
- RingCentral — stubbed (config form built) — phone/video for patient intake calls
- Supabase — stubbed (alternate backend) — optional PostgreSQL backend via REST

## 15. AUTHENTICATION & AUTHORIZATION
- Auth method: Bearer token (HMAC-SHA256 signed, 24h TTL, stored in KV)
- Demo mode: DEMO_MODE=true bypasses all auth, returns demo admin user
- Role-based access: admin, viewer, user roles on users table
- Token management: create/verify/revoke via KV with expiry

## 16. SAFETY & GUARDRAILS
- PHI Pattern Detection — regex scan for SSN, phone, email, MRN, DOB, Medicare, IP addresses
- PHI Scrubbing — replaces detected PHI with [REDACTED]
- Mock Data Assertion — warns if data doesn't contain MOCK/SYNTHETIC markers
- Content Classification — classifies text as safe/caution/blocked
- Agent Pipeline Safety — pre/post-step checks for PHI, data size limits (1MB), max 10 steps
- Safety Disclaimer — appended to all non-ER routing responses ("If symptoms worsen, call 911")
- Hard Rules — emergency keywords always route to ER regardless of AI output
- Follow-Up Rules — ambiguous symptoms get clarifying question before routing

## 17. ENCRYPTION & SECURITY
- API key storage: AES-256-GCM encryption via Web Crypto API (enc: prefix format)
- Data encryption: All integration credentials encrypted before D1 storage
- CORS: Headers on all API responses via response.ts
- Request validation: requireFields(), validateEmail(), parseBody(), parseQuery()
- Size limits: 10MB request body limit (413 for oversized), 25MB audio file limit

## 18. STORAGE LAYER
- D1 (env.DB) — all structured data (patients, facilities, routing sessions, etc.) — SQL queries via queries.ts and queries-carepoint.ts
- KV (env.KV) — auth tokens (24h TTL), feature flags, cached lookups — kvGet/kvSet/kvDelete/kvList
- R2 (env.R2) — uploaded documents, files, images — uploadToR2/downloadFromR2/listR2Objects
- Pinecone — vector embeddings for semantic search — upsert/query/fetch/delete via REST
- localStorage (frontend) — AI assistant chat history, sidebar collapse state, drawer height

## 19. PROMPTS & SYSTEM MESSAGES
- SAFETY_PREAMBLE — base safety rules for all healthcare prompts — N/A — N/A
- ASSISTANT_PROMPT — general assistant — default temp — default tokens
- SUMMARIZE_PROMPT — record summarization — default temp — default tokens
- ANALYZE_PROMPT — pattern analysis — default temp — default tokens
- ROUTING_SYSTEM_PROMPT — CarePoint routing decisions (destination, urgency, confidence, reasoning in JSON) — 0.3 — 500
- buildConversationPrompt() — multi-turn with sentiment tone map (8 sentiments) — varies — varies
- buildRAGPrompt() — context injection with source attribution — default — default
- ATTENDANT_ASSIST_PROMPT — real-time call suggestions (ask/info/route/escalate in JSON) — 0.2 — 500
- Planner prompt — intent classification (9 healthcare intents) — 0 — 200
- Answerer prompt — data analysis using retrieved context — 0.1 — 1500

## 20. CLINICAL / DOMAIN DATA
- docs/domain/patient-problems.md — 35 conditions — ICD-10 codes, CTAS levels, severity, symptoms, red flags, destinations, wait tolerance
- docs/domain/hospital-staff.md — 22 roles — department, scope, client-facing, skills, shift patterns
- docs/domain/facilities.md — 18 facility types + 12 instances — Victoria-area with hours, services, capacity, load data
- docs/domain/hospital-operations.md — 7 sections — ER flow, admission, discharge, referral pathways, department interactions, load dynamics, operational metrics
- data/track-1-clinical-ai/ — 22,000+ records — patients (2K), encounters (10K), medications (5K), labs (3K), vitals (2K) CSV from UVic hackathon data kit
- data/track-2-population-health/ — 1,400+ records — BC health indicators (78), wait times (960), opioid surveillance (400) CSV
- data/shared/drug-database/ — 100 rows — Canadian drug reference with DIN, class, indication
- data/shared/fhir-examples/ — 3 files — FHIR R4 Patient, Encounter, Observation JSON

## 21. DOCUMENTATION (.md FILES)
- README.md — project overview, setup instructions
- CLAUDE.md — Claude Code instructions, branch workflow, deployment rules, architecture, conventions
- THE_IDEA.md — CarePoint concept, alignment matrix (YES/NO), demo flow, architecture, judge Q&A, compliance path, future work
- ALL_IDEAS.md — 24 ideas across 7 tracks, scoring criteria, unified concept
- TRACKS.md — hackathon tracks, scoring rubric, submission requirements, track analysis
- CONSTRAINTS.md — time, technical, healthcare, user, system, judging constraints, non-negotiables
- ISSUES.md — 18 strategic issues with priority matrix
- RESEARCH_FINDINGS.md — 45,000+ words of patient/provider/system pain points with sources
- SUMMARY_AND_RECOMMENDATION.md — research synthesis, CareClarity alternative, CarePoint recommendation
- SEED_DATA.md — all seed data documentation, CSV dataset inventory, external APIs
- GUIDE.md — setup and usage guide
- HIVE_MIND_ANALYSIS.md — multi-agent analysis
- docs/domain/patient-problems.md — 35 medical conditions reference
- docs/domain/hospital-staff.md — 22 staff roles reference
- docs/domain/facilities.md — 18 facility types + 12 instances
- docs/domain/hospital-operations.md — hospital operational flows
- templates/TEMPLATES.md — database template documentation

## 22. CONFIGURATION
- wrangler.toml: worker name "healthlink", custom domain healthlink.madeonmerit.com, D1/KV/R2 bindings, static assets from ./frontend
- Environment variables: OPENAI_API_KEY, DEEPGRAM_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_HOST, AUTH_SECRET, DEMO_MODE, ENVIRONMENT, APP_NAME, BACKEND, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Build scripts: dev, deploy, db:migrate, db:seed, db:migrate:remote, db:seed:remote, setup, typecheck, tail

## 23. ANIMATIONS & VISUAL EFFECTS
- fadeIn — chat bubbles appear — CSS @keyframes
- cardSlideIn — decision card entrance — CSS @keyframes
- card-enter — dashboard card entrance — CSS @keyframes
- rerouteSlideIn — reroute notification slides in — CSS @keyframes
- reroute-exit — reroute notification slides out — CSS class
- typingDot — three-dot typing indicator pulse — CSS @keyframes
- pulse — LIVE badge opacity pulse — CSS @keyframes
- load bar width transition — facility load changes — CSS transition (0.5s)
- confidence bar transition — confidence meter fills — CSS transition (0.5s)
- autoType — character-by-character typing in demos — JS setTimeout loop
- facility grid animation — smooth bar updates instead of rebuild — JS DOM manipulation
- sidebar collapse transition — sidebar width change — CSS transition (0.2s)
- assistant drawer slide-up — drawer opens from bottom — CSS transform transition (0.3s)

## 24. ERROR HANDLING
- Global error handler: router.ts catches AppError and unhandled errors, returns structured JSON
- Custom error classes: AppError, NotFoundError, UnauthorizedError, ValidationError, ForbiddenError (all in errors.ts)
- User-facing error messages: chat fallback with 911/811/988 numbers, "Connection error" with safety instructions
- Fallback behaviors: AI routing falls back to FTS when API fails, assistant falls back to keyword classifier, suggest endpoint has rule-based fallback suggestions

## 25. HEALTH CHECKS / MONITORING
- Health endpoint: GET /api/health — DB connectivity, app status, demo mode flag
- Feature registry: 68 features across 13 categories (api_core, auth, api_carepoint, api_ai, api_assistant, api_integrations, api_meetings, api_demo, database, frontend, engine, safety, storage)
- Diagnostics: GET /api/health/features (run all checks), POST /api/health/diagnose (deep diagnosis), internal dispatch (no loopback), health score calculation
- Health dashboard: /health.html with search, category filter, expandable details, diagnostic modal

## 26. PATIENT-FACING FEATURES
- Symptom description chat — describe symptoms in plain language, get routing decision
- Real-time facility matching — see which facility is open, how long the wait is
- Dynamic rerouting notifications — get notified when a shorter wait becomes available
- Safety disclaimers — every non-ER response includes "call 911 if symptoms worsen"
- Multilingual support — Tagalog and French translations of routing responses
- Follow-up questions — system asks clarifying question before ER routing for ambiguous symptoms
- Journey comparison — visual before/after showing CarePoint vs traditional path
- Impact projection — see metrics on wait time saved and ER diversions

## 27. PROVIDER/ADMIN-FACING FEATURES
- Admin dashboard — overview metrics (patients, facilities, ER load, problems), facility load bars, routing feed
- Patient management — full patient profiles with conditions, medications, encounters, observations, barriers
- Facility monitoring — 12 facilities with real-time load %, wait times, services, staff count
- Routing session history — conversation logs, decision details, clinical reasoning, reroute history
- Analytics — ER diversion rate, destination distribution, confidence distribution, sentiment, competitive positioning
- Staff directory — all staff by facility, role, department, on-duty status
- Problem reference — 35 conditions filterable by destination/CTAS with expandable details
- Integration management — OpenAI, Zoom, RingCentral config forms with setup instructions and test
- Meeting management — create/list meetings with status tracking
- Health diagnostics — 68-feature health check with diagnostic drill-down
- AI assistant — two-stage RAG chat for querying system data

## 28. ATTENDANT/INTAKE WORKER FEATURES
- Live call transcription — Deepgram WebSocket for real-time speech-to-text
- Demo transcript simulation — auto-typed conversations for Maria/Tyler/Robert
- AI agent assist suggestions — real-time suggestions (ask/info/route/escalate) from transcript analysis
- Quick response templates — Pain 1-10, Family Dr, Medications, How long, Allergies, Escalate buttons
- Emergency detection — chest pain, breathing, suicidal ideation trigger immediate critical alerts
- Speaker labels — Patient/Attendant lines in transcript with color coding

## 29. MULTILINGUAL SUPPORT
- Languages supported: English (primary), Tagalog, French
- Translation approach: Pre-written translations per routing destination (clinic, urgent_care, mental_health_crisis, pharmacy, safety disclaimer)
- Which features are translated: CarePoint routing responses, safety disclaimers — triggered by language toggle on patient selector (Maria = Tagalog option)

## 30. TESTING
- Unit tests: (none)
- Integration tests: (none)
- E2E tests: (none)
- Test framework: (none — health checks serve as runtime verification with 68 feature checks)

## 31. UNIQUE / DIFFERENTIATING FEATURES
- Dynamic rerouting with REAL facility state changes — simulator updates D1, reroute checker finds changes organically (not simulated)
- Follow-up questions before ER routing — asks "chest pain?" before routing breathing difficulty to ER (prevents panic attack → ER misroute)
- Two-stage RAG assistant — planner LLM classifies intent, D1 queries pull ALL data first, answerer LLM only interprets (data never hallucinated)
- 14 instant ER keyword groups + 4 follow-up keyword groups — most comprehensive safety rule set
- Indigenous health centre prioritization — patients with trust_deficit barriers get culturally safe routing
- NP service boost — non-acute conditions routed to facilities with nurse practitioner services
- Attendant AI assist — lower-level intake workers get real-time suggestions during live calls
- Journey comparison card — visual before/after that makes value proposition visceral
- 68-feature health diagnostic system — self-monitoring with category grouping, search, diagnostic drill-down
- Alignment matrix in THE_IDEA.md — explicit YES/NO mapping to every hackathon problem and opportunity
- Compliance & regulatory path table — PIPEDA, consent, encryption, audit trail mapped with current status
- Cost economics in impact card — $1,800 ER vs $150-350 clinic, projected annual regional savings
