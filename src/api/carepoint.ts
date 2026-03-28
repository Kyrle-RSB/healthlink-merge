// ============================================================
// CarePoint API Handlers
// ============================================================

import type { Env, AuthedRequest, ChatMessage } from "../types";
import { success, error, created, notFound } from "../lib/response";
import { parseBody, parseQuery } from "../lib/validate";
import { buildPatientContext } from "../carepoint/context-engine";
import { makeRoutingDecision, evaluateFollowUp, SAFETY_DISCLAIMER } from "../carepoint/routing-engine";
import { checkRerouteEligibility } from "../carepoint/rerouter";
import { checkSessionForReroute } from "../carepoint/monitor";
import { simulateStep } from "../carepoint/simulator";
import {
  queryFacilities,
  queryFacilityById,
  queryAllPatients,
  queryPatientById,
  queryPatientConditions,
  queryPatientMedications,
  queryPatientEncounters,
  queryPatientObservations,
  queryRecentSessions,
  querySessionById,
  createRoutingSession,
  updateRoutingSession,
  queryLatestSystemState,
  queryAllProblems,
  queryAllStaff,
  queryAllEncounters,
  queryRoutingAnalytics,
} from "../db/queries-carepoint";
import { logger } from "../lib/logger";

// ---- Chat Handler (main CarePoint endpoint) ----

export async function chatHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{
    session_id?: string;
    patient_id?: string;
    message: string;
    client_sentiment?: string;
  }>(request);

  if (!body.message) {
    return error("message is required", 400);
  }

  // Get or create session
  let session;
  if (body.session_id) {
    session = await querySessionById(env.DB, body.session_id);
    if (!session) return notFound("Session not found");
  } else {
    session = await createRoutingSession(env.DB, {
      patient_id: body.patient_id,
      initial_complaint: body.message,
    });
  }

  // Build context
  const context = await buildPatientContext(env, {
    patientId: body.patient_id || session.patient_id || undefined,
    complaint: body.message,
  });

  // Load existing conversation for multi-turn awareness
  const existingLog: ChatMessage[] = session.conversation_log
    ? JSON.parse(session.conversation_log)
    : [];

  // Check if previous decision was a follow-up question
  let decision;
  const lastCarepoint = [...existingLog].reverse().find(m => m.role === "carepoint");
  const pendingFollowUp = lastCarepoint?.metadata?.destination === "pending_follow_up"
    ? lastCarepoint.metadata.follow_up_rule as Parameters<typeof evaluateFollowUp>[1] | undefined
    : undefined;

  if (pendingFollowUp) {
    // This message is answering a follow-up question
    const followUpDecision = evaluateFollowUp(body.message, pendingFollowUp);
    const { queryFacilitiesByDestination: qfbd } = await import("../db/queries-carepoint");
    const facilities = await qfbd(env.DB, followUpDecision.destination);
    const facility = facilities[0] || null;
    decision = {
      ...followUpDecision,
      facility,
      alternatives: [],
      wait_estimate_minutes: facility?.wait_minutes ?? 0,
      reroute_eligible: followUpDecision.destination !== "er",
    };
  } else {
    // Normal routing decision with conversation history + sentiment
    decision = await makeRoutingDecision(
      context,
      body.message,
      env,
      existingLog.length > 0 ? existingLog : undefined,
      body.client_sentiment || session.sentiment
    );
  }

  existingLog.push({
    role: "patient",
    content: body.message,
    timestamp: new Date().toISOString(),
  });

  existingLog.push({
    role: "carepoint",
    content: decision.reasoning + (decision.destination !== "er" && decision.destination !== "pending_follow_up" ? SAFETY_DISCLAIMER : ""),
    timestamp: new Date().toISOString(),
    metadata: {
      destination: decision.destination,
      confidence: decision.confidence,
      urgency: decision.urgency,
      facility_id: decision.facility?.id,
      ...(decision.destination === "pending_follow_up" && { follow_up_rule: (decision as unknown as Record<string, unknown>).follow_up_rule }),
    },
  });

  await updateRoutingSession(env.DB, session.id, {
    sentiment: body.client_sentiment || decision.sentiment,
    urgency_score: decision.urgency,
    confidence_score: decision.confidence,
    recommended_destination: decision.destination,
    recommended_facility_id: decision.facility?.id || null,
    conversation_log: JSON.stringify(existingLog),
    context_snapshot: JSON.stringify({
      patient: context.patient?.id,
      barriers: context.barriers,
      matched_problems: context.matchedProblems.map((p) => p.id),
      facility_loads: context.systemState.map((s) => ({
        id: s.facility.id,
        load: s.load_pct,
        wait: s.wait_minutes,
      })),
    }),
  });

  // Build dashboard data
  const facilitySnapshots = context.systemState.map((s) => ({
    id: s.facility.id,
    name: s.facility.name,
    type: s.facility.type,
    load_pct: s.load_pct,
    wait_minutes: s.wait_minutes,
    accepting: !!s.facility.accepting_patients,
  }));

  return success({
    session_id: session.id,
    response: decision.reasoning,
    decision: {
      destination: decision.destination,
      facility: decision.facility
        ? {
            id: decision.facility.id,
            name: decision.facility.name,
            type: decision.facility.type,
            address: decision.facility.address,
            phone: decision.facility.phone,
            hours: decision.facility.hours,
            wait_minutes: decision.wait_estimate_minutes,
          }
        : null,
      confidence: decision.confidence,
      urgency: decision.urgency,
      clinical_reasoning: decision.clinical_reasoning,
      alternatives: decision.alternatives.map((a) => ({
        destination: a.destination,
        facility_name: a.facility.name,
        wait_minutes: a.wait_estimate_minutes,
        reasoning: a.reasoning,
      })),
      reroute_eligible: decision.reroute_eligible,
    },
    sentiment: decision.sentiment,
    dashboard: {
      facilities: facilitySnapshots,
      session_count: 1, // simplified for demo
    },
  });
}

