// ============================================================
// Example Agent Steps — plug these into a pipeline
// ============================================================
// These are templates. In a hackathon, duplicate and modify.
// ============================================================

import type { AgentStep, AgentContext } from "./types";
import type { Env } from "../types";
import { createOrchestrator } from "../retrieval/orchestrator";
import { chatCompletion } from "../ai/client";
import { buildRAGPrompt, SUMMARIZE_PROMPT } from "../ai/prompts";

/** Step: Retrieve relevant records from the retrieval layer */
export function createRetrieveStep(env: Env): AgentStep {
  return {
    name: "retrieve",
    description: "Search for relevant records based on user input",
    async execute(ctx: AgentContext): Promise<AgentContext> {
      const orchestrator = createOrchestrator(env.DB, env.R2);
      const results = await orchestrator.query({
        text: ctx.input,
        limit: 5,
      });
      ctx.data.retrievalResults = results;
      ctx.data.retrievalCount = results.length;
      return ctx;
    },
  };
}

/** Step: Generate AI response using retrieved context */
export function createAIResponseStep(env: Env): AgentStep {
  return {
    name: "ai-response",
    description: "Generate AI response using retrieval context",
    async execute(ctx: AgentContext): Promise<AgentContext> {
      const results = (ctx.data.retrievalResults as { content: string; metadata: Record<string, unknown> }[]) || [];

      const prompt = buildRAGPrompt(ctx.input, results);

      const response = await chatCompletion(
        env.OPENAI_API_KEY,
        [{ role: "user", content: prompt }],
        { systemPrompt: SUMMARIZE_PROMPT }
      );

      ctx.data.output = response;
      return ctx;
    },
  };
}

/** Step: Format output for presentation */
export const formatOutputStep: AgentStep = {
  name: "format",
  description: "Format the pipeline output for the API response",
  async execute(ctx: AgentContext): Promise<AgentContext> {
    ctx.data.output = {
      answer: ctx.data.output,
      sourcesUsed: ctx.data.retrievalCount || 0,
      disclaimer: "This response is based on MOCK/SYNTHETIC data for demonstration only.",
    };
    return ctx;
  },
};
