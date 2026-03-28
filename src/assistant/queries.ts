// ============================================================
// AI Assistant — Healthcare Query Functions
// ============================================================
// Each function pulls structured data from D1 BEFORE the LLM.
// The LLM only interprets/explains — it never queries directly.
// ============================================================

import {
  queryAllPatients,
  queryPatientById,
  queryPatientConditions,
  queryPatientMedications,
  queryPatientEncounters,
  queryPatientObservations,
  queryFacilities,
  queryLatestSystemState,
  queryAllProblems,
  searchProblems,
  queryProblemsByDestination,
  queryRecentSessions,
  queryAllStaff,
  queryStaffByFacility,
  queryAllEncounters,
  queryRoutingAnalytics,
} from "../db/queries-carepoint";
import type { QueryPlan } from "./planner";

export interface QueryResult {
  queryType: string;
  results: unknown[];
  count: number;
  summary: string;
}

type QueryFn = (db: D1Database, params: Record<string, string>) => Promise<QueryResult>;

const QUERY_MAP: Record<string, QueryFn> = {
  patient_lookup: queryPatientLookup,
  facility_status: queryFacilityStatus,
  problem_info: queryProblemInfo,
  routing_history: queryRoutingHistory,
  staff_lookup: queryStaffLookup,
  encounter_history: queryEncounterHistory,
  system_overview: querySystemOverview,
  medication_info: queryMedicationInfo,
  general_summary: queryGeneralSummary,
};

/**
 * Get the query function for a given intent.
 */
export function getQueryForIntent(intent: string): QueryFn {
  return QUERY_MAP[intent] || queryGeneralSummary;
}

// ---- Query Implementations ----

async function queryPatientLookup(db: D1Database, params: Record<string, string>): Promise<QueryResult> {
  if (params.patient_id) {
    const patient = await queryPatientById(db, params.patient_id);
    if (!patient) return { queryType: "patient_lookup", results: [], count: 0, summary: "Patient not found." };
    const [conditions, meds, encounters, obs] = await Promise.all([
      queryPatientConditions(db, patient.id),
      queryPatientMedications(db, patient.id),
      queryPatientEncounters(db, patient.id),
      queryPatientObservations(db, patient.id),
    ]);
    return {
      queryType: "patient_lookup",
      results: [{ ...patient, conditions, medications: meds, encounters, observations: obs }],
      count: 1,
      summary: `Found patient: ${patient.first_name} ${patient.last_name}`,
    };
  }

  const all = await queryAllPatients(db);
  let filtered = all;

  if (params.filter === "no_family_doctor") {
    filtered = all.filter((p) => !p.has_family_doctor);
  } else if (params.filter === "no_insurance") {
    filtered = all.filter((p) => !p.has_insurance);
  }

  // Enrich each patient with conditions and meds
  const enriched = await Promise.all(
    filtered.map(async (p) => {
      const [conditions, meds] = await Promise.all([
        queryPatientConditions(db, p.id),
        queryPatientMedications(db, p.id),
      ]);
      return { ...p, conditions, medications: meds };
    })
  );

  const filterDesc = params.filter ? ` (filter: ${params.filter})` : "";
  return {
    queryType: "patient_lookup",
    results: enriched,
    count: enriched.length,
    summary: `${enriched.length} patients found${filterDesc}.`,
  };
}

async function queryFacilityStatus(db: D1Database, params: Record<string, string>): Promise<QueryResult> {
  const facilities = await queryFacilities(db, params.facility_type);
  const metrics = await queryLatestSystemState(db);

  const metricsMap = new Map<string, Record<string, number>>();
  for (const m of metrics) {
    if (!metricsMap.has(m.facility_id)) metricsMap.set(m.facility_id, {});
    metricsMap.get(m.facility_id)![m.metric_name] = m.metric_value;
  }

  const enriched = facilities.map((f) => {
    const m = metricsMap.get(f.id) || {};
    return {
      ...f,
      load_pct: m.er_load_pct ?? m.load_pct ?? (f.capacity_total ? Math.round(((f.capacity_current ?? 0) / f.capacity_total) * 100) : 0),
      current_wait: m.wait_minutes ?? f.wait_minutes,
    };
  });

  const hospitals = enriched.filter((f) => f.type.includes("hospital"));
  const maxER = hospitals.sort((a, b) => (b.load_pct || 0) - (a.load_pct || 0))[0];
  return {
    queryType: "facility_status",
    results: enriched,
    count: enriched.length,
    summary: `${enriched.length} facilities. Peak ER load: ${maxER?.load_pct || 0}% at ${maxER?.name || "N/A"} (${maxER?.current_wait || 0}min wait).`,
  };
}

