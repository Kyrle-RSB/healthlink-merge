// ============================================================
// Confidence endpoint — POST /api/ai/confidence
// ============================================================
// Scores AI-generated content against its source.
// Body: { "original": "source text", "generated": "AI output" }
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error } from "../lib/response";
import { parseBody, requireFields } from "../lib/validate";
import { scoreConfidence } from "../ai/confidence";

/** POST /api/ai/confidence — score generated content */
export async function confidenceHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === "sk-your-key-here") {
    return error("OPENAI_API_KEY not configured. Add it to .dev.vars", 501);
  }

  const body = await parseBody(request);
  const { original, generated } = requireFields<{
    original: string;
    generated: string;
  }>(body, ["original", "generated"]);

  const result = await scoreConfidence(env.OPENAI_API_KEY, original, generated);

  return success({
    ...result,
    disclaimer: "MOCK/DEMO: Confidence score is for demonstration purposes only.",
  });
}
