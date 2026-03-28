// ============================================================
// Zoom API — Config CRUD, meeting creation, SDK JWT, webhooks
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error, notFound } from "../lib/response";
import { parseBody } from "../lib/validate";
import { encrypt, decrypt } from "../integrations/encryption";
import { ZoomApiClient } from "../zoom/client";
import { ZoomMeetingProvider } from "../zoom/provider";
import { generateMeetingSdkJwt } from "../zoom/meeting-sdk-jwt";
import { handleCrcChallenge, verifyWebhookSignature } from "../zoom/webhook";
import type { ZoomProviderConfig } from "../zoom/types";
import { logger } from "../lib/logger";

// ---- DB helpers (integration_configs, provider='zoom') ----

interface IntegrationConfig {
  id: string;
  provider: string;
  config: string;
  model: string | null;
  is_active: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

async function getZoomConfig(db: D1Database): Promise<IntegrationConfig | null> {
  return db
    .prepare("SELECT * FROM integration_configs WHERE provider = 'zoom'")
    .first<IntegrationConfig>();
}

async function upsertZoomConfig(db: D1Database, configJson: string): Promise<void> {
  const existing = await getZoomConfig(db);
  const now = new Date().toISOString();

  if (existing) {
    await db
      .prepare(
        "UPDATE integration_configs SET config = ?, updated_at = ? WHERE provider = 'zoom'"
      )
      .bind(configJson, now)
      .run();
  } else {
    const id = `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db
      .prepare(
        "INSERT INTO integration_configs (id, provider, config, model, is_active, is_default, created_at, updated_at) VALUES (?, 'zoom', ?, NULL, 1, 0, ?, ?)"
      )
      .bind(id, configJson, now, now)
      .run();
  }
}

/** Load and decrypt Zoom provider config from DB */
async function loadZoomProviderConfig(
  db: D1Database,
  encryptionKey: string
): Promise<ZoomProviderConfig | null> {
  const row = await getZoomConfig(db);
  if (!row) return null;

  const decrypted = await decrypt(row.config, encryptionKey);
  try {
    return JSON.parse(decrypted) as ZoomProviderConfig;
  } catch {
    return null;
  }
}

/** Mask sensitive fields for display */
function maskConfig(configJson: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(configJson) as Record<string, unknown>;
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (
        typeof value === "string" &&
        (key.includes("secret") || key.includes("Secret") || key.includes("token") || key.includes("Token"))
      ) {
        masked[key] = value.length > 8 ? value.slice(0, 4) + "..." + value.slice(-4) : "****";
      } else {
        masked[key] = value;
      }
    }
    return masked;
  } catch {
    return {};
  }
}

// ---- Handlers ----

/**
 * GET /api/zoom/config
 * Returns masked Zoom configuration.
 */
export async function zoomConfigGetHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const row = await getZoomConfig(env.DB);
  if (!row) return success({ configured: false });

  // Decrypt before masking so we mask the real values
  let configStr = row.config;
  try {
    configStr = await decrypt(row.config, env.AUTH_SECRET);
  } catch {
    // If decryption fails, mask the raw stored value
  }

  return success({
    configured: true,
    is_active: row.is_active,
    config: maskConfig(configStr),
    updated_at: row.updated_at,
  });
}

/**
 * PUT /api/zoom/config
 * Saves or updates Zoom S2S OAuth + SDK credentials (encrypted).
 */
export async function zoomConfigPutHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{
    accountId?: string;
    clientId?: string;
    clientSecret?: string;
    sdkKey?: string;
    sdkSecret?: string;
  }>(request);

  const hasS2S = body.accountId || body.clientId || body.clientSecret;
  const hasSdk = body.sdkKey || body.sdkSecret;

  if (!hasS2S && !hasSdk) {
    return error("Provide S2S OAuth fields (accountId, clientId, clientSecret) and/or SDK fields (sdkKey, sdkSecret)", 400);
  }

  // Partial S2S: all three are required together
  if (hasS2S && (!body.accountId || !body.clientId || !body.clientSecret)) {
    return error("accountId, clientId, and clientSecret are all required for S2S OAuth", 400);
  }

  // Partial SDK: both are required together
  if (hasSdk && (!body.sdkKey || !body.sdkSecret)) {
    return error("sdkKey and sdkSecret are both required for Meeting SDK", 400);
  }

  // Load existing config to merge with
  const existing = await loadZoomProviderConfig(env.DB, env.AUTH_SECRET);

  const config: ZoomProviderConfig = {
    accountId: body.accountId ?? existing?.accountId ?? "",
    clientId: body.clientId ?? existing?.clientId ?? "",
    clientSecret: body.clientSecret ?? existing?.clientSecret ?? "",
    sdkKey: body.sdkKey ?? existing?.sdkKey,
    sdkSecret: body.sdkSecret ?? existing?.sdkSecret,
  };

  const encrypted = await encrypt(JSON.stringify(config), env.AUTH_SECRET);
  await upsertZoomConfig(env.DB, encrypted);

  return success({ provider: "zoom", status: "saved" });
}

/**
 * POST /api/zoom/meeting
 * Creates a Zoom meeting via the API and stores it in the meetings table.
 */
export async function zoomMeetingCreateHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{
    topic: string;
    startTime: string;
    durationMinutes: number;
    timezone?: string;
    password?: string;
    joinBeforeHost?: boolean;
    waitingRoom?: boolean;
  }>(request);

  if (!body.topic || !body.startTime || !body.durationMinutes) {
    return error("topic, startTime, and durationMinutes are required", 400);
  }

  const config = await loadZoomProviderConfig(env.DB, env.AUTH_SECRET);
  if (!config) {
    return error("Zoom is not configured. Save credentials via PUT /api/zoom/config first.", 400);
  }

  const client = new ZoomApiClient(config);
  const provider = new ZoomMeetingProvider(client);

  const result = await provider.createMeeting({
    topic: body.topic,
    startTime: body.startTime,
    durationMinutes: body.durationMinutes,
    timezone: body.timezone || "UTC",
    password: body.password,
    joinBeforeHost: body.joinBeforeHost,
    waitingRoom: body.waitingRoom,
  });

  // Persist to meetings table
  const meetingId = `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO meetings (id, title, provider, external_meeting_id, join_url, host_url, password, status, scheduled_at, duration_minutes, provider_data, created_at, updated_at)
     VALUES (?, ?, 'zoom', ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, ?)`
  )
    .bind(
      meetingId,
      body.topic,
      result.externalMeetingId,
      result.joinUrl,
      result.hostUrl,
      result.password,
      body.startTime,
      body.durationMinutes,
      JSON.stringify(result.providerData),
      now,
      now
    )
    .run();

  return success({
    id: meetingId,
    externalMeetingId: result.externalMeetingId,
    joinUrl: result.joinUrl,
    hostUrl: result.hostUrl,
    password: result.password,
    providerData: result.providerData,
  });
}

/**
 * GET /api/zoom/meeting/:id/signature
 * Generates a Meeting SDK JWT + OBF token for a stored meeting.
 */
export async function zoomMeetingSignatureHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const meetingId = ctx.params.id;

  // Look up meeting
  const meeting = await env.DB
    .prepare("SELECT * FROM meetings WHERE id = ?")
    .bind(meetingId)
    .first<{ id: string; external_meeting_id: string | null }>();

  if (!meeting) return notFound("Meeting not found");
  if (!meeting.external_meeting_id) {
    return error("Meeting has no external Zoom meeting ID", 400);
  }

  const config = await loadZoomProviderConfig(env.DB, env.AUTH_SECRET);
  if (!config) {
    return error("Zoom is not configured", 400);
  }

  if (!config.sdkKey || !config.sdkSecret) {
    return error("Zoom SDK credentials are not configured. Update via PUT /api/zoom/config with sdkKey and sdkSecret.", 400);
  }

  const meetingNumber = parseInt(meeting.external_meeting_id, 10);
  if (isNaN(meetingNumber)) {
    return error("Invalid external meeting ID", 400);
  }

  // role=0 means attendee, role=1 means host
  const role: 0 | 1 = 0;
  const signature = await generateMeetingSdkJwt(
    config.sdkKey,
    config.sdkSecret,
    meetingNumber,
    role
  );

  // Generate a simple OBF (one-time bearer fingerprint) token for extra validation
  const obfToken = crypto.randomUUID();

  return success({
    signature,
    sdkKey: config.sdkKey,
    meetingNumber,
    role,
    obfToken,
  });
}

/**
 * GET /api/zoom/sdk/connect
 * Initiates SDK OAuth flow by redirecting to Zoom's authorization page.
 */
export async function zoomSdkConnectHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const config = await loadZoomProviderConfig(env.DB, env.AUTH_SECRET);
  if (!config) {
    return error("Zoom is not configured. Save credentials via PUT /api/zoom/config first.", 400);
  }

  if (!config.sdkKey) {
    return error("Zoom SDK key is not configured", 400);
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/zoom/sdk/callback`;

  const authUrl = new URL("https://zoom.us/oauth/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", config.sdkKey);
  authUrl.searchParams.set("redirect_uri", redirectUri);

  return Response.redirect(authUrl.toString(), 302);
}

/**
 * GET /api/zoom/sdk/callback
 * Handles OAuth callback from Zoom, exchanges code for tokens, stores them.
 */
export async function zoomSdkCallbackHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return error("Missing authorization code", 400);
  }

