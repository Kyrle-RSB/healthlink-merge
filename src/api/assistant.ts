// ============================================================
// AI Assistant API — Two-Stage RAG Endpoint
// ============================================================
// Stage 1: Planner LLM → structured query plan
// Stage 2: Execute D1 queries → format context → Answerer LLM (streaming)
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { error } from "../lib/response";
import { parseBody } from "../lib/validate";
import { generateQueryPlan } from "../assistant/planner";
import { classifyIntent } from "../assistant/classifier";
import { getQueryForIntent } from "../assistant/queries";
import { searchEntities } from "../assistant/entity-search";
import { formatCombinedContext } from "../assistant/formatter";
import { callLLM } from "../assistant/llm";
import type { LLMConfig } from "../assistant/llm";
import { logger } from "../lib/logger";

/**
 * POST /api/assistant/chat
 * Two-stage RAG: Planner → Queries → Formatter → Answerer (streaming)
 */
export async function assistantChatHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{ message: string; sessionId?: string }>(request);
  if (!body.message) return error("message is required", 400);

  // Resolve LLM config — check DB first, then env var
  let apiKey = env.OPENAI_API_KEY;
  let model = "gpt-4o-mini";
  try {
    const dbConfig = await env.DB.prepare("SELECT config, model FROM integration_configs WHERE provider = 'openai'")
      .first<{ config: string; model: string | null }>();
    if (dbConfig) {
      const parsed = JSON.parse(dbConfig.config);
      if (parsed.api_key) apiKey = parsed.api_key;
      if (dbConfig.model) model = dbConfig.model;
    }
  } catch { /* use env var */ }

  if (!apiKey) {
    return error("No OpenAI API key configured. Add one in Admin → Integrations.", 503);
  }

  const config: LLMConfig = {
    provider: "openai",
    apiKey,
    model,
  };

  try {
    // Stage 1: Generate query plan (LLM planner with keyword fallback)
    let plan = await generateQueryPlan(body.message, apiKey);
    let planSource = "llm";

    if (!plan) {
      plan = classifyIntent(body.message);
      planSource = "keyword";
      logger.info("Using keyword classifier fallback", { intent: plan.primaryIntent });
    }

    logger.info("Query plan", {
      source: planSource,
      intent: plan.primaryIntent,
      secondary: plan.secondaryIntent,
      names: plan.names,
      params: plan.parameters,
    });

    // Stage 2: Execute queries in parallel
    const queryFn = getQueryForIntent(plan.primaryIntent);
    const promises: Promise<unknown>[] = [queryFn(env.DB, plan.parameters)];

    // Entity search if names extracted
    if (plan.names.length > 0) {
      promises.push(searchEntities(env.DB, plan.names));
    } else {
      promises.push(Promise.resolve(null));
    }

    // Secondary query if specified
    if (plan.secondaryIntent) {
      const secondaryFn = getQueryForIntent(plan.secondaryIntent);
      promises.push(secondaryFn(env.DB, plan.parameters));
    } else {
      promises.push(Promise.resolve(null));
    }

    const [primaryResult, entityResult, secondaryResult] = await Promise.all(promises);

    // Stage 3: Format context
    const context = formatCombinedContext(
      primaryResult as import("../assistant/queries").QueryResult,
      entityResult as import("../assistant/entity-search").EntitySearchResult | null,
      secondaryResult as import("../assistant/queries").QueryResult | null
    );

    // Stage 4: Call answerer LLM (streaming)
    const stream = await callLLM(context, body.message, config);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (err) {
    logger.error("Assistant chat error", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return error(
      err instanceof Error ? err.message : "Assistant error",
      500
    );
  }
}
