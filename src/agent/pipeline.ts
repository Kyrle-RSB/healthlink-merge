// ============================================================
// Agent Pipeline — step-based orchestration executor
// ============================================================
// Usage:
//   const pipeline = new AgentPipeline();
//   pipeline.addStep(retrieveStep);
//   pipeline.addStep(analyzeStep);
//   pipeline.addStep(respondStep);
//   const result = await pipeline.execute("What are the trends?");
// ============================================================

import type { AgentContext, AgentStep, PipelineResult } from "./types";
import { preStepCheck, postStepCheck } from "./safety";
import { logger } from "../lib/logger";

export class AgentPipeline {
  private steps: AgentStep[] = [];

  /** Add a step to the pipeline */
  addStep(step: AgentStep): AgentPipeline {
    this.steps.push(step);
    return this;
  }

  /** Execute the pipeline with input */
  async execute(input: string): Promise<PipelineResult> {
    let ctx: AgentContext = {
      input,
      data: {},
      log: [],
      halted: false,
    };

    logger.info("Pipeline started", { input: input.slice(0, 100), steps: this.steps.length });

    let stepsCompleted = 0;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      // Pre-step safety check
      ctx = preStepCheck(ctx, i);
      if (ctx.halted) {
        logger.warn("Pipeline halted by pre-step safety", { step: step.name, reason: ctx.haltReason });
        break;
      }

      // Execute step
      try {
        logger.debug("Step executing", { name: step.name, index: i });
        ctx.log.push(`[Step ${i + 1}] ${step.name}: started`);
        ctx = await step.execute(ctx);
        ctx.log.push(`[Step ${i + 1}] ${step.name}: completed`);
        stepsCompleted++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        ctx.log.push(`[Step ${i + 1}] ${step.name}: FAILED — ${message}`);
        logger.error("Step failed", { step: step.name, error: message });
        ctx.halted = true;
        ctx.haltReason = `Step "${step.name}" failed: ${message}`;
        break;
      }

      // Post-step safety check
      ctx = postStepCheck(ctx);
      if (ctx.halted) {
        logger.warn("Pipeline halted by post-step safety", { step: step.name, reason: ctx.haltReason });
        break;
      }
    }

    logger.info("Pipeline finished", { stepsCompleted, halted: ctx.halted });

    return {
      success: !ctx.halted,
      output: ctx.data.output || ctx.data,
      log: ctx.log,
      stepsCompleted,
      haltReason: ctx.haltReason,
    };
  }
}
