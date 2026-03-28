// ============================================================
// Integrations API — Provider config CRUD + connection testing
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error, notFound } from "../lib/response";
import { parseBody } from "../lib/validate";
import { chatCompletion } from "../ai/client";
import { logger } from "../lib/logger";

// ---- Integration Config Queries (inline — small enough) ----

interface IntegrationConfig {
  id: string;
  provider: string;
  config: string;
  model: string | null;
  is_active: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

async function getConfig(db: D1Database, provider: string): Promise<IntegrationConfig | null> {
  return db.prepare("SELECT * FROM integration_configs WHERE provider = ?")
    .bind(provider).first<IntegrationConfig>();
}

async function listConfigs(db: D1Database): Promise<IntegrationConfig[]> {
  const { results } = await db.prepare("SELECT * FROM integration_configs ORDER BY provider")
    .all<IntegrationConfig>();
  return results;
}

async function upsertConfig(
  db: D1Database,
  provider: string,
  data: { config: string; model?: string; is_active?: number }
): Promise<void> {
  const existing = await getConfig(db, provider);
  const now = new Date().toISOString();

  if (existing) {
    await db.prepare(
      "UPDATE integration_configs SET config = ?, model = ?, is_active = ?, updated_at = ? WHERE provider = ?"
    ).bind(data.config, data.model || existing.model, data.is_active ?? existing.is_active, now, provider).run();
  } else {
    const id = `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      "INSERT INTO integration_configs (id, provider, config, model, is_active, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
    ).bind(id, provider, data.config, data.model || null, data.is_active ?? 1, now, now).run();
  }
}

async function deleteConfig(db: D1Database, provider: string): Promise<void> {
  await db.prepare("DELETE FROM integration_configs WHERE provider = ?").bind(provider).run();
}

// ---- Handlers ----

export async function integrationsListHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const configs = await listConfigs(env.DB);
  // Mask sensitive fields
  const masked = configs.map((c) => ({
    ...c,
    config: maskConfig(c.config),
  }));
  return success(masked);
}

export async function integrationDetailHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const config = await getConfig(env.DB, ctx.params.provider);
  if (!config) return notFound("Integration not found");
  return success({ ...config, config: maskConfig(config.config) });
}

export async function integrationUpsertHandler(
  request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{
    config: Record<string, string>;
    model?: string;
    is_active?: number;
  }>(request);

  if (!body.config) return error("config object is required", 400);

  await upsertConfig(env.DB, ctx.params.provider, {
    config: JSON.stringify(body.config),
    model: body.model,
    is_active: body.is_active,
  });

  return success({ provider: ctx.params.provider, status: "saved" });
}

export async function integrationDeleteHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  await deleteConfig(env.DB, ctx.params.provider);
  return success({ provider: ctx.params.provider, status: "deleted" });
}

export async function integrationTestHandler(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const provider = ctx.params.provider;

  if (provider === "openai") {
    // Check DB config first, then fall back to env var
    let apiKey = env.OPENAI_API_KEY;
    const dbConfig = await getConfig(env.DB, "openai");
    if (dbConfig) {
      try {
        const parsed = JSON.parse(dbConfig.config);
        if (parsed.api_key) apiKey = parsed.api_key;
      } catch { /* use env var */ }
    }
    if (!apiKey) return error("No OpenAI API key configured", 400);

    try {
      const start = Date.now();
      const response = await chatCompletion(apiKey, [
        { role: "user", content: 'Respond with exactly: {"status":"ok"}' },
      ], { model: "gpt-4o-mini", temperature: 0, maxTokens: 20 });
      const latency = Date.now() - start;

      const dbCfg = await getConfig(env.DB, "openai");
      const modelName = dbCfg?.model || "gpt-4o-mini";
      return success({ ok: true, provider: "openai", model: modelName, latency_ms: latency });
    } catch (err) {
      return success({
        ok: false,
        provider: "openai",
        error: err instanceof Error ? err.message : "Connection failed",
      });
    }
  }

  return success({ ok: false, provider, error: `Test not implemented for ${provider}` });
}

function maskConfig(configJson: string): string {
  try {
    const parsed = JSON.parse(configJson);
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && (key.includes("key") || key.includes("secret") || key.includes("token"))) {
        masked[key] = value.length > 8 ? value.slice(0, 4) + "..." + value.slice(-4) : "****";
      } else {
        masked[key] = value as string;
      }
    }
    return JSON.stringify(masked);
  } catch {
    return "{}";
  }
}
