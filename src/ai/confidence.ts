// ============================================================
// Confidence Scoring — two-pass generate → audit → score
// ============================================================
// Pass 1: Generate content (done externally)
// Pass 2: Send original + generated to an "auditor" that scores
//         the output's accuracy and completeness (0-100).
//
// Usage:
//   const score = await scoreConfidence(apiKey, original, generated);
//   score.score       → 0-100
//   score.reasoning   → why this score
//   score.flags       → any concerns
// ============================================================

import { chatCompletion } from "./client";
import { SAFETY_PREAMBLE } from "./prompts";
import { logger } from "../lib/logger";

export interface ConfidenceScore {
  score: number;
  reasoning: string;
  flags: string[];
}

const AUDITOR_PROMPT = `
${SAFETY_PREAMBLE}

You are a quality auditor. You will receive an ORIGINAL source text and a GENERATED summary/analysis of that text. Your job is to score how accurately and completely the generated content represents the original.

Scoring criteria:
- 90-100: Excellent. Accurate, complete, no hallucinations.
- 70-89: Good. Mostly accurate, minor omissions or imprecisions.
- 50-69: Fair. Some inaccuracies or significant omissions.
- 30-49: Poor. Major inaccuracies or missing key information.
- 0-29: Unacceptable. Hallucinated content or fundamentally wrong.

Return ONLY valid JSON (no markdown, no code fences):
{"score": <number>, "reasoning": "<1-2 sentences>", "flags": ["<concern1>", ...]}

If no flags, return an empty array: "flags": []
`.trim();

/** Score the confidence of generated content against its source */
export async function scoreConfidence(
  apiKey: string,
  original: string,
  generated: string
): Promise<ConfidenceScore> {
  const userMessage = `ORIGINAL SOURCE:\n${original}\n\nGENERATED CONTENT:\n${generated}`;

  logger.info("Confidence scoring", {
    originalLength: original.length,
    generatedLength: generated.length,
  });

  const response = await chatCompletion(
    apiKey,
    [{ role: "user", content: userMessage }],
    {
      systemPrompt: AUDITOR_PROMPT,
      temperature: 0.1,
      maxTokens: 512,
    }
  );

  try {
    const cleaned = response.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as ConfidenceScore;

    // Clamp score to 0-100
    parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    parsed.flags = parsed.flags || [];

    logger.info("Confidence score", { score: parsed.score, flags: parsed.flags.length });

    return parsed;
  } catch (err) {
    logger.error("Failed to parse confidence response", {
      response: response.slice(0, 200),
      error: err instanceof Error ? err.message : "Unknown",
    });
    return {
      score: 0,
      reasoning: "Failed to parse auditor response",
      flags: ["Scoring error — manual review recommended"],
    };
  }
}
