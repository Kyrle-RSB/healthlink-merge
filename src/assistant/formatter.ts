// ============================================================
// AI Assistant — Context Formatter
// ============================================================
// Structures all retrieved data into LLM-friendly text format.
// Uses DATA_START/DATA_END delimiters for the answerer LLM.
// ============================================================

import type { QueryResult } from "./queries";
import type { EntitySearchResult } from "./entity-search";

/**
 * Format all retrieved data into a structured text context for the LLM.
 */
export function formatCombinedContext(
  primaryQuery: QueryResult | null,
  entityResult: EntitySearchResult | null,
  secondaryQuery: QueryResult | null
): string {
  const sections: string[] = [];

  sections.push(`Timestamp: ${new Date().toISOString()}`);
  sections.push("DATA_START");

  // Entity search results (if any matches)
  if (entityResult && entityResult.totalMatches > 0) {
    sections.push("=== ENTITY SEARCH RESULTS ===");
    sections.push(`Search terms: ${entityResult.searchTerms.join(", ")}`);
    sections.push(`Total matches: ${entityResult.totalMatches}`);

    if (entityResult.patients.length > 0) {
      sections.push("\n-- Patients Found --");
      sections.push(JSON.stringify(entityResult.patients, null, 2));
    }
    if (entityResult.staff.length > 0) {
      sections.push("\n-- Staff Found --");
      sections.push(JSON.stringify(entityResult.staff, null, 2));
    }
    if (entityResult.facilities.length > 0) {
      sections.push("\n-- Facilities Found --");
      sections.push(JSON.stringify(entityResult.facilities, null, 2));
    }

    sections.push("=== END ENTITY SEARCH ===\n");
  }

  // Primary query results
  if (primaryQuery) {
    sections.push("=== PRIMARY QUERY RESULTS ===");
    sections.push(`Query: ${primaryQuery.queryType}`);
    sections.push(`Summary: ${primaryQuery.summary}`);
    sections.push("---");

    if (primaryQuery.results.length > 0) {
      sections.push(JSON.stringify(primaryQuery.results, null, 2));
    } else {
      sections.push("No records found.");
    }

    sections.push("=== END PRIMARY QUERY ===\n");
  }

  // Secondary query results
  if (secondaryQuery) {
    sections.push("=== ADDITIONAL CONTEXT ===");
    sections.push(`Query: ${secondaryQuery.queryType}`);
    sections.push(`Summary: ${secondaryQuery.summary}`);
    sections.push("---");

    if (secondaryQuery.results.length > 0) {
      sections.push(JSON.stringify(secondaryQuery.results, null, 2));
    }

    sections.push("=== END ADDITIONAL CONTEXT ===\n");
  }

  // Fallback if nothing found
  if (!primaryQuery?.results.length && !entityResult?.totalMatches && !secondaryQuery?.results.length) {
    sections.push("No data found for this query.");
  }

  sections.push("DATA_END");
  return sections.join("\n");
}
