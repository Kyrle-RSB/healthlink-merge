# CLAUDE.md — Instructions for Claude Code

## Project Overview

Reusable Cloudflare Workers hackathon boilerplate. Healthcare-safe by default — all data is mock/synthetic. Built for XperienC AI.

## Branch Workflow — MANDATORY

**Follow this workflow for ALL work. No exceptions unless the user explicitly overrides.**

### Before starting ANY implementation work:

1. **Check current branch state:**
   ```
   git status && git branch
   ```

2. **Create a branch** from `main`:
   ```
   git checkout main && git pull
   git checkout -b <type>/<short-description>
   ```

3. **Branch type prefixes:**
   - `feat/` — new functionality (endpoint, page, retriever, pipeline step)
   - `fix/` — bug fixes
   - `docs/` — documentation only
   - `chore/` — dependencies, config, scripts
   - `refactor/` — restructuring without behavior change
   - `hotfix/` — urgent production fix (branch from `main`, PR to `main`)

4. **Immediately tell the user:**
   - The exact branch name you created
   - Why that branch type was chosen
   - Which files you expect to touch
   - Whether this work is safe to run in parallel (check the Parallel Development Safety section)

5. **Never work directly on `main`** for normal work.

6. **If the work seems too small for a branch**, recommend the branch workflow anyway. Only skip if the user explicitly says to.

### Pre-commit checks — run before every commit:
```bash
npm run typecheck
```
If typecheck fails, fix the errors before committing. Do not commit broken types.

### Merge strategy: Squash merge (default)
All PRs should be squash merged unless the user requests otherwise.

### After merge:
- Delete the remote branch
- Delete the local branch
- Return to `main` and pull

## Deployment — CRITICAL

**Production URL:** https://healthlink.madeonmerit.com
**Worker name:** `healthlink` (configured in `wrangler.toml`)
**Fallback URL:** https://healthlink.kyrle-symons.workers.dev

**This project deploys via `wrangler deploy` (Cloudflare Workers), NOT `wrangler pages deploy`.**

Using `wrangler pages deploy` will break the application. The Worker serves both the API and static frontend.

**Cloudflare resources (already provisioned):**
- **D1 Database:** `healthlink-db` (ID: `1b7d371c-4687-46b9-b6a4-9e2f5df8aec3`)
- **KV Namespace:** `healthlink-CACHE` (ID: `01c71cb59477439c9a055aeb54a5c93b`)
- **R2 Bucket:** `healthlink-assets`
- **Custom Domain:** `healthlink.madeonmerit.com` (routed to the `healthlink` worker)

**Do NOT:**
- Run `wrangler pages deploy` or `wrangler pages publish` — ever
- Deploy without running `npm run typecheck` first
- Change the worker name from `healthlink` — the custom domain route depends on it
- Put secrets (API keys) in `wrangler.toml` — use `wrangler secret put` or `.dev.vars`

## Tech Stack

- **Runtime:** Cloudflare Workers (TypeScript, ES2022, strict mode)
- **Database:** D1 (SQLite) with FTS5 full-text search
- **Cache/Sessions:** KV Namespace (tokens, feature flags)
- **File Storage:** R2 Bucket (documents, uploads)
- **AI:** OpenAI GPT via raw fetch (no SDK)
- **Frontend:** Vanilla HTML/CSS/JS — no framework, no build step
- **Router:** Custom pattern-matching router — no Hono, no itty-router
- **Deploy:** Wrangler CLI

## Commands

```bash
npm run dev              # Start local dev server (http://localhost:8787)
npm run deploy           # Deploy to Cloudflare
npm run typecheck        # TypeScript type check (tsc --noEmit)
npm run db:migrate       # Run D1 schema locally
npm run db:seed          # Seed mock data locally
npm run db:migrate:remote # Run D1 schema on production
npm run db:seed:remote   # Seed mock data on production
npm run tail             # Watch live production logs
./scripts/setup.sh       # One-command local setup (install + migrate + seed)
./scripts/deploy.sh      # One-command production deploy
```

## Architecture Rules

### Response Shape (every endpoint)
```typescript
{ ok: boolean, data: T | null, error: string | null, meta?: Record<string, unknown> }
```
Use helpers from `src/lib/response.ts`: `success()`, `created()`, `error()`, `notFound()`.

### Error Handling
- Custom errors extend `AppError` in `src/lib/errors.ts` (NotFoundError, ValidationError, UnauthorizedError, ForbiddenError)
- The router in `src/api/router.ts` catches AppError and returns the correct HTTP status
- Unhandled errors → 500 with generic message
- Never expose stack traces in production

### ID Generation
- Records: `rec_{timestamp}_{random6}`
- Users: `usr_{timestamp}_{random6}`
- Synthetic/mock: `SYN-{number}`, `VISIT-{number}`

