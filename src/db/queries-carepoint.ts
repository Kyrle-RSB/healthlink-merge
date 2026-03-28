// ============================================================
// CarePoint Database Queries — typed helpers for D1
// ============================================================

import type {
  FacilityRow,
  StaffRow,
  ProblemRow,
  RoutingSessionRow,
  SystemMetricRow,
  PatientRow,
  ConditionRow,
  MedicationRow,
  EncounterRow,
  ObservationRow,
} from "../types";

// ---- Facility Queries ----

export async function queryFacilities(
  db: D1Database,
  type?: string
): Promise<FacilityRow[]> {
  if (type) {
    const { results } = await db
      .prepare("SELECT * FROM facilities WHERE type = ? ORDER BY wait_minutes ASC")
      .bind(type)
      .all<FacilityRow>();
    return results;
  }
  const { results } = await db
    .prepare("SELECT * FROM facilities ORDER BY type, wait_minutes ASC")
    .all<FacilityRow>();
  return results;
}

export async function queryFacilityById(
  db: D1Database,
  id: string
): Promise<FacilityRow | null> {
  return db
    .prepare("SELECT * FROM facilities WHERE id = ?")
    .bind(id)
    .first<FacilityRow>();
}

export async function queryFacilitiesByDestination(
  db: D1Database,
  destination: string
): Promise<FacilityRow[]> {
  const typeMap: Record<string, string[]> = {
    er: ["hospital_trauma", "hospital_community"],
    urgent_care: ["urgent_care"],
    clinic: ["walkin_clinic", "family_practice", "community_health"],
    virtual: ["telehealth"],
    pharmacy: ["pharmacy"],
    mental_health_crisis: ["mental_health_crisis"],
    self_care: [],
  };

  const types = typeMap[destination] || [];
  if (types.length === 0) return [];

  const placeholders = types.map(() => "?").join(",");
  const { results } = await db
    .prepare(
      `SELECT * FROM facilities WHERE type IN (${placeholders}) AND accepting_patients = 1 ORDER BY wait_minutes ASC`
    )
    .bind(...types)
    .all<FacilityRow>();
  return results;
}

export async function updateFacilityLoad(
  db: D1Database,
  id: string,
  capacityCurrent: number,
  waitMinutes: number
): Promise<void> {
  await db
    .prepare(
      "UPDATE facilities SET capacity_current = ?, wait_minutes = ?, updated_at = datetime('now') WHERE id = ?"
    )
    .bind(capacityCurrent, waitMinutes, id)
    .run();
}

// ---- Problem Queries ----

export async function searchProblems(
  db: D1Database,
  query: string,
  limit = 10
): Promise<ProblemRow[]> {
  const { results } = await db
    .prepare(
      `SELECT problems.* FROM problems_fts
       JOIN problems ON problems.rowid = problems_fts.rowid
       WHERE problems_fts MATCH ?
       ORDER BY rank
       LIMIT ?`
    )
    .bind(query, limit)
    .all<ProblemRow>();
  return results;
}

export async function queryProblemsByDestination(
  db: D1Database,
  destination: string
): Promise<ProblemRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM problems WHERE recommended_destination = ? ORDER BY severity DESC")
    .bind(destination)
    .all<ProblemRow>();
  return results;
}

export async function queryAllProblems(
  db: D1Database
): Promise<ProblemRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM problems ORDER BY ctas_level ASC, severity DESC")
    .all<ProblemRow>();
  return results;
}

// ---- Routing Session Queries ----

