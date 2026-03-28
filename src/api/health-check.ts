// ============================================================
// Health Check API — feature diagnostic endpoints
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error } from "../lib/response";
import { parseBody } from "../lib/validate";
import { runAllHealthChecks, summarizeResults } from "../health/runner";
import { FEATURE_REGISTRY, getCategories } from "../health/feature-registry";
import type { CheckResult } from "../health/feature-registry";
import { logger } from "../lib/logger";

/** GET /api/health/features — run all health checks */
export async function healthFeaturesHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  logger.info("Running feature health checks", { baseUrl });

  const results = await runAllHealthChecks(env, baseUrl);
  const summary = summarizeResults(results);

  // Group by category
  const byCategory: Record<string, CheckResult[]> = {};
  for (const r of results) {
    const feature = FEATURE_REGISTRY.find((f) => f.key === r.featureKey);
    const cat = feature?.category || "unknown";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(r);
  }

  return success({
    summary,
    categories: getCategories(),
    results,
    byCategory,
    registry: FEATURE_REGISTRY.map((f) => ({
      key: f.key,
      name: f.name,
      category: f.category,
      description: f.description,
      checkType: f.checkType,
      checkTarget: f.checkTarget,
    })),
    checkedAt: new Date().toISOString(),
  });
}

/** POST /api/health/diagnose — deep diagnose a single feature */
export async function healthDiagnoseHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{ featureKey: string }>(request);
  if (!body.featureKey) return error("featureKey is required", 400);

  const feature = FEATURE_REGISTRY.find((f) => f.key === body.featureKey);
  if (!feature) return error(`Feature "${body.featureKey}" not found in registry`, 404);

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const steps: { label: string; status: "pass" | "fail" | "warn" | "info"; detail: string }[] = [];
  const suggestions: string[] = [];

  // Step 1: Feature info
  steps.push({
    label: "Feature Identified",
    status: "info",
    detail: `${feature.name} (${feature.checkType}) → ${feature.checkTarget}`,
  });

  // Step 2: Run the check
  const start = Date.now();
  let checkResult: CheckResult | null = null;
  try {
    const results = await runAllHealthChecks(env, baseUrl);
    checkResult = results.find((r) => r.featureKey === feature.key) || null;
  } catch (err) {
    steps.push({
      label: "Health Check Execution",
      status: "fail",
      detail: `Check crashed: ${err instanceof Error ? err.message : "Unknown"}`,
    });
    suggestions.push("The health check runner itself failed — check Worker logs for errors");
  }

  if (checkResult) {
    steps.push({
      label: "Health Check Result",
      status: checkResult.status === "green" ? "pass" : checkResult.status === "yellow" ? "warn" : "fail",
      detail: checkResult.message,
    });

    steps.push({
      label: "Response Time",
      status: checkResult.durationMs < 1000 ? "pass" : checkResult.durationMs < 3000 ? "warn" : "fail",
      detail: `${checkResult.durationMs}ms`,
    });
  }

  // Step 3: Check related tables
  if (feature.relatedTables && feature.relatedTables.length > 0) {
    for (const table of feature.relatedTables) {
      try {
        const result = await env.DB
          .prepare(`SELECT COUNT(*) as count FROM ${table}`)
          .first<{ count: number }>();
        const count = result?.count ?? 0;
        steps.push({
          label: `Related Table: ${table}`,
          status: count > 0 ? "pass" : "warn",
          detail: count > 0 ? `${count} rows` : "Table exists but is empty",
        });
        if (count === 0) {
          suggestions.push(`Table "${table}" is empty — run npm run db:seed:remote to populate`);
        }
      } catch {
        steps.push({
          label: `Related Table: ${table}`,
          status: "fail",
          detail: "Table does not exist or query failed",
        });
        suggestions.push(`Table "${table}" is missing — run npm run db:migrate:remote`);
      }
    }
  }

  // Step 4: Check DB schema if db_table type
  if (feature.checkType === "db_table") {
    try {
      const info = await env.DB
        .prepare(`PRAGMA table_info(${feature.checkTarget})`)
        .all<{ name: string; type: string }>();
      if (info.results.length > 0) {
        steps.push({
          label: "Table Schema",
          status: "pass",
          detail: `${info.results.length} columns: ${info.results.map((c) => c.name).join(", ")}`,
        });
      }
    } catch {
      steps.push({
        label: "Table Schema",
        status: "fail",
        detail: "Could not read table schema",
      });
    }

    // Check indexes
    try {
      const indexes = await env.DB
        .prepare(`PRAGMA index_list(${feature.checkTarget})`)
        .all<{ name: string }>();
      steps.push({
        label: "Table Indexes",
        status: "info",
        detail: `${indexes.results.length} index(es)`,
      });
    } catch {
      // No indexes — fine
    }
  }

  // Generate suggestions based on status
  if (checkResult?.status === "red") {
    if (checkResult.message.includes("404")) {
      suggestions.push("Route returns 404 — check if the handler is registered in src/index.ts");
    }
    if (checkResult.message.includes("500")) {
      suggestions.push("Server error — check Worker logs with: npm run tail");
    }
    if (checkResult.message.includes("Timeout")) {
      suggestions.push("Request timed out — the Worker may be overloaded or the endpoint is hanging");
    }
    if (checkResult.message.includes("Table")) {
      suggestions.push("Database table issue — run: npx wrangler d1 execute healthlink-db --remote --file=src/db/schema.sql");
    }
  }

  if (checkResult?.status === "yellow") {
    if (checkResult.message.includes("slow")) {
      suggestions.push("Response is slow — check for unoptimized queries or missing indexes");
    }
    if (checkResult.message.includes("empty")) {
      suggestions.push("Table is empty — run: npx wrangler d1 execute healthlink-db --remote --file=src/db/seed.sql");
    }
  }

  const severity = checkResult?.status === "red" ? "critical" : checkResult?.status === "yellow" ? "warning" : "healthy";

  return success({
    featureKey: feature.key,
    featureName: feature.name,
    severity,
    steps,
    suggestions,
    diagnosedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  });
}
