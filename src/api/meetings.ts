// ============================================================
// Meetings API — CRUD + Zoom JWT signatures
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error, notFound } from "../lib/response";
import { parseBody, parseQuery } from "../lib/validate";
import { logger } from "../lib/logger";

// ---- Meeting Queries (inline) ----

interface MeetingRow {
  id: string;
  title: string;
  provider: string;
  external_meeting_id: string | null;
  join_url: string | null;
  host_url: string | null;
  password: string | null;
  status: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  attendees: string | null;
  notes: string | null;
  provider_data: string | null;
  created_at: string;
  updated_at: string;
}

async function listMeetings(db: D1Database, limit = 20): Promise<MeetingRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM meetings ORDER BY scheduled_at DESC, created_at DESC LIMIT ?")
    .bind(limit)
    .all<MeetingRow>();
  return results;
}

async function getMeeting(db: D1Database, id: string): Promise<MeetingRow | null> {
  return db.prepare("SELECT * FROM meetings WHERE id = ?").bind(id).first<MeetingRow>();
}

async function createMeeting(
  db: D1Database,
  data: { title: string; provider?: string; scheduled_at?: string; duration_minutes?: number; attendees?: string; notes?: string }
): Promise<MeetingRow> {
  const id = `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO meetings (id, title, provider, status, scheduled_at, duration_minutes, attendees, notes, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, data.title, data.provider || "zoom",
    data.scheduled_at || null, data.duration_minutes || null,
    data.attendees || null, data.notes || null,
    now, now
  ).run();

  return { id, title: data.title, provider: data.provider || "zoom", external_meeting_id: null, join_url: null, host_url: null, password: null, status: "pending", scheduled_at: data.scheduled_at || null, duration_minutes: data.duration_minutes || null, attendees: data.attendees || null, notes: data.notes || null, provider_data: null, created_at: now, updated_at: now };
}

async function updateMeetingStatus(db: D1Database, id: string, status: string): Promise<void> {
  await db.prepare("UPDATE meetings SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(status, id).run();
}

// ---- Handlers ----

export async function meetingsListHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const query = parseQuery(request);
  const limit = parseInt(query.limit || "20", 10);
  const meetings = await listMeetings(env.DB, limit);
  return success(meetings);
}

export async function meetingDetailHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const meeting = await getMeeting(env.DB, ctx.params.id);
  if (!meeting) return notFound("Meeting not found");
  return success(meeting);
}

export async function meetingCreateHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{
    title: string;
    provider?: string;
    scheduled_at?: string;
    duration_minutes?: number;
    attendees?: { email: string; name: string }[];
    notes?: string;
  }>(request);

  if (!body.title) return error("title is required", 400);

  const meeting = await createMeeting(env.DB, {
    title: body.title,
    provider: body.provider,
    scheduled_at: body.scheduled_at,
    duration_minutes: body.duration_minutes,
    attendees: body.attendees ? JSON.stringify(body.attendees) : undefined,
    notes: body.notes,
  });

  return success(meeting, { status: 201 });
}

export async function meetingStatusHandler(
  request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{ status: string }>(request);
  if (!body.status) return error("status is required", 400);

  const meeting = await getMeeting(env.DB, ctx.params.id);
  if (!meeting) return notFound("Meeting not found");

  await updateMeetingStatus(env.DB, ctx.params.id, body.status);
  return success({ id: ctx.params.id, status: body.status });
}

// ---- Zoom Webhook Handler ----

export async function zoomWebhookHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const event = body.event as string;

  logger.info("Zoom webhook received", { event });

  if (event === "endpoint.url_validation") {
    // CRC challenge-response for endpoint verification
    const plainToken = (body.payload as Record<string, unknown>)?.plainToken as string;
    if (!plainToken) return error("Missing plainToken", 400);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.OPENAI_API_KEY || "webhook-secret"), // Use a proper secret in production
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(plainToken));
    const hashHex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");

    return new Response(JSON.stringify({ plainToken, encryptedToken: hashHex }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle meeting lifecycle events
  const payload = body.payload as Record<string, unknown> | undefined;
  const meetingObj = payload?.object as Record<string, unknown> | undefined;
  const externalId = meetingObj?.id?.toString();

  if (externalId) {
    const meeting = await env.DB.prepare(
      "SELECT id FROM meetings WHERE external_meeting_id = ?"
    ).bind(externalId).first<{ id: string }>();

    if (meeting) {
      if (event === "meeting.started") {
        await updateMeetingStatus(env.DB, meeting.id, "started");
      } else if (event === "meeting.ended") {
        await updateMeetingStatus(env.DB, meeting.id, "ended");
      }
    }
  }

  return new Response("OK", { status: 200 });
}