### Adding a New API Endpoint
1. Create handler in `src/api/yourhandler.ts` with signature `(request: Request, env: Env, ctx: AuthedRequest) => Promise<Response>`
2. Import and register in `src/index.ts`: `route("GET", "/api/your-path", yourHandler, true)` (last arg = requiresAuth)
3. Use `parseBody()` for POST bodies, `ctx.params` for URL params, `ctx.query` for query strings
4. Return via `success(data)`, `created(data)`, or `error(message, status)`

### Adding a New DB Table
1. Add CREATE TABLE to `src/db/schema.sql`
2. Add seed data to `src/db/seed.sql` (mark all data as MOCK/SYNTHETIC)
3. Add typed query functions to `src/db/queries.ts`
4. Run `npm run db:migrate && npm run db:seed`

### Adding a New Retriever
1. Create file in `src/retrieval/` implementing the `Retriever` interface from `src/retrieval/types.ts`
2. Register in `createOrchestrator()` in `src/retrieval/orchestrator.ts`
3. The orchestrator routes queries automatically — no calling code changes needed

### Adding a New Agent Step
1. Create a function returning `AgentStep` in `src/agent/steps.ts`
2. Add to pipeline: `pipeline.addStep(yourStep)`
3. Read from `ctx.data`, write to `ctx.data` — the safety guard checks between every step

## Storage Decision Guide

| Need | Use | Binding |
|------|-----|---------|
| Structured records, SQL queries, joins, search | **D1** | `env.DB` |
| Fast lookups, sessions, tokens, feature flags | **KV** | `env.KV` |
| Files, documents, images, large blobs | **R2** | `env.R2` |
| Temporary per-request computation | **Worker memory** | local variables |

## Auth

- `DEMO_MODE=true` (default): All auth bypassed, returns demo admin user. Use for hackathon demos.
- `DEMO_MODE=false`: Requires `Authorization: Bearer {token}` header. Tokens created via `/api/auth/login` or `/api/auth/register`, stored in KV with 24h TTL.
- Auth check happens in `src/auth/middleware.ts` — called automatically by the router for routes registered with `requiresAuth: true`.

## Healthcare Safety Rules

- **ALL data must be mock/synthetic.** Prefix with "MOCK DATA:", "SYNTHETIC", or "SYN-".
- **Never store, process, or generate content that could be mistaken for real PHI.**
- **PHI pattern detection** runs in `src/safety/guardrails.ts` — scans for SSNs, phone numbers, MRNs, DOBs, real email addresses, IPs.
- **Agent pipeline safety guards** (`src/agent/safety.ts`) automatically halt if PHI patterns appear in pipeline data.
- **All AI prompts** include a `SAFETY_PREAMBLE` reminding the model it works with mock data only.
- This is NOT HIPAA-compliant. It is a hackathon scaffold with safety guardrails, not a production healthcare system.

## Key Files to Know

| File | Role |
|------|------|
| `src/index.ts` | Worker entry point, route registration, static file serving |
| `src/types.ts` | All shared TypeScript types (Env, ApiResponse, AuthUser, Route) |
| `src/api/router.ts` | Custom URL pattern router, global error handling |
| `src/auth/middleware.ts` | Auth check with demo mode bypass |
| `src/db/schema.sql` | D1 database schema (users, records, FTS5 index) |
| `src/db/queries.ts` | All typed D1 query helpers |
| `src/retrieval/orchestrator.ts` | Routes retrieval queries to D1/R2/future sources |
| `src/agent/pipeline.ts` | Step-based agentic executor with safety guards |
| `src/lib/response.ts` | API response builders (success, error, created, notFound) |
| `src/safety/guardrails.ts` | PHI detection, content classification |
| `frontend/index.html` | Entire frontend SPA (dashboard, records, AI ask, parallel guide) |

## Conventions

- TypeScript strict mode — no `any` unless absolutely necessary
- All timestamps are ISO 8601 UTC strings
- Logger outputs structured JSON (use `logger.info()`, `logger.error()`, etc.)
- Validation uses `requireFields()` and `validateEmail()` from `src/lib/validate.ts`
- Frontend uses `escapeHtml()` for all user-generated content — never insert raw strings into innerHTML
- CORS headers are applied to all API responses via `src/lib/response.ts`

## Parallel Development Safety

**Safe to work on independently (separate branches, no conflicts):**
- `frontend/*` — UI changes
- `src/ai/prompts.ts` — prompt templates
- `src/safety/mock-data.ts` + `src/db/seed.sql` — test data
- `scripts/*` + `wrangler.toml` — infrastructure
- `src/safety/guardrails.ts` — PHI patterns

**Coordinate carefully (shared registration points):**
- New API endpoints → both touch `src/index.ts` for route registration
- New DB tables → both touch `src/db/queries.ts`
- New retrievers → both touch `src/retrieval/orchestrator.ts`

**Serialize (do not edit in parallel):**
- `src/types.ts` — imported everywhere
- `src/api/router.ts` — routing engine
- `src/auth/middleware.ts` + `src/auth/tokens.ts` — auth logic
- `src/lib/errors.ts` + `src/lib/response.ts` — response shape