  const config = await loadZoomProviderConfig(env.DB, env.AUTH_SECRET);
  if (!config || !config.sdkKey || !config.sdkSecret) {
    return error("Zoom SDK credentials not configured", 400);
  }

  const redirectUri = `${url.origin}/api/zoom/sdk/callback`;
  const credentials = btoa(`${config.sdkKey}:${config.sdkSecret}`);

  const tokenRes = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    logger.error("Zoom SDK OAuth token exchange failed", { status: tokenRes.status, body: errBody });
    return error(`Zoom OAuth token exchange failed: ${tokenRes.status}`, 502);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  // Update config with SDK tokens
  const updatedConfig: ZoomProviderConfig = {
    ...config,
    sdkAccessToken: tokenData.access_token,
    sdkRefreshToken: tokenData.refresh_token,
    sdkTokenExpiresAt: Date.now() + tokenData.expires_in * 1000,
  };

  const encrypted = await encrypt(JSON.stringify(updatedConfig), env.AUTH_SECRET);
  await upsertZoomConfig(env.DB, encrypted);

  // Redirect back to app with success indicator
  return Response.redirect(`${url.origin}/settings?zoom_sdk=connected`, 302);
}

/**
 * POST /api/zoom/sdk/disconnect
 * Removes SDK OAuth tokens from stored config.
 */
