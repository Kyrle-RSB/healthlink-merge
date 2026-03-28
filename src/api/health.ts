// ============================================================
// Health endpoint — GET /api/health
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success } from "../lib/response";

export async function healthHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  // Quick D1 connectivity check
  let dbOk = false;
  try {
    await env.DB.prepare("SELECT 1").first();
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return success({
    status: "ok",
    app: env.APP_NAME,
    environment: env.ENVIRONMENT,
    demoMode: env.DEMO_MODE === "true",
    db: dbOk ? "connected" : "unavailable",
    timestamp: new Date().toISOString(),
  });
}
