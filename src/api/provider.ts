// ============================================================
// Provider API Handlers — queue management, temp auth, escalation
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error, notFound } from "../lib/response";
import { parseBody } from "../lib/validate";
import {
  querySessionById,
  updateRoutingSession,
} from "../db/queries-carepoint";
import { logger } from "../lib/logger";

// ---- Provider Queue ----

/**
 * GET /api/provider/queue
 * Returns sessions with status='intake_complete', sorted by urgency DESC then created_at ASC.
 * Joined with patient data when available.
 */
export async function providerQueueHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const { results } = await env.DB
    .prepare(
      `SELECT rs.*, p.first_name, p.last_name, p.birth_date, p.gender, p.phone, p.language
       FROM routing_sessions rs
       LEFT JOIN patients p ON rs.patient_id = p.id
       WHERE rs.status = 'intake_complete'
       ORDER BY rs.urgency_score DESC, rs.created_at ASC`
    )
    .all();
  return success(results);
}

/**
 * POST /api/provider/claim/:sessionId
 * Claim a session — sets status to 'provider_active'.
 */
export async function providerClaimHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const sessionId = ctx.params.sessionId;
  const session = await querySessionById(env.DB, sessionId);
  if (!session) return notFound("Session not found");

  if (session.status !== "intake_complete") {
    return error(`Session status is '${session.status}', expected 'intake_complete'`, 400);
  }

  await updateRoutingSession(env.DB, sessionId, { status: "provider_active" });
  return success({ session_id: sessionId, status: "provider_active" });
}

/**
 * POST /api/provider/complete/:sessionId
 * Complete a session — sets status to 'completed'.
 */
export async function providerCompleteHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const sessionId = ctx.params.sessionId;
  const session = await querySessionById(env.DB, sessionId);
  if (!session) return notFound("Session not found");

  if (session.status !== "provider_active") {
    return error(`Session status is '${session.status}', expected 'provider_active'`, 400);
  }

  await updateRoutingSession(env.DB, sessionId, {
    status: "completed",
    completed_at: new Date().toISOString(),
  });
  return success({ session_id: sessionId, status: "completed" });
}

/**
 * GET /api/provider/active
 * Returns sessions with status='provider_active'.
 */
export async function providerActiveHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const { results } = await env.DB
    .prepare(
      `SELECT rs.*, p.first_name, p.last_name, p.birth_date, p.gender, p.phone, p.language
       FROM routing_sessions rs
       LEFT JOIN patients p ON rs.patient_id = p.id
       WHERE rs.status = 'provider_active'
       ORDER BY rs.urgency_score DESC, rs.created_at ASC`
    )
    .all();
  return success(results);
}

// ---- Temporary Auth + Link Generation ----

/**
 * POST /api/provider/temp-auth
 * Generate a temporary auth token, store in KV with 24h TTL, return token + link.
 */
export async function tempAuthCreateHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{
    phone?: string;
    name?: string;
    dob?: string;
    sessionId?: string;
  }>(request);

  const token = crypto.randomUUID();
  const payload = {
    phone: body.phone || null,
    name: body.name || null,
    dob: body.dob || null,
    sessionId: body.sessionId || null,
    createdAt: new Date().toISOString(),
  };

  await env.KV.put(`temp:${token}`, JSON.stringify(payload), { expirationTtl: 86400 });

  const link = `https://healthlink-merged.madeonmerit.com/carepoint.html?token=${token}`;

  return success({ token, link, expiresIn: 86400 });
}

/**
 * GET /api/provider/temp-auth/:token
 * Validate a temporary auth token from KV. Returns session data if valid.
 */
export async function tempAuthValidateHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const token = ctx.params.token;
  const data = await env.KV.get(`temp:${token}`);

  if (!data) {
    return error("Token is invalid or expired", 401);
  }

  const payload = JSON.parse(data);
  return success(payload);
}

// ---- Session Escalation (text -> phone/video -> text) ----

/**
 * POST /api/provider/escalate/:sessionId
 * Escalate a session to phone or video.
 * If video: creates a Zoom meeting via the existing zoom infrastructure.
 */
export async function providerEscalateHandler(
  request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const sessionId = ctx.params.sessionId;
  const body = await parseBody<{ type: "phone" | "video" }>(request);

  if (!body.type || !["phone", "video"].includes(body.type)) {
    return error("type must be 'phone' or 'video'", 400);
  }

  const session = await querySessionById(env.DB, sessionId);
  if (!session) return notFound("Session not found");

  if (session.status !== "provider_active") {
    return error(`Session must be 'provider_active' to escalate, got '${session.status}'`, 400);
  }

  const escalationData: Record<string, unknown> = {
    type: body.type,
    escalatedAt: new Date().toISOString(),
  };

  if (body.type === "video") {
    // Create a Zoom meeting via internal API
    try {
      const { ZoomApiClient } = await import("../zoom/client");
      const { ZoomMeetingProvider } = await import("../zoom/provider");
      const { decrypt } = await import("../integrations/encryption");

      // Load Zoom config from DB
      const row = await env.DB
        .prepare("SELECT config FROM integration_configs WHERE provider = 'zoom' AND is_active = 1")
        .first<{ config: string }>();

      if (row) {
        const decrypted = await decrypt(row.config, env.AUTH_SECRET);
        const config = JSON.parse(decrypted);
        const client = new ZoomApiClient(config);
        const provider = new ZoomMeetingProvider(client);
        const meeting = await provider.createMeeting({
          topic: `CarePoint Session ${sessionId}`,
          startTime: new Date().toISOString(),
          durationMinutes: 30,
          timezone: "America/Vancouver",
        });
        escalationData.joinUrl = meeting.joinUrl;
        escalationData.meetingId = meeting.externalMeetingId;
      } else {
        escalationData.joinUrl = null;
        escalationData.error = "Zoom not configured";
      }
    } catch (err) {
      logger.error("Zoom escalation failed", { error: err instanceof Error ? err.message : "Unknown" });
      escalationData.joinUrl = null;
      escalationData.error = "Failed to create Zoom meeting";
    }
  }

  // Store escalation metadata in context_snapshot
  const existingSnapshot = session.context_snapshot ? JSON.parse(session.context_snapshot) : {};
  existingSnapshot.escalation = escalationData;

  await updateRoutingSession(env.DB, sessionId, {
    context_snapshot: JSON.stringify(existingSnapshot),
  });

  return success({
    session_id: sessionId,
    escalation: escalationData,
  });
}

/**
 * POST /api/provider/deescalate/:sessionId
 * De-escalate back to text mode.
 */
export async function providerDeescalateHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const sessionId = ctx.params.sessionId;
  const session = await querySessionById(env.DB, sessionId);
  if (!session) return notFound("Session not found");

  // Clear escalation metadata
  const existingSnapshot = session.context_snapshot ? JSON.parse(session.context_snapshot) : {};
  existingSnapshot.escalation = null;
  existingSnapshot.deescalatedAt = new Date().toISOString();

  await updateRoutingSession(env.DB, sessionId, {
    status: "provider_active",
    context_snapshot: JSON.stringify(existingSnapshot),
  });

  return success({
    session_id: sessionId,
    status: "provider_active",
    mode: "text",
  });
}
