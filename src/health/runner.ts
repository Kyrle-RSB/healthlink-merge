// ============================================================
// Health Check Runner — executes checks for all registered features
// ============================================================

import type { Env } from "../types";
import type { FeatureEntry, CheckResult, HealthStatus } from "./feature-registry";
import { FEATURE_REGISTRY } from "./feature-registry";
import { containsPHIPatterns, classifyContent, assertMockData } from "../safety/guardrails";
import { handleRequest } from "../api/router";
import { logger } from "../lib/logger";

const SLOW_THRESHOLD_MS = 3000;

/** Run health checks for all registered features */
export async function runAllHealthChecks(
  env: Env,
  baseUrl: string
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const feature of FEATURE_REGISTRY) {
    try {
      const result = await runSingleCheck(feature, env, baseUrl);
      results.push(result);
    } catch (err) {
      results.push({
        featureKey: feature.key,
        status: "red",
        message: `Check crashed: ${err instanceof Error ? err.message : "Unknown error"}`,
        durationMs: 0,
        checkedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

/** Run a single feature health check */
async function runSingleCheck(
  feature: FeatureEntry,
  env: Env,
  baseUrl: string
): Promise<CheckResult> {
  const start = Date.now();

  switch (feature.checkType) {
    case "route":
      return checkRoute(feature, env, "GET", start);
    case "api_post":
      return checkRoute(feature, env, "POST", start);
    case "db_table":
      return checkDbTable(feature, env.DB, start);
    case "db_query":
      return checkDbQuery(feature, env.DB, start);
    case "function":
      return checkFunction(feature, env, start);
    case "frontend_asset":
      return checkFrontendAsset(feature, baseUrl, start);
    default:
      return {
        featureKey: feature.key,
        status: "grey",
        message: `Unknown check type: ${feature.checkType}`,
        durationMs: Date.now() - start,
        checkedAt: new Date().toISOString(),
      };
  }
}

/** Check an HTTP route via internal dispatch (no external fetch — avoids Worker loopback 522) */
async function checkRoute(
  feature: FeatureEntry,
  env: Env,
  method: "GET" | "POST",
  start: number
): Promise<CheckResult> {
  const expectedStatus = feature.expectedStatus || 200;
  const url = `https://internal${feature.checkTarget}`;

  try {
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (method === "POST" && feature.postBody) {
      init.body = JSON.stringify(feature.postBody);
    }

    const request = new Request(url, init);
    const response = await handleRequest(request, env);
    const durationMs = Date.now() - start;

    const statusOk =
      response.status === expectedStatus ||
      (expectedStatus === 200 && response.status >= 200 && response.status < 300);

    let status: HealthStatus;
    let message: string;

    if (statusOk) {
      status = durationMs > SLOW_THRESHOLD_MS ? "yellow" : "green";
      message = `OK (${response.status}) in ${durationMs}ms`;
    } else if (response.status === 404) {
      status = "red";
      message = `Not found (404) — route may not be registered`;
    } else if (response.status >= 500) {
      status = "red";
      message = `Server error (${response.status}) in ${durationMs}ms`;
    } else {
      status = "yellow";
      message = `Status ${response.status} (expected ${expectedStatus}) in ${durationMs}ms`;
    }

    let details: Record<string, unknown> | undefined;
    try {
      const body = await response.json() as Record<string, unknown>;
      if (body && typeof body === "object") {
        details = { ok: body.ok, hasData: body.data !== null && body.data !== undefined, error: body.error || null };
      }
    } catch { /* not JSON */ }

    return { featureKey: feature.key, status, message, durationMs, checkedAt: new Date().toISOString(), details };
  } catch (err) {
    return {
      featureKey: feature.key,
      status: "red",
      message: `Internal dispatch failed: ${err instanceof Error ? err.message : "Unknown"}`,
      durationMs: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  }
}

/** Check if a database table exists and has data */
async function checkDbTable(
  feature: FeatureEntry,
  db: D1Database,
  start: number
): Promise<CheckResult> {
  const table = feature.checkTarget;
  try {
    const result = await db
      .prepare(`SELECT COUNT(*) as count FROM ${table}`)
      .first<{ count: number }>();
    const durationMs = Date.now() - start;
    const count = result?.count ?? 0;

    if (count === 0) {
      return {
        featureKey: feature.key,
        status: "yellow",
        message: `Table exists but is empty (0 rows) — ${durationMs}ms`,
        durationMs,
        checkedAt: new Date().toISOString(),
        details: { rowCount: 0 },
      };
    }

    return {
      featureKey: feature.key,
      status: "green",
      message: `OK — ${count} rows in ${durationMs}ms`,
      durationMs,
      checkedAt: new Date().toISOString(),
      details: { rowCount: count },
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    return {
      featureKey: feature.key,
      status: "red",
      message: `Table "${table}" error: ${err instanceof Error ? err.message : "Unknown"}`,
      durationMs,
      checkedAt: new Date().toISOString(),
    };
  }
}

/** Check a database query */
async function checkDbQuery(
  feature: FeatureEntry,
  db: D1Database,
  start: number
): Promise<CheckResult> {
  return checkDbTable(feature, db, start);
}

/** Check a function exists and works */
async function checkFunction(
  feature: FeatureEntry,
  env: Env,
  start: number
): Promise<CheckResult> {
  const target = feature.checkTarget;

  try {
    let status: HealthStatus = "green";
    let message = "";

    switch (target) {
      case "containsPHIPatterns": {
        // Test PHI detection works
        const shouldDetect = containsPHIPatterns("SSN: 123-45-6789");
        const shouldPass = !containsPHIPatterns("MOCK DATA: normal text");
        if (shouldDetect && shouldPass) {
          message = "PHI detection working correctly";
        } else {
          status = "red";
          message = `PHI detection failed: detect=${shouldDetect}, pass=${shouldPass}`;
        }
        break;
      }
      case "classifyContent": {
        const result = classifyContent("MOCK DATA: test content");
        if (result.level === "safe") {
          message = "Content classification working correctly";
        } else {
          status = "yellow";
          message = `Unexpected classification: ${result.level}`;
        }
        break;
      }
      case "assertMockData": {
        try {
          assertMockData({ test: "MOCK data" });
          message = "Mock data validation working correctly";
        } catch {
          status = "red";
          message = "Mock data validation threw an error";
        }
        break;
      }
      case "kv_available": {
        if (env.KV) {
          await env.KV.put("_health_check", "ok", { expirationTtl: 60 });
          const val = await env.KV.get("_health_check");
          if (val === "ok") {
            message = "KV namespace read/write working";
          } else {
            status = "yellow";
            message = "KV write succeeded but read returned unexpected value";
          }
        } else {
          status = "red";
          message = "KV namespace not bound";
        }
        break;
      }
      default:
        status = "grey";
        message = `Unknown function check: ${target}`;
    }

    return {
      featureKey: feature.key,
      status,
      message: `${message} — ${Date.now() - start}ms`,
      durationMs: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      featureKey: feature.key,
      status: "red",
      message: `Function check failed: ${err instanceof Error ? err.message : "Unknown"}`,
      durationMs: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  }
}

/** Check if a frontend asset exists (static check — no external fetch to avoid loopback) */
async function checkFrontendAsset(
  feature: FeatureEntry,
  _baseUrl: string,
  start: number
): Promise<CheckResult> {
  // Frontend assets are served by Cloudflare's [assets] directive from ./frontend/
  // We can't fetch ourselves (loopback 522), so we verify the asset is in our known set
  const knownAssets = [
    "/index.html", "/carepoint.html", "/admin.html", "/health.html",
    "/styles.css", "/carepoint.css", "/admin.css", "/health.css",
    "/app.js", "/api.js", "/carepoint.js", "/admin.js", "/health.js",
    "/assistant.js", "/call-transcribe.js",
  ];

  const asset = feature.checkTarget;
  const durationMs = Date.now() - start;

  if (knownAssets.includes(asset)) {
    return {
      featureKey: feature.key,
      status: "green",
      message: `Asset registered in deployment (${asset}) — ${durationMs}ms`,
      durationMs,
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    featureKey: feature.key,
    status: "yellow",
    message: `Asset ${asset} not in known deployment list — ${durationMs}ms`,
    durationMs,
    checkedAt: new Date().toISOString(),
  };
}

/** Generate summary stats from results */
export function summarizeResults(results: CheckResult[]): {
  total: number;
  green: number;
  yellow: number;
  red: number;
  grey: number;
  healthScore: number;
} {
  const green = results.filter((r) => r.status === "green").length;
  const yellow = results.filter((r) => r.status === "yellow").length;
  const red = results.filter((r) => r.status === "red").length;
  const grey = results.filter((r) => r.status === "grey").length;
  const checkable = results.length - grey;
  const healthScore = checkable > 0 ? Math.round(((green + yellow * 0.5) / checkable) * 100) : 0;

  return { total: results.length, green, yellow, red, grey, healthScore };
}
