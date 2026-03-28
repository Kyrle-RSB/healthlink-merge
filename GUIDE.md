# Hackathon Boilerplate — Quick Start Guide

Everything you need to know before you start building. Read this in 10 minutes, then go.

---

## What Is This?

A ready-to-go backend + frontend running on **Cloudflare Workers** (edge compute). It gives you:

- A working API with auth, CRUD, file upload, and AI endpoints
- A database (SQLite via D1) with full-text search
- Key-value cache (KV) for sessions and fast lookups
- File storage (R2) for uploads
- AI integration (OpenAI GPT + Deepgram voice transcription + Pinecone vector search)
- Safety guardrails that catch real data patterns
- A clean frontend with role-based views

All data is mock/synthetic. No real user data anywhere.

---

## Folder Map

```
├── frontend/                 ← The UI (vanilla HTML/CSS/JS, no build step)
│   ├── index.html            ← All pages in one file
│   ├── styles.css            ← Dark theme, all components styled
│   ├── app.js                ← Page logic, role switching, event handlers
│   └── api.js                ← API client (fetch wrapper for all endpoints)
│
├── src/                      ← The backend (TypeScript, runs on Cloudflare Workers)
│   ├── index.ts              ← Entry point — route registration + static serving
│   ├── types.ts              ← All shared types (Env, ApiResponse, AuthUser)
│   │
│   ├── api/                  ← API endpoint handlers
│   │   ├── router.ts         ← Custom URL pattern router (no framework)
│   │   ├── health.ts         ← GET /api/health
│   │   ├── records.ts        ← CRUD /api/records
│   │   ├── upload.ts         ← POST /api/upload
│   │   ├── transcribe.ts     ← POST /api/ai/transcribe (voice → text)
│   │   ├── reading-level.ts  ← POST /api/ai/reading-level (3 levels)
│   │   ├── confidence.ts     ← POST /api/ai/confidence (score AI output)
│   │   └── vectors.ts        ← POST /api/ai/embed, /search, /vectors/stats
│   │
│   ├── ai/                   ← AI utilities
│   │   ├── client.ts         ← OpenAI GPT wrapper (raw fetch, no SDK)
│   │   ├── prompts.ts        ← Prompt templates with safety preambles
│   │   ├── transcribe.ts     ← Deepgram audio transcription (raw fetch)
│   │   ├── reading-level.ts  ← Multi-level output generator
│   │   ├── confidence.ts     ← Two-pass confidence scorer
│   │   └── embeddings.ts     ← OpenAI text-embedding API (raw fetch)
│   │
│   ├── db/                   ← Database layer
│   │   ├── schema.sql        ← D1 tables + FTS5 search index
│   │   ├── seed.sql          ← Mock data fixtures
│   │   ├── queries.ts        ← Typed D1 query helpers
│   │   ├── supabase.ts       ← Supabase REST client (no SDK)
│   │   ├── supabase-queries.ts ← Supabase query helpers (mirrors queries.ts)
│   │   └── supabase-schema.sql ← Postgres schema for Supabase users
│   │
│   ├── auth/                 ← Authentication
│   │   ├── middleware.ts     ← Auth check + demo mode bypass
│   │   ├── tokens.ts         ← Token create/verify via KV
│   │   └── handlers.ts       ← Login/register endpoints
│   │
│   ├── agent/                ← Agentic workflow engine
│   │   ├── pipeline.ts       ← Step-based executor with safety guards
│   │   ├── steps.ts          ← Example steps (retrieve → analyze → respond)
│   │   ├── safety.ts         ← Pre/post-step safety checks
│   │   └── types.ts          ← AgentStep, AgentContext interfaces
│   │
│   ├── retrieval/            ← Multi-source search
│   │   ├── orchestrator.ts   ← Routes queries to D1, R2, Pinecone
│   │   ├── structured.ts     ← D1 full-text search retriever
│   │   ├── document.ts       ← R2 document search retriever
│   │   ├── vector.ts         ← Pinecone semantic search retriever
│   │   └── types.ts          ← Retriever interface
│   │
│   ├── storage/              ← Cloud storage helpers
│   │   ├── kv.ts             ← KV get/set/delete
│   │   ├── r2.ts             ← R2 upload/download
│   │   ├── pinecone.ts       ← Pinecone vector DB client (raw fetch)
│   │   └── index.ts          ← Unified exports
│   │
│   ├── safety/               ← Healthcare safety guardrails
│   │   ├── guardrails.ts     ← PHI pattern detection + content classification
│   │   └── mock-data.ts      ← Synthetic data fixtures
│   │
│   └── lib/                  ← Shared utilities
│       ├── errors.ts         ← Custom error classes
│       ├── response.ts       ← API response builders
│       ├── logger.ts         ← Structured JSON logging
│       └── validate.ts       ← Input validation helpers
│
├── templates/                ← Swappable domain schemas
│   ├── TEMPLATES.md          ← How to use templates
│   ├── healthcare-schema.sql ← Healthcare tables (providers, patients, sessions, insights)
│   ├── healthcare-seed.sql   ← Healthcare mock data
│   ├── education-schema.sql  ← Education tables (students, courses, assignments, tutoring)
│   ├── education-seed.sql    ← Education mock data
│   ├── finance-schema.sql    ← Finance tables (accounts, transactions, budgets, insights)
│   └── finance-seed.sql      ← Finance mock data
│
├── scripts/
│   ├── setup.sh              ← One-command local setup
│   └── deploy.sh             ← One-command deploy
│
├── wrangler.toml             ← Cloudflare config (bindings, env vars)
├── .dev.vars.example         ← Environment variable template
├── package.json              ← Zero runtime dependencies
└── CLAUDE.md                 ← Instructions for Claude Code
```

