// ============================================================
// CarePoint Context Engine — builds full patient context for routing
// ============================================================

import type { Env, PatientContext, FacilitySnapshot, ProblemRow } from "../types";
import {
  queryPatientById,
  queryPatientConditions,
  queryPatientMedications,
  queryPatientEncounters,
  queryPatientObservations,
  searchProblems,
  queryFacilities,
  queryLatestSystemState,
} from "../db/queries-carepoint";
import { logger } from "../lib/logger";

/**
 * Build full patient context for routing decisions.
 * Assembles: patient profile + matched problems + system state.
 */
export async function buildPatientContext(
  env: Env,
  input: {
    patientId?: string;
    complaint: string;
  }
): Promise<PatientContext> {
  const { patientId, complaint } = input;

  // Run all queries in parallel
  const [patient, matchedProblems, facilities, systemMetrics] = await Promise.all([
    patientId ? queryPatientById(env.DB, patientId) : Promise.resolve(null),
    searchProblemsByComplaint(env.DB, complaint),
    queryFacilities(env.DB),
    queryLatestSystemState(env.DB),
  ]);

  // If we have a patient, get their clinical data
  let conditions: import("../types").ConditionRow[] = [];
  let medications: import("../types").MedicationRow[] = [];
  let encounters: import("../types").EncounterRow[] = [];
  let observations: import("../types").ObservationRow[] = [];
  let barriers: string[] = [];

  if (patient) {
    [conditions, medications, encounters, observations] = await Promise.all([
      queryPatientConditions(env.DB, patient.id),
      queryPatientMedications(env.DB, patient.id),
      queryPatientEncounters(env.DB, patient.id),
      queryPatientObservations(env.DB, patient.id),
    ]);

    try {
      barriers = patient.barriers ? JSON.parse(patient.barriers) : [];
    } catch {
      barriers = [];
    }
  }

  // Build facility snapshots with current load data
  const metricsMap = new Map<string, Record<string, number>>();
  for (const m of systemMetrics) {
    if (!metricsMap.has(m.facility_id)) {
      metricsMap.set(m.facility_id, {});
    }
    metricsMap.get(m.facility_id)![m.metric_name] = m.metric_value;
  }

  const systemState: FacilitySnapshot[] = facilities.map((f) => {
    const metrics = metricsMap.get(f.id) || {};
    return {
      facility: f,
      load_pct: metrics.er_load_pct ?? metrics.load_pct ?? calculateLoadPct(f),
      wait_minutes: metrics.wait_minutes ?? f.wait_minutes,
    };
  });

  logger.info("Context built", {
    patientId: patient?.id || "anonymous",
    matchedProblems: matchedProblems.length,
    facilities: facilities.length,
    barriers: barriers.length,
  });

  return {
    patient,
    conditions,
    medications,
    encounters,
    observations,
    barriers,
    matchedProblems,
    systemState,
  };
}

/**
 * Search problems using FTS, with fallback to keyword matching.
 */
async function searchProblemsByComplaint(
  db: D1Database,
  complaint: string
): Promise<ProblemRow[]> {
  // Extract key symptom words for FTS
  const keywords = extractSymptomKeywords(complaint);
  if (keywords.length === 0) return [];

  // Try FTS search with extracted keywords
  const ftsQuery = keywords.join(" OR ");
  try {
    const results = await searchProblems(db, ftsQuery, 5);
    if (results.length > 0) return results;
  } catch {
    logger.debug("FTS search failed, falling back to LIKE query");
  }

  // Fallback: match against symptom text with LIKE
  const likePattern = `%${keywords[0]}%`;
  const { results } = await db
    .prepare("SELECT * FROM problems WHERE symptoms LIKE ? ORDER BY severity DESC LIMIT 5")
    .bind(likePattern)
    .all<ProblemRow>();
  return results;
}

/**
 * Extract symptom-relevant keywords from a complaint string.
 */
function extractSymptomKeywords(complaint: string): string[] {
  const stopWords = new Set([
    "i", "my", "me", "am", "is", "are", "was", "been", "have", "has", "had",
    "do", "does", "did", "the", "a", "an", "and", "or", "but", "in", "on",
    "at", "to", "for", "of", "with", "that", "this", "it", "not", "no",
    "so", "very", "really", "just", "like", "feel", "feeling", "having",
    "getting", "got", "been", "think", "know", "about", "from", "some",
    "can", "cant", "cannot", "dont", "doesnt", "lot", "much", "also",
    "would", "could", "should", "going", "went", "since", "ago",
  ]);

  return complaint
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/**
 * Calculate load percentage from capacity fields.
 */
function calculateLoadPct(facility: { capacity_total: number | null; capacity_current: number | null }): number {
  if (!facility.capacity_total || !facility.capacity_current) return 0;
  return Math.round((facility.capacity_current / facility.capacity_total) * 100);
}
