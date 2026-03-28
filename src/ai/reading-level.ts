// ============================================================
// Multi-Reading-Level Output — "Simplify" / "Standard" / "Detailed"
// ============================================================
// Generates the same content at three reading levels in one pass.
// Great for accessibility, patient-facing UIs, or education apps.
//
// Usage:
//   const result = await generateMultiLevel(apiKey, content);
//   result.simple   → plain language, 5th grade reading level
//   result.standard → normal professional language
//   result.detailed → technical/clinical detail
// ============================================================

import { chatCompletion } from "./client";
import { SAFETY_PREAMBLE } from "./prompts";
import { logger } from "../lib/logger";

export interface MultiLevelResult {
  simple: string;
  standard: string;
  detailed: string;
}

const MULTI_LEVEL_PROMPT = `
${SAFETY_PREAMBLE}

You are a content translator that rewrites text at three reading levels.
Given the input text, produce three versions:

1. **simple**: Plain language a 10-year-old could understand. Short sentences, no jargon, use analogies.
2. **standard**: Professional but accessible language. A typical adult can follow without specialized knowledge.
3. **detailed**: Expert-level with full technical terminology, nuance, and supporting details.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{"simple": "...", "standard": "...", "detailed": "..."}
`.trim();

/** Generate content at three reading levels */
export async function generateMultiLevel(
  apiKey: string,
  content: string,
  context?: string
): Promise<MultiLevelResult> {
  const userMessage = context
    ? `Context: ${context}\n\nContent to rewrite:\n${content}`
    : `Content to rewrite:\n${content}`;

  logger.info("Multi-level generation", { contentLength: content.length });

  const response = await chatCompletion(
    apiKey,
    [{ role: "user", content: userMessage }],
    {
      systemPrompt: MULTI_LEVEL_PROMPT,
      temperature: 0.3,
      maxTokens: 2048,
    }
  );

  try {
    // Strip markdown code fences if present
    const cleaned = response.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as MultiLevelResult;

    if (!parsed.simple || !parsed.standard || !parsed.detailed) {
      throw new Error("Missing required fields in response");
    }

    return parsed;
  } catch (err) {
    logger.error("Failed to parse multi-level response", {
      response: response.slice(0, 200),
      error: err instanceof Error ? err.message : "Unknown",
    });
    // Fallback: return the raw response as standard level
    return {
      simple: content,
      standard: response,
      detailed: content,
    };
  }
}