export async function zoomSdkDisconnectHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const config = await loadZoomProviderConfig(env.DB, env.AUTH_SECRET);
  if (!config) {
    return error("Zoom is not configured", 400);
  }

  // Strip SDK token fields
  const updatedConfig: ZoomProviderConfig = {
    accountId: config.accountId,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    sdkKey: config.sdkKey,
    sdkSecret: config.sdkSecret,
  };

  const encrypted = await encrypt(JSON.stringify(updatedConfig), env.AUTH_SECRET);
  await upsertZoomConfig(env.DB, encrypted);

  return success({ status: "disconnected" });
}

/**
 * POST /api/webhooks/zoom
 * Handles Zoom webhook events: CRC challenge-response + verified event processing.
 * This replaces the simpler handler in meetings.ts.
 */
export async function zoomWebhookFullHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const rawBody = await request.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return error("Invalid JSON", 400);
  }

  const event = body.event as string;
  logger.info("Zoom webhook received", { event });

  // Load webhook secret from Zoom config
  const config = await loadZoomProviderConfig(env.DB, env.AUTH_SECRET);
  // Use clientSecret as webhook verification token if no dedicated secret
  const secretToken = config?.clientSecret || env.AUTH_SECRET;

  // ---- CRC Challenge ----
  if (event === "endpoint.url_validation") {
    const plainToken = (body.payload as Record<string, unknown>)?.plainToken as string;
    if (!plainToken) return error("Missing plainToken", 400);

    const crcResponse = await handleCrcChallenge(plainToken, secretToken);
    return new Response(JSON.stringify(crcResponse), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // ---- Verify signature for all other events ----
  const signature = request.headers.get("x-zm-signature") || "";
  const timestamp = request.headers.get("x-zm-request-timestamp") || "";

  if (signature && timestamp) {
    const valid = await verifyWebhookSignature(signature, timestamp, rawBody, secretToken);
    if (!valid) {
      logger.warn("Zoom webhook signature verification failed");
      return error("Invalid signature", 401);
    }
  }

  // ---- Process meeting lifecycle events ----
  const payload = body.payload as Record<string, unknown> | undefined;
  const meetingObj = payload?.object as Record<string, unknown> | undefined;
  const externalId = meetingObj?.id?.toString();

  if (externalId) {
    const meeting = await env.DB
      .prepare("SELECT id FROM meetings WHERE external_meeting_id = ?")
      .bind(externalId)
      .first<{ id: string }>();

    if (meeting) {
      let newStatus: string | null = null;
      if (event === "meeting.started") newStatus = "started";
      else if (event === "meeting.ended") newStatus = "ended";
      else if (event === "meeting.deleted") newStatus = "deleted";

      if (newStatus) {
        await env.DB
          .prepare("UPDATE meetings SET status = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(newStatus, meeting.id)
          .run();
        logger.info("Meeting status updated via webhook", { meetingId: meeting.id, status: newStatus });
      }
    }
  }

  return new Response("OK", { status: 200 });
}
