// ============================================================
// Records CRUD — example domain endpoints
// ============================================================
// In a healthcare hackathon, "records" might be patient visit
// summaries, care plans, etc. All mock data — no real PHI.
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, created, notFound } from "../lib/response";
import { parseBody, requireFields } from "../lib/validate";
import { queryAll, queryOne, insertRecord } from "../db/queries";

/** GET /api/records — list all records */
export async function listRecords(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const limit = parseInt(ctx.query.limit || "50", 10);
  const offset = parseInt(ctx.query.offset || "0", 10);

  const records = await queryAll(env.DB, limit, offset);
  return success(records, { limit, offset });
}

/** GET /api/records/:id — get single record */
export async function getRecord(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const record = await queryOne(env.DB, ctx.params.id);
  if (!record) return notFound("Record not found");
  return success(record);
}

/** POST /api/records — create new record */
export async function createRecord(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody(request);
  const { title, category, content } = requireFields<{
    title: string;
    category: string;
    content: string;
  }>(body, ["title", "category", "content"]);

  const record = await insertRecord(env.DB, { title, category, content });
  return created(record);
}
