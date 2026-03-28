// ============================================================
// AI Assistant — Cross-Table Entity Search
// ============================================================
// Always-on search when names are extracted from user questions.
// Searches patients, staff, and facilities by name.
// ============================================================

import type { PatientRow, StaffRow, FacilityRow } from "../types";

export interface EntitySearchResult {
  searchTerms: string[];
  patients: (PatientRow & { conditions?: string[]; medications?: string[] })[];
  staff: StaffRow[];
  facilities: FacilityRow[];
  totalMatches: number;
}

/**
 * Search across patients, staff, and facilities by name.
 * Runs all searches in parallel for speed.
 */
export async function searchEntities(
  db: D1Database,
  names: string[]
): Promise<EntitySearchResult> {
  if (names.length === 0) {
    return { searchTerms: [], patients: [], staff: [], facilities: [], totalMatches: 0 };
  }

  const [patients, staff, facilities] = await Promise.all([
    searchPatientsByName(db, names),
    searchStaffByName(db, names),
    searchFacilitiesByName(db, names),
  ]);

  return {
    searchTerms: names,
    patients,
    staff,
    facilities,
    totalMatches: patients.length + staff.length + facilities.length,
  };
}

async function searchPatientsByName(
  db: D1Database,
  names: string[]
): Promise<PatientRow[]> {
  const conditions = names
    .map(() => "(LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?)")
    .join(" OR ");

  const binds = names.flatMap((n) => [`%${n}%`, `%${n}%`]);

  const { results } = await db
    .prepare(`SELECT * FROM patients WHERE ${conditions} LIMIT 10`)
    .bind(...binds)
    .all<PatientRow>();

  // Enrich with conditions and medications
  const enriched = await Promise.all(
    results.map(async (p) => {
      const [conds, meds] = await Promise.all([
        db.prepare("SELECT description FROM conditions WHERE patient_id = ? AND status = 'active'")
          .bind(p.id).all<{ description: string }>(),
        db.prepare("SELECT description FROM medications WHERE patient_id = ? AND status = 'active'")
          .bind(p.id).all<{ description: string }>(),
      ]);
      return {
        ...p,
        conditions: conds.results.map((c) => c.description),
        medications: meds.results.map((m) => m.description),
      };
    })
  );

  return enriched;
}

async function searchStaffByName(
  db: D1Database,
  names: string[]
): Promise<StaffRow[]> {
  const conditions = names
    .map(() => "(LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?)")
    .join(" OR ");

  const binds = names.flatMap((n) => [`%${n}%`, `%${n}%`]);

  const { results } = await db
    .prepare(`SELECT * FROM staff WHERE ${conditions} LIMIT 10`)
    .bind(...binds)
    .all<StaffRow>();

  return results;
}

async function searchFacilitiesByName(
  db: D1Database,
  names: string[]
): Promise<FacilityRow[]> {
  const conditions = names.map(() => "LOWER(name) LIKE ?").join(" OR ");
  const binds = names.map((n) => `%${n}%`);

  const { results } = await db
    .prepare(`SELECT * FROM facilities WHERE ${conditions} LIMIT 10`)
    .bind(...binds)
    .all<FacilityRow>();

  return results;
}
