// ============================================================
// Agent types — interfaces for agentic orchestration
// ============================================================

/** Shared context passed between pipeline steps */
export interface AgentContext {
  /** Input that started the pipeline */
  input: string;
  /** Accumulated data from previous steps */
  data: Record<string, unknown>;
  /** Messages/log from each step */
  log: string[];
  /** Whether pipeline should halt */
  halted: boolean;
  /** Halt reason if stopped by safety guard */
  haltReason?: string;
}

/** A single step in the agent pipeline */
export interface AgentStep {
  name: string;
  description: string;
  execute(ctx: AgentContext): Promise<AgentContext>;
}

/** Result of a completed pipeline run */
export interface PipelineResult {
  success: boolean;
  output: unknown;
  log: string[];
  stepsCompleted: number;
  haltReason?: string;
}