---

## API Endpoints

| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| GET | `/api/health` | No | System status, DB check |
| POST | `/api/auth/login` | No | Login → get token |
| POST | `/api/auth/register` | No | Register → get token |
| GET | `/api/records` | Yes* | List records (paginated) |
| GET | `/api/records/:id` | Yes* | Get single record |
| POST | `/api/records` | Yes* | Create record |
| POST | `/api/upload` | Yes* | Upload file to R2 |
| GET | `/api/uploads` | Yes* | List uploaded files |
| POST | `/api/ai/transcribe` | Yes* | Audio → text (Deepgram) |
| POST | `/api/ai/reading-level` | Yes* | Text → 3 reading levels |
| POST | `/api/ai/confidence` | Yes* | Score AI output accuracy |
| POST | `/api/ai/embed` | Yes* | Index content into Pinecone |
| POST | `/api/ai/search` | Yes* | Semantic search across vectors |
| GET | `/api/ai/vectors/stats` | Yes* | Pinecone index statistics |

*Auth bypassed in demo mode (default)

---

## AI Features

### Voice Transcription (`/api/ai/transcribe`)
Upload audio, get text back. Uses Deepgram's nova-3 model.
- Accepts: multipart form data (`audio` field) or raw audio body
- Returns: transcript, confidence, word timings, duration
- Needs: `DEEPGRAM_API_KEY` in `.dev.vars`

### Multi-Reading-Level (`/api/ai/reading-level`)
Send any text, get three versions back:
- **Simple** — plain language, no jargon, a 10-year-old could follow
- **Standard** — professional but accessible
- **Detailed** — full technical/clinical depth

Great for patient portals, education apps, accessibility compliance.
- Needs: `OPENAI_API_KEY` in `.dev.vars`

### Confidence Scoring (`/api/ai/confidence`)
Two-pass quality check for AI-generated content:
1. You generate content from a source (summary, analysis, etc.)
2. Send both the `original` source and `generated` output to this endpoint
3. Returns: score (0-100), reasoning, and flags

Use this to show confidence badges next to AI output in your UI.
- Needs: `OPENAI_API_KEY` in `.dev.vars`

### Vector Search (`/api/ai/embed` + `/api/ai/search`)
Semantic search powered by Pinecone + OpenAI embeddings.

**Indexing** — POST to `/api/ai/embed`:
```json
{ "id": "rec_001", "content": "Patient has chest pain...", "metadata": { "category": "visit" } }
```
Or batch: `{ "items": [{ "id": "...", "content": "..." }, ...] }` (max 100)

**Searching** — POST to `/api/ai/search`:
```json
{ "query": "chest pain symptoms", "topK": 5 }
```
Returns matches ranked by semantic similarity with scores.

**How it works:**
1. Text → OpenAI `text-embedding-3-small` → 1536-dimension vector
2. Vector stored/queried in Pinecone (cosine similarity)
3. Results include the original content + metadata + similarity score

The vector retriever also auto-plugs into the retrieval orchestrator, so the agent pipeline can use it alongside D1 and R2 searches.

- Needs: `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_HOST` in `.dev.vars`
- Index config: 1536 dimensions, cosine metric, free tier is fine

---

## Frontend Features

### Role Switcher
Three built-in roles with different dashboard views:
- **Admin** — system health, stats, safety notices
- **Provider** — patient list, pending reviews, confidence scores
- **User** — personal summary, reading level toggle, action items

Switch roles with the toggle in the header. Add more roles by:
1. Adding a button in the role-switcher div
2. Adding a `dashboard-{role}` div in the dashboard section
3. Updating `updateRoleViews()` in app.js

