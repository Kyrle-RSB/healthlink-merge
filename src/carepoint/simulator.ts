// ============================================================
// CarePoint Facility State Simulator
// ============================================================
// Drives REAL facility state changes in D1 during demos.
// Reroute checker then finds these changes organically.
// ============================================================

import { updateFacilityLoad, queryFacilities } from "../db/queries-carepoint";
import { logger } from "../lib/logger";

/**
 * Execute a named simulation step — updates REAL facility data in D1.
 */
export async function simulateStep(
  db: D1Database,
  step: string
): Promise<{ changed: string[] }> {
  const changed: string[] = [];

  switch (step) {
    case "robert_reroute": {
      // Saanich ER gets busier, Westshore opens up
      await updateFacilityLoad(db, "FAC-003", 68, 90);  // Saanich: 65→90min wait
      await updateFacilityLoad(db, "FAC-004", 8, 15);   // Westshore: 30→15min wait
      changed.push("FAC-003 (Saanich → 90min)", "FAC-004 (Westshore → 15min)");
      break;
    }

    case "er_surge": {
      // Royal Jubilee ER surges
      await updateFacilityLoad(db, "FAC-001", 485, 240); // RJH: 180→240min
      changed.push("FAC-001 (Royal Jubilee → 240min)");
      break;
    }

    case "tick": {
      // Small random fluctuations across all facilities (makes dashboard feel alive)
      const facilities = await queryFacilities(db);
      for (const f of facilities) {
        if (!f.capacity_total) continue;
        const waitDelta = Math.floor(Math.random() * 7) - 3; // -3 to +3 min
        const newWait = Math.max(0, f.wait_minutes + waitDelta);
        const capDelta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const newCap = Math.max(0, Math.min(f.capacity_total, (f.capacity_current ?? 0) + capDelta));
        await updateFacilityLoad(db, f.id, newCap, newWait);
      }
      changed.push("All facilities (±3min fluctuation)");
      break;
    }

    case "reset": {
      // Reset to original seed values
      await updateFacilityLoad(db, "FAC-001", 460, 180);
      await updateFacilityLoad(db, "FAC-002", 140, 120);
      await updateFacilityLoad(db, "FAC-003", 49, 45);
      await updateFacilityLoad(db, "FAC-004", 14, 30);
      await updateFacilityLoad(db, "FAC-005", 8, 45);
      await updateFacilityLoad(db, "FAC-006", 24, 60);
      await updateFacilityLoad(db, "FAC-008", 10, 5);
      await updateFacilityLoad(db, "FAC-009", 30, 10);
      await updateFacilityLoad(db, "FAC-010", 9, 20);
      await updateFacilityLoad(db, "FAC-012", 7, 15);
      changed.push("All facilities reset to baseline");
      break;
    }

    default:
      logger.warn("Unknown simulation step", { step });
  }

  logger.info("Simulation step executed", { step, changed });
  return { changed };
}
