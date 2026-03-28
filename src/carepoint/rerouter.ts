// ============================================================
// CarePoint Rerouter — dynamic rerouting during waits
// ============================================================
// Checks if a better option has become available for a patient
// who is already waiting. Never reroutes true emergencies.
// ============================================================

import type { RoutingSessionRow, FacilityRow, RerouteOffer } from "../types";
import { queryFacilityById, queryFacilitiesByDestination } from "../db/queries-carepoint";
import { logger } from "../lib/logger";

/**
 * Check if a patient waiting at a facility should be offered a reroute.
 * Returns a RerouteOffer if a better option exists, null otherwise.
 */
export async function checkRerouteEligibility(
  db: D1Database,
  session: RoutingSessionRow
): Promise<RerouteOffer | null> {
  // Never reroute emergency cases
  if (session.urgency_score && session.urgency_score >= 0.8) return null;

  // Must have a recommended facility
  if (!session.recommended_facility_id) return null;

  const currentFacility = await queryFacilityById(db, session.recommended_facility_id);
  if (!currentFacility) return null;

  // Only reroute from ER or high-wait facilities
  if (currentFacility.wait_minutes < 60) return null;

  // Find alternatives with shorter waits
  const adjacentTypes: Record<string, string[]> = {
    hospital_trauma: ["urgent_care", "walkin_clinic", "community_health"],
    hospital_community: ["urgent_care", "walkin_clinic", "community_health"],
    urgent_care: ["walkin_clinic", "community_health"],
  };

  const checkTypes = adjacentTypes[currentFacility.type];
  if (!checkTypes) return null;

  // Map facility types to routing destinations
  const typeToDestMap: Record<string, string> = {
    urgent_care: "urgent_care",
    walkin_clinic: "clinic",
    community_health: "clinic",
  };

  for (const facType of checkTypes) {
    const dest = typeToDestMap[facType] || "clinic";
    const alternatives = await queryFacilitiesByDestination(db, dest);
    for (const alt of alternatives) {
      // Must be significantly faster (at least 50% reduction or 30+ min saved)
      const timeSaved = currentFacility.wait_minutes - alt.wait_minutes;
      const pctReduction = timeSaved / currentFacility.wait_minutes;

      if (timeSaved >= 30 || pctReduction >= 0.5) {
        logger.info("Reroute opportunity found", {
          session_id: session.id,
          from: currentFacility.name,
          to: alt.name,
          time_saved: timeSaved,
        });

        return {
          session_id: session.id,
          current_facility: currentFacility,
          suggested_facility: alt,
          reason: `${alt.name} can see you in ${alt.wait_minutes} minutes — ${timeSaved} minutes faster than your current wait at ${currentFacility.name}.`,
          new_wait_minutes: alt.wait_minutes,
          current_wait_minutes: currentFacility.wait_minutes,
        };
      }
    }
  }

  return null;
}
