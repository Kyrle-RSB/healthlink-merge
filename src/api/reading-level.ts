// ============================================================
// Reading Level endpoint — POST /api/ai/reading-level
// ============================================================
// Takes text content and returns it at 3 reading levels.
// Body: { "content": "...", "context": "optional domain context" }
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error } from "../lib/response";
import { parseBody, requireFields } from "../lib/validate";
import { generateMultiLevel } from "../ai/reading-level";

/** POST /api/ai/reading-level — generate multi-level output */
export async function readingLevelHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === "sk-your-key-here") {
    return error("OPENAI_API_KEY not configured. Add it to .dev.vars", 501);
  }

  const body = await parseBody(request);
  const { content } = requireFields<{ content: string; context?: string }>(body, ["content"]);
  const context = (body as Record<string, unknown>).context as string | undefined;

  const result = await generateMultiLevel(env.OPENAI_API_KEY, content, context);

  return success({
    levels: result,
    disclaimer: "MOCK/DEMO: Content generated for demonstration purposes only.",
  });
}