export async function createRoutingSession(
  db: D1Database,
  data: {
    patient_id?: string;
    initial_complaint: string;
  }
): Promise<RoutingSessionRow> {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO routing_sessions (id, patient_id, status, initial_complaint, conversation_log, created_at, updated_at)
       VALUES (?, ?, 'active', ?, '[]', ?, ?)`
    )
    .bind(id, data.patient_id || null, data.initial_complaint, now, now)
    .run();

  return {
    id,
    patient_id: data.patient_id || null,
    status: "active",
    initial_complaint: data.initial_complaint,
    sentiment: null,
    urgency_score: null,
    confidence_score: null,
    recommended_destination: null,
    recommended_facility_id: null,
    actual_destination: null,
    rerouted_from: null,
    reroute_reason: null,
    conversation_log: "[]",
    context_snapshot: null,
    created_at: now,
    updated_at: now,
    completed_at: null,
  };
}

export async function updateRoutingSession(
  db: D1Database,
  id: string,
  data: Partial<
    Pick<
      RoutingSessionRow,
      | "status"
      | "sentiment"
      | "urgency_score"
      | "confidence_score"
      | "recommended_destination"
      | "recommended_facility_id"
      | "actual_destination"
      | "rerouted_from"
      | "reroute_reason"
      | "conversation_log"
      | "context_snapshot"
      | "completed_at"
    >
  >
): Promise<void> {
  const sets: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }

  values.push(id);
  await db
    .prepare(`UPDATE routing_sessions SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function querySessionById(
  db: D1Database,
  id: string
): Promise<RoutingSessionRow | null> {
  return db
    .prepare("SELECT * FROM routing_sessions WHERE id = ?")
    .bind(id)
    .first<RoutingSessionRow>();
}

export async function queryRecentSessions(
  db: D1Database,
  limit = 20
): Promise<RoutingSessionRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM routing_sessions ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<RoutingSessionRow>();
  return results;
}

export async function querySessionsByStatus(
  db: D1Database,
  status: string
): Promise<RoutingSessionRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM routing_sessions WHERE status = ? ORDER BY created_at DESC")
    .bind(status)
    .all<RoutingSessionRow>();
  return results;
}

// ---- Patient Context Queries ----

export async function queryPatientById(
  db: D1Database,
  id: string
): Promise<PatientRow | null> {
  return db
    .prepare("SELECT * FROM patients WHERE id = ?")
    .bind(id)
    .first<PatientRow>();
}

export async function queryAllPatients(
  db: D1Database
): Promise<PatientRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM patients ORDER BY last_name ASC")
    .all<PatientRow>();
  return results;
}

export async function queryPatientConditions(
  db: D1Database,
  patientId: string
): Promise<ConditionRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM conditions WHERE patient_id = ? ORDER BY onset_date DESC")
    .bind(patientId)
    .all<ConditionRow>();
  return results;
}

export async function queryPatientMedications(
  db: D1Database,
  patientId: string
): Promise<MedicationRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM medications WHERE patient_id = ? AND status = 'active' ORDER BY start_date DESC")
    .bind(patientId)
    .all<MedicationRow>();
  return results;
}

export async function queryPatientEncounters(
  db: D1Database,
  patientId: string,
  limit = 10
): Promise<EncounterRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM encounters WHERE patient_id = ? ORDER BY encounter_date DESC LIMIT ?")
    .bind(patientId, limit)
    .all<EncounterRow>();
  return results;
}

export async function queryPatientObservations(
  db: D1Database,
  patientId: string,
  limit = 20
): Promise<ObservationRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM observations WHERE patient_id = ? ORDER BY observation_date DESC LIMIT ?")
    .bind(patientId, limit)
    .all<ObservationRow>();
  return results;
}

// ---- System State Queries ----

