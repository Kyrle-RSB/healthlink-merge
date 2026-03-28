# Domain Schema Templates

Pre-built database schemas with realistic mock data for common hackathon domains.

## How to Use

1. Pick your domain
2. Copy the schema + seed files into `src/db/`:
   ```bash
   cp templates/healthcare-schema.sql src/db/schema.sql
   cp templates/healthcare-seed.sql src/db/seed.sql
   ```
3. Re-run migrations:
   ```bash
   npm run db:migrate && npm run db:seed
   ```
4. Update `src/db/queries.ts` with typed queries for your new tables

## Available Templates

### Healthcare (`healthcare-schema.sql`)
Tables: providers, patients, sessions, insights, action_items
Best for: patient portals, clinical tools, health tracking, medical AI

### Education (`education-schema.sql`)
Tables: instructors, students, courses, enrollments, assignments, submissions, tutoring_sessions
Best for: LMS platforms, AI tutoring, grade tracking, adaptive learning

### Finance (`finance-schema.sql`)
Tables: clients, advisors, accounts, transactions, budgets, financial_insights
Best for: personal finance, budgeting apps, investment tools, financial AI

## For Supabase Users

The schemas use SQLite syntax (D1). For Supabase (Postgres):
- Replace `datetime('now')` with `NOW()`
- Replace `INTEGER` booleans with `BOOLEAN`
- Replace `REAL` with `NUMERIC` or `DECIMAL`
- Or use the `supabase-schema.sql` in `src/db/` as a reference for Postgres syntax

All seed data is marked MOCK/SYNTHETIC — safe for demos.