### Reading Level Toggle
The User dashboard demonstrates the three-level reading pattern. Click Simple/Standard/Detailed to see the same medical information at different depths. Wire this to the `/api/ai/reading-level` endpoint for dynamic content.

### Voice Page
Upload an audio file and transcribe it. Shows confidence badge and word count. Wire to `/api/ai/transcribe`.

---

## Choosing Your Database

### Option A: D1 (Default)
SQLite on Cloudflare's edge. Already configured.
```bash
npm run db:migrate && npm run db:seed
npm run dev
```

### Option B: Supabase
Managed Postgres with a REST API. Better if your team knows Postgres.
1. Create a free project at supabase.com
2. Add to `.dev.vars`:
   ```
   BACKEND=supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run `src/db/supabase-schema.sql` in the Supabase SQL Editor
4. The backend auto-detects which to use based on `BACKEND`

Both use the same query interface — switching is transparent to the frontend.

---

## Domain Templates

Pre-built schemas for common hackathon domains. In `templates/`:

| Domain | Tables | Use For |
|--------|--------|---------|
| **Healthcare** | providers, patients, sessions, insights, action_items | Patient portals, clinical tools, health AI |
| **Education** | instructors, students, courses, enrollments, assignments, submissions, tutoring | LMS, AI tutoring, adaptive learning |
| **Finance** | clients, advisors, accounts, transactions, budgets, financial_insights | Budgeting apps, investment tools, fintech |

To swap in a template:
```bash
cp templates/healthcare-schema.sql src/db/schema.sql
cp templates/healthcare-seed.sql src/db/seed.sql
npm run db:migrate && npm run db:seed
```
Then update `src/db/queries.ts` with typed helpers for the new tables.

---

## Quick Start (5 minutes)

```bash
# 1. Install
npm install

# 2. Configure
cp .dev.vars.example .dev.vars
# Edit .dev.vars — add your API keys

# 3. Set up database
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev
# Open http://localhost:8787
```

---

## Adding a New Feature (Cheat Sheet)

### New API endpoint
1. Create `src/api/your-handler.ts`
2. Import + register in `src/index.ts`: `route("POST", "/api/your-path", handler, true)`
3. Add client method in `frontend/api.js`

### New database table
1. Add CREATE TABLE to `src/db/schema.sql`
2. Add seed data to `src/db/seed.sql`
3. Add typed queries to `src/db/queries.ts`
4. Run `npm run db:migrate && npm run db:seed`

### New AI feature
1. Add utility function in `src/ai/your-feature.ts`
2. Use `chatCompletion()` from `src/ai/client.ts`
3. Include `SAFETY_PREAMBLE` in your system prompt
4. Create API endpoint + frontend UI

### New frontend page
1. Add `<section id="page-yourpage" class="page">` in `index.html`
2. Add `<button class="nav-btn" data-page="yourpage">` to the nav
3. Navigation is auto-wired by `app.js`

---

## Environment Variables

| Variable | Required | Where | Purpose |
|----------|----------|-------|---------|
| `OPENAI_API_KEY` | For AI features | `.dev.vars` | GPT completions |
| `AUTH_SECRET` | For real auth | `.dev.vars` | Token signing |
| `DEMO_MODE` | No (default: true) | `.dev.vars` | Bypass auth |
| `DEEPGRAM_API_KEY` | For voice | `.dev.vars` | Audio transcription |
| `BACKEND` | No (default: d1) | `.dev.vars` | "d1" or "supabase" |
| `SUPABASE_URL` | If using Supabase | `.dev.vars` | Project URL |
| `SUPABASE_ANON_KEY` | If using Supabase | `.dev.vars` | Publishable key |
| `PINECONE_API_KEY` | For vector search | `.dev.vars` | Pinecone auth |
| `PINECONE_INDEX_HOST` | For vector search | `.dev.vars` | Full index URL |

---

## Safety Rules

- All data is marked MOCK/SYNTHETIC — keep it that way
- PHI patterns (SSNs, real emails, MRNs) are auto-detected and blocked
- AI prompts include safety preambles
- The agent pipeline halts if real data patterns appear
- This is NOT HIPAA-compliant — it's a hackathon scaffold

---

## Deployment

```bash
# First time: create Cloudflare resources
wrangler d1 create hackathon-db
wrangler kv namespace create CACHE
wrangler r2 bucket create hackathon-assets
# Update wrangler.toml with the IDs from above

# Set secrets
wrangler secret put OPENAI_API_KEY
wrangler secret put AUTH_SECRET

# Deploy
npm run deploy
```

**Important:** Use `wrangler deploy`, NOT `wrangler pages deploy`. The Worker serves both API and frontend.