async function queryProblemInfo(db: D1Database, params: Record<string, string>): Promise<QueryResult> {
  let problems;
  if (params.destination) {
    problems = await queryProblemsByDestination(db, params.destination);
  } else if (params.condition) {
    problems = await searchProblems(db, params.condition);
  } else {
    problems = await queryAllProblems(db);
  }

  const byCtas: Record<number, number> = {};
  const byDest: Record<string, number> = {};
  for (const p of problems) {
    byCtas[p.ctas_level] = (byCtas[p.ctas_level] || 0) + 1;
    byDest[p.recommended_destination] = (byDest[p.recommended_destination] || 0) + 1;
  }

  return {
    queryType: "problem_info",
    results: problems,
    count: problems.length,
    summary: `${problems.length} conditions. By CTAS: ${Object.entries(byCtas).map(([k, v]) => `Level ${k}: ${v}`).join(", ")}. By destination: ${Object.entries(byDest).map(([k, v]) => `${k}: ${v}`).join(", ")}.`,
  };
}

async function queryRoutingHistory(db: D1Database, _params: Record<string, string>): Promise<QueryResult> {
  const sessions = await queryRecentSessions(db, 20);
  const byDest: Record<string, number> = {};
  for (const s of sessions) {
    if (s.recommended_destination) {
      byDest[s.recommended_destination] = (byDest[s.recommended_destination] || 0) + 1;
    }
  }
  const reroutes = sessions.filter((s) => s.rerouted_from).length;
  return {
    queryType: "routing_history",
    results: sessions,
    count: sessions.length,
    summary: `${sessions.length} recent routing sessions. Destinations: ${Object.entries(byDest).map(([k, v]) => `${k}: ${v}`).join(", ")}. ${reroutes} reroutes.`,
  };
}

async function queryStaffLookup(db: D1Database, params: Record<string, string>): Promise<QueryResult> {
  const staff = params.facility_id
    ? await queryStaffByFacility(db, params.facility_id)
    : await queryAllStaff(db);

  const onDuty = staff.filter((s) => s.on_duty).length;
  const byRole: Record<string, number> = {};
  for (const s of staff) byRole[s.role] = (byRole[s.role] || 0) + 1;

  return {
    queryType: "staff_lookup",
    results: staff,
    count: staff.length,
    summary: `${staff.length} staff members (${onDuty} on duty). Roles: ${Object.entries(byRole).map(([k, v]) => `${k}: ${v}`).join(", ")}.`,
  };
}

async function queryEncounterHistory(db: D1Database, params: Record<string, string>): Promise<QueryResult> {
  if (params.patient_id) {
    const encounters = await queryPatientEncounters(db, params.patient_id);
    return {
      queryType: "encounter_history",
      results: encounters,
      count: encounters.length,
      summary: `${encounters.length} encounters for patient ${params.patient_id}.`,
    };
  }
  const encounters = await queryAllEncounters(db);
  return {
    queryType: "encounter_history",
    results: encounters,
    count: encounters.length,
    summary: `${encounters.length} total encounters across all patients.`,
  };
}

async function querySystemOverview(db: D1Database, _params: Record<string, string>): Promise<QueryResult> {
  const [analytics, patients, facilities, problems, staff] = await Promise.all([
    queryRoutingAnalytics(db),
    queryAllPatients(db),
    queryFacilities(db),
    queryAllProblems(db),
    queryAllStaff(db),
  ]);

  return {
    queryType: "system_overview",
    results: [{
      analytics,
      patient_count: patients.length,
      facility_count: facilities.length,
      problem_count: problems.length,
      staff_count: staff.length,
      accepting_facilities: facilities.filter((f) => f.accepting_patients).length,
    }],
    count: 1,
    summary: `System: ${patients.length} patients, ${facilities.length} facilities (${facilities.filter((f) => f.accepting_patients).length} accepting), ${problems.length} conditions, ${staff.length} staff. ${analytics.total_sessions} routing sessions, ${analytics.diversion_rate}% ER diversion rate.`,
  };
}

async function queryMedicationInfo(db: D1Database, params: Record<string, string>): Promise<QueryResult> {
  if (params.patient_id) {
    const meds = await queryPatientMedications(db, params.patient_id);
    return {
      queryType: "medication_info",
      results: meds,
      count: meds.length,
      summary: `${meds.length} active medications for patient ${params.patient_id}.`,
    };
  }

  // Get all patients' medications
  const patients = await queryAllPatients(db);
  const allMeds = await Promise.all(
    patients.map(async (p) => {
      const meds = await queryPatientMedications(db, p.id);
      return meds.map((m) => ({ ...m, patient_name: `${p.first_name} ${p.last_name}` }));
    })
  );
  const flat = allMeds.flat();
  return {
    queryType: "medication_info",
    results: flat,
    count: flat.length,
    summary: `${flat.length} active medications across ${patients.length} patients.`,
  };
}

async function queryGeneralSummary(db: D1Database, _params: Record<string, string>): Promise<QueryResult> {
  return querySystemOverview(db, _params);
}
