// ============================================================
// AI Assistant — LLM Query Planner
// ============================================================
// Converts natural language questions into structured query plans.
// Adapted from bwhockey's planner pattern for healthcare domain.
// ============================================================

import { chatCompletion } from "../ai/client";
import { SAFETY_PREAMBLE } from "../ai/prompts";
import { logger } from "../lib/logger";

export interface QueryPlan {
  primaryIntent: string;
  secondaryIntent?: string;
  parameters: Record<string, string>;
  names: string[];
  reasoning: string;
}

const PLANNER_PROMPT = `
${SAFETY_PREAMBLE}

You are a query planner for a healthcare navigation system called SILA.
Given a user question, determine which data query to run.

AVAILABLE INTENTS:
- patient_lookup: Find patients by name, ID, or filter (e.g. no family doctor, no insurance, specific condition)
- facility_status: Current facility loads, wait times, availability, capacity
- problem_info: Medical condition details, CTAS levels, severity, recommended destinations, symptoms
- routing_history: Recent routing sessions, decisions made, outcomes, reroutes
- staff_lookup: Staff members by facility, role, department, on-duty status
- encounter_history: Patient encounters, clinical visits, provider interactions
- system_overview: Aggregate metrics — ER loads, diversion rate, patient counts, facility counts
- medication_info: Active medications across patients, dosages, frequencies
- general_summary: High-level snapshot of everything in the system

PARAMETER EXTRACTION:
- patient_name: If user mentions a specific person name
- patient_id: If user mentions SYN-PAT-XXX
- facility_name: If user mentions a specific facility
- facility_type: hospital, urgent_care, clinic, telehealth, pharmacy, mental_health_crisis, etc.
- condition: Specific medical condition or ICD-10 code
- destination: er, urgent_care, clinic, virtual, pharmacy, self_care, mental_health_crisis
- ctas_level: 1-5
- filter: no_family_doctor, no_insurance, has_barriers, active_conditions
- status: active, completed, rerouted

NAME EXTRACTION:
- Extract any person names mentioned (first name, last name, or both)
- Return as lowercase array

OUTPUT FORMAT (strict JSON, no markdown):
{
  "primaryIntent": "intent_name",
  "secondaryIntent": "optional_second_intent",
  "parameters": { "key": "value" },
  "names": ["name1", "name2"],
  "reasoning": "brief explanation"
}
`.trim();

/**
 * Use LLM to generate a structured query plan from a natural language question.
 * Returns null if planning fails (triggers keyword classifier fallback).
 */
export async function generateQueryPlan(
  message: string,
  apiKey: string
): Promise<QueryPlan | null> {
  try {
    const response = await chatCompletion(apiKey, [
      { role: "user", content: message },
    ], {
      systemPrompt: PLANNER_PROMPT,
      model: "gpt-4o-mini",
      temperature: 0,
      maxTokens: 200,
    });

    // Strip markdown fences if present
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.primaryIntent || typeof parsed.primaryIntent !== "string") {
      return null;
    }

    return {
      primaryIntent: parsed.primaryIntent,
      secondaryIntent: parsed.secondaryIntent || undefined,
      parameters: parsed.parameters || {},
      names: (parsed.names || []).map((n: string) => n.toLowerCase()),
      reasoning: parsed.reasoning || "",
    };
  } catch (err) {
    logger.error("Query planner failed", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }
}