export async function insertSystemMetric(
  db: D1Database,
  facilityId: string,
  metricName: string,
  metricValue: number
): Promise<void> {
  const id = `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db
    .prepare(
      "INSERT INTO system_state (id, facility_id, metric_name, metric_value, recorded_at) VALUES (?, ?, ?, ?, datetime('now'))"
    )
    .bind(id, facilityId, metricName, metricValue)
    .run();
}

export async function queryLatestSystemState(
  db: D1Database
): Promise<SystemMetricRow[]> {
  const { results } = await db
    .prepare(
      `SELECT s1.* FROM system_state s1
       INNER JOIN (
         SELECT facility_id, metric_name, MAX(recorded_at) as max_time
         FROM system_state
         GROUP BY facility_id, metric_name
       ) s2 ON s1.facility_id = s2.facility_id
         AND s1.metric_name = s2.metric_name
         AND s1.recorded_at = s2.max_time
       ORDER BY s1.facility_id, s1.metric_name`
    )
    .all<SystemMetricRow>();
  return results;
}

// ---- Staff Queries ----

export async function queryStaffByFacility(
  db: D1Database,
  facilityId: string
): Promise<StaffRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM staff WHERE facility_id = ? ORDER BY role, last_name")
    .bind(facilityId)
    .all<StaffRow>();
  return results;
}

export async function queryOnDutyStaff(
  db: D1Database
): Promise<StaffRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM staff WHERE on_duty = 1 ORDER BY facility_id, role")
    .all<StaffRow>();
  return results;
}

export async function queryAllStaff(
  db: D1Database
): Promise<StaffRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM staff ORDER BY facility_id, role, last_name")
    .all<StaffRow>();
  return results;
}

// ---- Encounter Queries (cross-patient) ----

export async function queryAllEncounters(
  db: D1Database,
  limit = 50
): Promise<EncounterRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM encounters ORDER BY encounter_date DESC LIMIT ?")
    .bind(limit)
    .all<EncounterRow>();
  return results;
}

// ---- Analytics Queries ----

export async function queryRoutingAnalytics(
  db: D1Database
): Promise<{
  total_sessions: number;
  active_sessions: number;
  destination_distribution: Record<string, number>;
  avg_confidence: number;
  avg_urgency: number;
  confidence_distribution: Record<string, number>;
  reroute_count: number;
  reroute_rate: number;
  sentiment_distribution: Record<string, number>;
  diversion_rate: number;
}> {
  const { results: sessions } = await db
    .prepare("SELECT * FROM routing_sessions")
    .all<RoutingSessionRow>();

  const total = sessions.length;
  const active = sessions.filter(s => s.status === "active").length;
  const reroutes = sessions.filter(s => s.rerouted_from).length;

  // Destination distribution
  const destDist: Record<string, number> = {};
  for (const s of sessions) {
    if (s.recommended_destination) {
      destDist[s.recommended_destination] = (destDist[s.recommended_destination] || 0) + 1;
    }
  }

  // Sentiment distribution
  const sentDist: Record<string, number> = {};
  for (const s of sessions) {
    if (s.sentiment) {
      sentDist[s.sentiment] = (sentDist[s.sentiment] || 0) + 1;
    }
  }

  // Average confidence
  const confScores = sessions.filter(s => s.confidence_score != null).map(s => s.confidence_score!);
  const avgConf = confScores.length ? Math.round((confScores.reduce((a, b) => a + b, 0) / confScores.length) * 100) : 0;

  // ER diversion rate: sessions where destination is NOT er, as % of total
  const nonER = sessions.filter(s => s.recommended_destination && s.recommended_destination !== "er").length;
  const divRate = total ? Math.round((nonER / total) * 100) : 0;

  // Confidence distribution (buckets)
  const confBuckets: Record<string, number> = { "90-100%": 0, "70-89%": 0, "50-69%": 0, "<50%": 0 };
  for (const c of confScores) {
    const pct = c * 100;
    if (pct >= 90) confBuckets["90-100%"]++;
    else if (pct >= 70) confBuckets["70-89%"]++;
    else if (pct >= 50) confBuckets["50-69%"]++;
    else confBuckets["<50%"]++;
  }

  // Average urgency
  const urgScores = sessions.filter(s => s.urgency_score != null).map(s => s.urgency_score!);
  const avgUrg = urgScores.length ? Math.round((urgScores.reduce((a, b) => a + b, 0) / urgScores.length) * 100) : 0;

  // Reroute success rate
  const rerouteRate = total ? Math.round((reroutes / total) * 100) : 0;

  return {
    total_sessions: total,
    active_sessions: active,
    destination_distribution: destDist,
    avg_confidence: avgConf,
    avg_urgency: avgUrg,
    confidence_distribution: confBuckets,
    reroute_count: reroutes,
    reroute_rate: rerouteRate,
    sentiment_distribution: sentDist,
    diversion_rate: divRate,
  };
}
