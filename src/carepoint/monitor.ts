// ============================================================
// CarePoint Monitor — proactive reroute detection
// ============================================================
// Scans active sessions and current facility state to find
// reroute opportunities. Called by the polling endpoint.
// ============================================================

import type { RoutingSessionRow, RerouteOffer } from "../types";
import { queryRecentSessions } from "../db/queries-carepoint";
import { checkRerouteEligibility } from "./rerouter";
import { logger } from "../lib/logger";

/**
 * Check a specific session for reroute opportunities.
 * Returns a RerouteOffer if a better option is available, null otherwise.
 */
export async function checkSessionForReroute(
  db: D1Database,
  sessionId: string
): Promise<RerouteOffer | null> {
  const { querySessionById } = await import("../db/queries-carepoint");
  const session = await querySessionById(db, sessionId);
  if (!session) return null;

  // Only check active sessions with a facility assigned
  if (session.status !== "active") return null;
  if (!session.recommended_facility_id) return null;

  return checkRerouteEligibility(db, session);
}

/**
 * Scan all active sessions for reroute opportunities.
 * Returns an array of offers (one per eligible session).
 */
export async function scanForReroutes(
  db: D1Database
): Promise<{ session_id: string; offer: RerouteOffer }[]> {
  const sessions = await queryRecentSessions(db, 50);
  const activeSessions = sessions.filter(
    (s) => s.status === "active" && s.recommended_facility_id
  );

  const results: { session_id: string; offer: RerouteOffer }[] = [];

  for (const session of activeSessions) {
    try {
      const offer = await checkRerouteEligibility(db, session);
      if (offer) {
        results.push({ session_id: session.id, offer });
      }
    } catch (err) {
      logger.error("Reroute scan failed for session", {
        session_id: session.id,
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  logger.info("Reroute scan complete", {
    scanned: activeSessions.length,
    offers: results.length,
  });

  return results;
}
