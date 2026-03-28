// ============================================================
// Worker Entry Point — registers routes and handles requests
// ============================================================

import type { Env } from "./types";
import { route, handleRequest } from "./api/router";
import { healthHandler } from "./api/health";
import { listRecords, getRecord, createRecord } from "./api/records";
import { uploadFile, listUploads } from "./api/upload";
import { transcribeHandler } from "./api/transcribe";
import { readingLevelHandler } from "./api/reading-level";
import { confidenceHandler } from "./api/confidence";
import { embedHandler, vectorSearchHandler, vectorStatsHandler } from "./api/vectors";
import { loginHandler, registerHandler } from "./auth/handlers";
import {
  chatHandler,
  rerouteHandler,
  rerouteCheckHandler,
  facilitiesListHandler,
  facilityDetailHandler,
  sessionsListHandler,
  sessionDetailHandler,
  systemSnapshotHandler,
  patientsListHandler,
  patientDetailHandler,
  problemsListHandler,
  encountersListHandler,
  staffListHandler,
  analyticsHandler,
  demoSimulateHandler,
} from "./api/carepoint";
import { assistantChatHandler } from "./api/assistant";
import { suggestHandler } from "./api/suggest";
import {
  integrationsListHandler,
  integrationDetailHandler,
  integrationUpsertHandler,
  integrationDeleteHandler,
  integrationTestHandler,
} from "./api/integrations";
import {
  meetingsListHandler,
  meetingDetailHandler,
  meetingCreateHandler,
  meetingStatusHandler,
} from "./api/meetings";
import {
  zoomConfigGetHandler,
  zoomConfigPutHandler,
  zoomMeetingCreateHandler,
  zoomMeetingSignatureHandler,
  zoomSdkConnectHandler,
  zoomSdkCallbackHandler,
  zoomSdkDisconnectHandler,
  zoomWebhookFullHandler,
} from "./api/zoom";
import { healthFeaturesHandler, healthDiagnoseHandler } from "./api/health-check";
import { setLogLevel } from "./lib/logger";

// ---------- Register Routes ----------

// Public
route("GET", "/api/health", healthHandler);
route("POST", "/api/auth/login", loginHandler);
route("POST", "/api/auth/register", registerHandler);

// Protected (requiresAuth = true; auto-bypassed in DEMO_MODE)
route("GET", "/api/records", listRecords, true);
route("GET", "/api/records/:id", getRecord, true);
route("POST", "/api/records", createRecord, true);
route("POST", "/api/upload", uploadFile, true);
route("GET", "/api/uploads", listUploads, true);

// AI features
route("POST", "/api/ai/transcribe", transcribeHandler, true);
route("POST", "/api/ai/reading-level", readingLevelHandler, true);
route("POST", "/api/ai/confidence", confidenceHandler, true);

// Vector search (Pinecone)
route("POST", "/api/ai/embed", embedHandler, true);
route("POST", "/api/ai/search", vectorSearchHandler, true);
route("GET", "/api/ai/vectors/stats", vectorStatsHandler, true);

// CarePoint — routing system
route("POST", "/api/chat", chatHandler, true);
route("POST", "/api/reroute", rerouteHandler, true);
route("GET", "/api/reroute/check/:sessionId", rerouteCheckHandler, true);
route("GET", "/api/facilities", facilitiesListHandler, true);
route("GET", "/api/facilities/:id", facilityDetailHandler, true);
route("GET", "/api/sessions", sessionsListHandler, true);
route("GET", "/api/sessions/:id", sessionDetailHandler, true);
route("GET", "/api/system/snapshot", systemSnapshotHandler, true);
route("GET", "/api/patients", patientsListHandler, true);
route("GET", "/api/patients/:id", patientDetailHandler, true);
route("GET", "/api/problems", problemsListHandler, true);
route("GET", "/api/encounters", encountersListHandler, true);
route("GET", "/api/staff", staffListHandler, true);
route("GET", "/api/analytics", analyticsHandler, true);

// AI Assistant
route("POST", "/api/assistant/chat", assistantChatHandler, true);
route("POST", "/api/assistant/suggest", suggestHandler, true);

// Integrations
route("GET", "/api/integrations", integrationsListHandler, true);
route("GET", "/api/integrations/:provider", integrationDetailHandler, true);
route("PUT", "/api/integrations/:provider", integrationUpsertHandler, true);
route("DELETE", "/api/integrations/:provider", integrationDeleteHandler, true);
route("POST", "/api/integrations/:provider/test", integrationTestHandler, true);

// Meetings
route("POST", "/api/meetings", meetingCreateHandler, true);
route("GET", "/api/meetings", meetingsListHandler, true);
route("GET", "/api/meetings/:id", meetingDetailHandler, true);
route("PATCH", "/api/meetings/:id/status", meetingStatusHandler, true);

// Demo simulation
route("POST", "/api/demo/simulate", demoSimulateHandler, true);

// Feature health checks
route("GET", "/api/health/features", healthFeaturesHandler, true);
route("POST", "/api/health/diagnose", healthDiagnoseHandler, true);

// Zoom integration
route("GET", "/api/zoom/config", zoomConfigGetHandler, true);
route("PUT", "/api/zoom/config", zoomConfigPutHandler, true);
route("POST", "/api/zoom/meeting", zoomMeetingCreateHandler, true);
route("GET", "/api/zoom/meeting/:id/signature", zoomMeetingSignatureHandler, true);
route("GET", "/api/zoom/sdk/connect", zoomSdkConnectHandler, true);
route("GET", "/api/zoom/sdk/callback", zoomSdkCallbackHandler);
route("POST", "/api/zoom/sdk/disconnect", zoomSdkDisconnectHandler, true);

// Webhooks (public — no auth)
route("POST", "/api/webhooks/zoom", zoomWebhookFullHandler);

// ---------- Worker Export ----------

export default {
  async fetch(request: Request, env: Env, execCtx: ExecutionContext): Promise<Response> {
    // Set log level based on environment
    if (env.ENVIRONMENT === "production") setLogLevel("info");

    // Static assets (frontend/) are served automatically by [assets] in wrangler.toml.
    // The Worker only receives requests that don't match a static file.
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