// ---- Reroute Handler ----

export async function rerouteHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{ session_id: string; accept: boolean }>(request);
  if (!body.session_id) return error("session_id is required", 400);

  const session = await querySessionById(env.DB, body.session_id);
  if (!session) return notFound("Session not found");

  const offer = await checkRerouteEligibility(env.DB, session);
  if (!offer) return success({ rerouted: false, reason: "No reroute available" });

  if (body.accept) {
    await updateRoutingSession(env.DB, session.id, {
      rerouted_from: session.recommended_facility_id,
      recommended_facility_id: offer.suggested_facility.id,
      recommended_destination: offer.suggested_facility.type.includes("urgent")
        ? "urgent_care"
        : "clinic",
      reroute_reason: offer.reason,
    });

    return success({
      rerouted: true,
      new_facility: {
        id: offer.suggested_facility.id,
        name: offer.suggested_facility.name,
        wait_minutes: offer.new_wait_minutes,
      },
      reason: offer.reason,
    });
  }

  return success({ rerouted: false, reason: "Patient declined reroute" });
}

// ---- Facilities Handlers ----

export async function facilitiesListHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const query = parseQuery(request);
  const facilities = await queryFacilities(env.DB, query.type || undefined);
  return success(facilities);
}

export async function facilityDetailHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const facility = await queryFacilityById(env.DB, ctx.params.id);
  if (!facility) return notFound("Facility not found");
  return success(facility);
}

// ---- Sessions Handlers ----

export async function sessionsListHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const query = parseQuery(request);
  const limit = parseInt(query.limit || "20", 10);
  const sessions = await queryRecentSessions(env.DB, limit);
  return success(sessions);
}

export async function sessionDetailHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const session = await querySessionById(env.DB, ctx.params.id);
  if (!session) return notFound("Session not found");
  return success(session);
}

// ---- System Snapshot Handler ----

