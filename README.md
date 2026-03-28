# Hackathon Boilerplate

A reusable, Cloudflare-native starter codebase optimized for rapid prototyping during hackathons. Healthcare-safe by default — uses only mock/synthetic data.

Built for [XperienC AI](https://xperienc.ai) by a non-traditional builder using Claude Code.

---

## What's Included

| Module | Location | Purpose |
|--------|----------|---------|
| **API Router** | `src/api/router.ts` | Lightweight URL pattern matching, no dependencies |
| **Auth Scaffold** | `src/auth/` | JWT-like tokens via KV, demo mode bypass |
| **Database** | `src/db/` | D1 schema, FTS5 search, typed queries, mock seed data |
| **Storage** | `src/storage/` | KV (sessions, cache) + R2 (files, documents) helpers |
| **Retrieval Layer** | `src/retrieval/` | Orchestrator that routes queries to D1 or R2 |
| **AI Integration** | `src/ai/` | OpenAI GPT wrapper, prompt templates with safety preambles |
| **Agent Pipeline** | `src/agent/` | Step-based agentic orchestration with safety guards |
| **Safety Guards** | `src/safety/` | PHI pattern detection, mock data fixtures, content classification |
| **Frontend** | `frontend/` | Vanilla HTML/CSS/JS — dashboard, records, AI ask page |
| **Deploy Scripts** | `scripts/` | One-command setup and deploy |

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- A Cloudflare account (free tier works)

### Local Development

```bash
# 1. Clone and setup
git clone <your-repo-url>
cd healthcare-hackathon
./scripts/setup.sh

# 2. Add your API keys
# Edit .dev.vars with your OPENAI_API_KEY

# 3. Run locally
npm run dev

# 4. Open http://localhost:8787
```

### Deploy to Cloudflare

```bash
# 1. Authenticate
wrangler login

# 2. Create cloud resources
wrangler d1 create hackathon-db
wrangler kv namespace create CACHE
wrangler r2 bucket create hackathon-assets

# 3. Update wrangler.toml with the IDs from step 2

# 4. Set secrets
wrangler secret put OPENAI_API_KEY
wrangler secret put AUTH_SECRET

# 5. Deploy
./scripts/deploy.sh
```

---

## Architecture

```
                     ┌─────────────┐
                     │  Frontend   │
                     │  (static)   │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │   Worker    │
                     │  (Router)   │
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────▼──────┐ ┌───▼───┐  ┌──────▼──────┐
       │    Auth     │ │  API  │  │  Retrieval  │
       │ Middleware  │ │Routes │  │Orchestrator │
       └──────┬──────┘ └───┬───┘  └──────┬──────┘
              │            │              │
         ┌────▼────┐  ┌───▼───┐   ┌──────┼──────┐
         │   KV    │  │  D1   │   │      │      │
         │(tokens) │  │(data) │   │D1    │R2    │
         └─────────┘  └───────┘   │(FTS) │(docs)│
                                  └──────┴──────┘
              ┌─────────────┐
              │   Agent     │
              │  Pipeline   │──→ Safety Guard
              │  (optional) │──→ AI Client (GPT)
              └─────────────┘
```

---

## When to Use D1 vs KV vs R2 vs Worker Memory

| Storage | Best For | Characteristics |
|---------|----------|-----------------|
| **D1** (SQLite) | Structured records, user data, anything you'd query with SQL | Relational, supports JOINs, FTS5 full-text search, migrations |
| **KV** | Sessions, tokens, feature flags, cached lookups | Sub-ms reads at edge, eventual consistency, TTL support |
| **R2** | Files, documents, images, PDFs, large blobs | S3-compatible, no egress fees, streaming support |
| **Worker Memory** | Per-request computation, temporary state | Gone after request ends, ~128MB limit, fastest access |

**Rules of thumb:**
- If you'd use a database table → **D1**
- If you'd use Redis → **KV**
- If you'd use S3 → **R2**
- If it's a local variable → **Worker memory**

---

## How Retrieval Works

The retrieval layer is an **orchestrator pattern** — a router that decides which data source to query.

```typescript
// Query the orchestrator — it handles source selection
const orchestrator = createOrchestrator(env.DB, env.R2);
const results = await orchestrator.query({
  text: "diabetes management",
  sources: ["d1"],        // optional: limit to specific sources
  limit: 10,
});
```

**Current retrievers:**
1. **StructuredRetriever** — queries D1 via FTS5 full-text search
2. **DocumentRetriever** — searches R2 objects by key prefix/keyword

**Adding a new retriever (e.g., vector search):**
1. Implement the `Retriever` interface in `src/retrieval/`
2. Call `orchestrator.register(new YourRetriever(...))`
3. Queries automatically route to it

This design means you can start with keyword search today and add vector search later without changing any calling code.

---

## How Auth Works

**Demo Mode (default):** Set `DEMO_MODE=true` in env vars. All auth is bypassed — every request gets a demo user. Perfect for hackathon presentations.

**Token Mode:** Set `DEMO_MODE=false`. Requests need `Authorization: Bearer <token>` header. Tokens are created via `/api/auth/login` or `/api/auth/register` and stored in KV with a 24-hour TTL.

---

## How the Agent Pipeline Works

The agent pipeline is a simple step-based executor for multi-step AI workflows.

```typescript
import { AgentPipeline } from "./agent/pipeline";
import { createRetrieveStep, createAIResponseStep, formatOutputStep } from "./agent/steps";

const pipeline = new AgentPipeline();
pipeline.addStep(createRetrieveStep(env));    // 1. Search for context
pipeline.addStep(createAIResponseStep(env));  // 2. Generate AI response
pipeline.addStep(formatOutputStep);           // 3. Format output

const result = await pipeline.execute("What are common conditions?");
// result.success, result.output, result.log
```

**Safety guards run automatically** before and after each step:
- Checks for PHI patterns in pipeline data
- Enforces max step count (10)
- Enforces data size limit (1MB)
- Halts pipeline if anything suspicious is detected

---

## Healthcare Safety

This boilerplate is **healthcare-safe by default**:

1. **No real patient data anywhere** — all seed data and fixtures are synthetic, clearly marked with "MOCK", "SYNTHETIC", or "SYN-" prefixes
2. **PHI pattern detection** — `src/safety/guardrails.ts` scans for SSNs, phone numbers, MRNs, DOBs, and other PHI patterns
3. **AI prompts include safety preambles** — every prompt template reminds the model it's working with mock data
4. **Agent pipeline safety guards** — automatically halt if PHI-like patterns appear during processing
5. **Visual safety indicators** — the frontend shows "DEMO MODE" and "MOCK DATA ONLY" badges

**What this does NOT do:**
- This is not a HIPAA-compliant system
- This is not a certified PHI detection service
- This does not replace BAAs, encryption at rest, or audit logging required for production healthcare software

**For production healthcare apps**, you'd need:
- HIPAA-compliant hosting (Cloudflare can support this with the right plan)
- Encryption at rest for all PHI
- Audit logging for all data access
- BAA with your cloud provider
- Validated PHI detection (AWS Comprehend Medical, Azure Text Analytics)
- Access controls beyond what this scaffold provides

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Health check, DB status, env info |
| `POST` | `/api/auth/login` | No | Login with email/password, returns token |
| `POST` | `/api/auth/register` | No | Register new user, returns token |
| `GET` | `/api/records` | Yes* | List all records (paginated) |
| `GET` | `/api/records/:id` | Yes* | Get single record |
| `POST` | `/api/records` | Yes* | Create new record |
| `POST` | `/api/upload` | Yes* | Upload file to R2 |
| `GET` | `/api/uploads` | Yes* | List uploaded files |

*Auth is bypassed in demo mode (`DEMO_MODE=true`)

**Response shape (every endpoint):**
```json
{
  "ok": true,
  "data": { ... },
  "error": null,
  "meta": { "limit": 50, "offset": 0 }
}
```

---

## Adapting for a New Project

### 1. Rename and rebrand
- Update `name` in `package.json`
- Update `APP_NAME` in `wrangler.toml`
- Update the frontend title in `frontend/index.html`

### 2. Define your domain model
- Edit `src/db/schema.sql` — replace the `records` table with your entities
- Edit `src/db/seed.sql` — add your mock data
- Update `src/db/queries.ts` with typed queries for your tables

### 3. Add your API endpoints
- Create new handler files in `src/api/`
- Register routes in `src/index.ts`
- Reuse the response helpers from `src/lib/response.ts`

### 4. Customize the frontend
- The frontend is vanilla HTML/CSS/JS — edit directly, no build step
- Replace pages in `frontend/index.html`
- Update API calls in `frontend/api.js`

### 5. Wire up AI features
- Add your OpenAI key to `.dev.vars`
- Use `src/ai/client.ts` for API calls
- Create custom prompts in `src/ai/prompts.ts`
- Build pipelines with `src/agent/pipeline.ts`

### 6. Deploy
- Create Cloudflare resources (D1, KV, R2)
- Update `wrangler.toml` with IDs
- Run `./scripts/deploy.sh`

---

## Folder Structure

```
├── README.md
├── package.json
├── tsconfig.json
├── wrangler.toml
├── .dev.vars.example
├── .gitignore
├── src/
│   ├── index.ts               # Entry point + route registration
│   ├── types.ts               # Shared TypeScript types
│   ├── api/
│   │   ├── router.ts          # URL pattern router
│   │   ├── health.ts          # GET /api/health
│   │   ├── records.ts         # CRUD /api/records
│   │   └── upload.ts          # POST /api/upload
│   ├── auth/
│   │   ├── middleware.ts       # Auth check + demo bypass
│   │   ├── tokens.ts          # Token create/verify via KV
│   │   └── handlers.ts        # Login/register endpoints
│   ├── db/
│   │   ├── schema.sql          # D1 tables + FTS index
│   │   ├── seed.sql            # Mock data
│   │   └── queries.ts          # Typed query helpers
│   ├── storage/
│   │   ├── kv.ts              # KV helpers
│   │   ├── r2.ts              # R2 helpers
│   │   └── index.ts           # Unified exports
│   ├── retrieval/
│   │   ├── orchestrator.ts     # Query router
│   │   ├── structured.ts       # D1 full-text search
│   │   ├── document.ts         # R2 document search
│   │   └── types.ts            # Retrieval interfaces
│   ├── agent/
│   │   ├── pipeline.ts         # Step-based executor
│   │   ├── safety.ts           # Pre/post step safety checks
│   │   ├── steps.ts            # Example pipeline steps
│   │   └── types.ts            # Agent interfaces
│   ├── ai/
│   │   ├── client.ts           # OpenAI API wrapper
│   │   └── prompts.ts          # Prompt templates
│   ├── lib/
│   │   ├── errors.ts           # Error classes
│   │   ├── logger.ts           # Structured logger
│   │   ├── response.ts         # API response builder
│   │   └── validate.ts         # Input validation
│   └── safety/
│       ├── guardrails.ts       # PHI detection + classification
│       └── mock-data.ts        # Synthetic data fixtures
├── frontend/
│   ├── index.html              # SPA shell
│   ├── styles.css              # Dark theme CSS
│   ├── app.js                  # Frontend logic
│   └── api.js                  # API client
└── scripts/
    ├── setup.sh                # Local setup
    └── deploy.sh               # Deploy to Cloudflare
```

---

## How to Think About Using This Boilerplate (For Non-Traditional Builders)

You're not a traditional software engineer, and that's a strength. This boilerplate is designed so you can move fast without getting stuck. Here's the mental model:

### The Building Blocks

Think of this boilerplate as a **set of Lego kits**, not a monolith:

1. **The API layer** (`src/api/`) is your **front door**. Every feature you build starts by adding a route here. Look at `records.ts` — that's the pattern. Copy it, rename it, change what it does.

2. **The database** (`src/db/`) is your **filing cabinet**. If you need to store structured information (users, records, orders, anything), put it here. Edit `schema.sql` to define new tables, then write queries in `queries.ts`.

3. **The storage layers** (`src/storage/`) are your **specialized containers**. KV is a fast key-value lockbox (great for sessions, settings). R2 is a file cabinet (great for documents, images). You don't need to choose one — use both.

4. **The retrieval layer** (`src/retrieval/`) is your **search engine**. When your app needs to find relevant information, the orchestrator decides where to look. You don't need to understand how — just call `orchestrator.query()`.

5. **The agent pipeline** (`src/agent/`) is your **assembly line**. For multi-step AI workflows (search → analyze → respond), create steps and chain them together. The safety guard watches every step.

6. **The frontend** (`frontend/`) is your **storefront**. It's intentionally simple — vanilla HTML, CSS, JS. No React, no Vue, no build step. Edit the HTML directly.

### The Workflow

For any new feature, the pattern is always:
1. **Data**: Do I need to store something? → Edit `schema.sql` and `queries.ts`
2. **Logic**: What does the feature do? → Write a handler in `src/api/`
3. **Route**: How do users access it? → Register in `src/index.ts`
4. **UI**: How does it look? → Edit the frontend HTML and JS

### When You're in a Hackathon

- **First 30 minutes**: Run `setup.sh`, verify health endpoint works, customize the schema
- **Hours 1-4**: Build features using the pattern above
- **Hour 5**: Polish the frontend, add demo data
- **Hour 6**: Deploy with `deploy.sh`, prep your demo

### The Safety Net

If you're building for healthcare or any sensitive domain:
- Keep `DEMO_MODE=true` for presentations
- Always prefix data with "MOCK" or "SYNTHETIC"
- Never put real patient data anywhere in this system
- The safety guardrails will catch obvious mistakes, but they're a safety net, not a guarantee

---

## License

MIT — use it for whatever you want.
