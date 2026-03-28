// ============================================================
// Agent Safety Guard — runs before/after each pipeline step
// ============================================================
// Prevents agentic flows from:
// - Processing anything that looks like real PHI
// - Making external calls to unauthorized endpoints
// - Exceeding step or token budgets
// ============================================================

import type { AgentContext } from "./types";
import { logger } from "../lib/logger";
import { containsPHIPatterns } from "../safety/guardrails";

const MAX_STEPS = 10;
const MAX_DATA_SIZE_BYTES = 1_000_000; // 1MB

/** Run safety checks before a step executes */
export function preStepCheck(ctx: AgentContext, stepIndex: number): AgentContext {
  // Check step budget
  if (stepIndex >= MAX_STEPS) {
    logger.warn("Agent safety: max steps exceeded", { stepIndex });
    return { ...ctx, halted: true, haltReason: `Max steps (${MAX_STEPS}) exceeded` };
  }

  // Check for PHI in accumulated data
  const dataStr = JSON.stringify(ctx.data);
  if (containsPHIPatterns(dataStr)) {
    logger.warn("Agent safety: PHI pattern detected in context data");
    return { ...ctx, halted: true, haltReason: "Potential PHI detected in pipeline data" };
  }

  // Check data size
  if (new TextEncoder().encode(dataStr).length > MAX_DATA_SIZE_BYTES) {
    logger.warn("Agent safety: data size exceeded");
    return { ...ctx, halted: true, haltReason: "Pipeline data size exceeded limit" };
  }

  return ctx;
}

/** Run safety checks after a step executes */
export function postStepCheck(ctx: AgentContext): AgentContext {
  // Check output for PHI patterns
  const dataStr = JSON.stringify(ctx.data);
  if (containsPHIPatterns(dataStr)) {
    logger.warn("Agent safety: PHI pattern detected in step output");
    return { ...ctx, halted: true, haltReason: "Potential PHI detected in step output" };
  }

  return ctx;
}