export async function systemSnapshotHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const [facilities, metrics, sessions] = await Promise.all([
    queryFacilities(env.DB),
    queryLatestSystemState(env.DB),
    queryRecentSessions(env.DB, 10),
  ]);

  // Build per-facility snapshot
  const metricsMap = new Map<string, Record<string, number>>();
  for (const m of metrics) {
    if (!metricsMap.has(m.facility_id)) metricsMap.set(m.facility_id, {});
    metricsMap.get(m.facility_id)![m.metric_name] = m.metric_value;
  }

  const facilitySnapshots = facilities.map((f) => {
    const m = metricsMap.get(f.id) || {};
    return {
      id: f.id,
      name: f.name,
      type: f.type,
      hours: f.hours,
      load_pct: m.er_load_pct ?? m.load_pct ?? 0,
      wait_minutes: m.wait_minutes ?? f.wait_minutes,
      accepting: !!f.accepting_patients,
    };
  });

  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const reroutes = sessions.filter((s) => s.rerouted_from).length;

  return success({
    facilities: facilitySnapshots,
    sessions: {
      active: activeSessions,
      completed: completedSessions,
      reroutes,
      recent: sessions.slice(0, 5).map((s) => ({
        id: s.id,
        complaint: s.initial_complaint?.slice(0, 80),
        destination: s.recommended_destination,
        confidence: s.confidence_score,
        sentiment: s.sentiment,
        created_at: s.created_at,
      })),
    },
    timestamp: new Date().toISOString(),
  });
}

// ---- Patients Handler (for UI selector) ----

export async function patientsListHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const patients = await queryAllPatients(env.DB);
  return success(
    patients.map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      age: Math.floor(
        (Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      ),
      gender: p.gender,
      language: p.language,
      has_family_doctor: !!p.has_family_doctor,
      has_insurance: !!p.has_insurance,
      conditions_summary: p.conditions_summary,
    }))
  );
}

// ---- Reroute Check Handler (polling endpoint) ----

export async function rerouteCheckHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const sessionId = ctx.params.sessionId;
  if (!sessionId) return error("sessionId is required", 400);

  const offer = await checkSessionForReroute(env.DB, sessionId);
  if (!offer) {
    return success({ available: false });
  }

  return success({
    available: true,
    offer: {
      current_facility: offer.current_facility.name,
      current_wait: offer.current_wait_minutes,
      suggested_facility: {
        id: offer.suggested_facility.id,
        name: offer.suggested_facility.name,
        type: offer.suggested_facility.type,
        wait_minutes: offer.new_wait_minutes,
        address: offer.suggested_facility.address,
      },
      time_saved: offer.current_wait_minutes - offer.new_wait_minutes,
      reason: offer.reason,
    },
  });
}

// ---- Demo Simulator Handler ----

export async function demoSimulateHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{ step: string }>(request);
  if (!body.step) return error("step is required", 400);
  const result = await simulateStep(env.DB, body.step);
  return success(result);
}

// ---- Patient Detail Handler ----

export async function patientDetailHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const patient = await queryPatientById(env.DB, ctx.params.id);
  if (!patient) return notFound("Patient not found");

  const [conditions, medications, encounters, observations] = await Promise.all([
    queryPatientConditions(env.DB, patient.id),
    queryPatientMedications(env.DB, patient.id),
    queryPatientEncounters(env.DB, patient.id),
    queryPatientObservations(env.DB, patient.id),
  ]);

  const age = Math.floor(
    (Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  let barriers: string[] = [];
  try { barriers = patient.barriers ? JSON.parse(patient.barriers) : []; } catch { barriers = []; }

  return success({
    patient: { ...patient, age },
    conditions,
    medications,
    encounters,
    observations,
    barriers,
  });
}

// ---- Encounters Handler (all encounters) ----

export async function encountersListHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const query = parseQuery(request);
  const limit = parseInt(query.limit || "50", 10);
  const encounters = await queryAllEncounters(env.DB, limit);
  return success(encounters);
}

// ---- Staff Handler ----

export async function staffListHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const staff = await queryAllStaff(env.DB);
  return success(staff);
}

// ---- Analytics Handler ----

export async function analyticsHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const analytics = await queryRoutingAnalytics(env.DB);
  return success(analytics);
}

// ---- Problems Handler (reference data) ----

export async function problemsListHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const problems = await queryAllProblems(env.DB);
  return success(problems);
}
