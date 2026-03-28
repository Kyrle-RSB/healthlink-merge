// ============================================================
// AI Attendant Assist — Real-time suggestions during live calls
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error } from "../lib/response";
import { parseBody } from "../lib/validate";
import { chatCompletion } from "../ai/client";
import { ATTENDANT_ASSIST_PROMPT } from "../ai/prompts";
import { queryPatientById, queryPatientConditions, queryPatientMedications } from "../db/queries-carepoint";
import { logger } from "../lib/logger";

export async function suggestHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody<{
    transcript: string;
    patient_id?: string;
    accumulated_transcript?: string;
  }>(request);

  if (!body.transcript) return error("transcript is required", 400);

  // Resolve API key from DB or env
  let apiKey = env.OPENAI_API_KEY;
  try {
    const dbConfig = await env.DB.prepare("SELECT config FROM integration_configs WHERE provider = 'openai'")
      .first<{ config: string }>();
    if (dbConfig) {
      const parsed = JSON.parse(dbConfig.config);
      if (parsed.api_key) apiKey = parsed.api_key;
    }
  } catch { /* use env */ }

  if (!apiKey) return error("No OpenAI API key configured", 503);

  // Build patient context if patient_id provided
  let patientContext = "";
  if (body.patient_id) {
    const patient = await queryPatientById(env.DB, body.patient_id);
    if (patient) {
      const [conditions, meds] = await Promise.all([
        queryPatientConditions(env.DB, patient.id),
        queryPatientMedications(env.DB, patient.id),
      ]);

      let barriers: string[] = [];
      try { barriers = patient.barriers ? JSON.parse(patient.barriers) : []; } catch { barriers = []; }

      patientContext = `
PATIENT CONTEXT:
Name: ${patient.first_name} ${patient.last_name}
Age: ${Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
Language: ${patient.language}
Family Doctor: ${patient.has_family_doctor ? "Yes" : "NO"}
Insurance: ${patient.has_insurance ? "Yes" : "NO"}
Barriers: ${barriers.join(", ") || "None"}
Active Conditions: ${conditions.filter(c => c.status === "active").map(c => `${c.description} (${c.code})`).join(", ") || "None on record"}
Current Medications: ${meds.map(m => `${m.description} ${m.dosage}`).join(", ") || "None on record"}
`;
    }
  }

  const userMessage = `
CALL TRANSCRIPT:
${body.accumulated_transcript || body.transcript}

LATEST SEGMENT:
${body.transcript}
${patientContext}
Analyze this call and provide suggestions for the intake attendant.
`.trim();

  try {
    const response = await chatCompletion(apiKey, [
      { role: "user", content: userMessage },
    ], {
      systemPrompt: ATTENDANT_ASSIST_PROMPT,
      model: "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 500,
    });

    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return success(parsed);
  } catch (err) {
    logger.error("Suggest error", { error: err instanceof Error ? err.message : "Unknown" });

    // Return rule-based fallback suggestions if AI fails
    return success(generateFallbackSuggestions(body.transcript));
  }
}

function generateFallbackSuggestions(transcript: string): Record<string, unknown> {
  const lower = transcript.toLowerCase();
  const suggestions: { type: string; text: string; priority: string }[] = [];
  const keywords: string[] = [];
  let urgency = "low";
  let destination = "clinic";

  // Emergency detection
  if (/chest pain|chest pressure|heart attack/.test(lower)) {
    keywords.push("chest pain");
    urgency = "critical";
    destination = "er";
    suggestions.push({ type: "escalate", text: "URGENT: Patient reports chest pain. Ask about arm numbness, shortness of breath, and sweating. If confirmed, escalate to clinical team immediately.", priority: "critical" });
    suggestions.push({ type: "ask", text: "Are you having any shortness of breath, arm numbness, or feeling sweaty right now?", priority: "critical" });
  }
  if (/can't breathe|cant breathe|breathing difficulty|shortness of breath/.test(lower)) {
    keywords.push("breathing difficulty");
    urgency = "high";
    destination = "er";
    suggestions.push({ type: "ask", text: "Do you have any chest pain or tightness? Have you had panic attacks before?", priority: "high" });
  }
  if (/suicid|kill myself|want to die|self.harm/.test(lower)) {
    keywords.push("suicidal ideation");
    urgency = "critical";
    destination = "mental_health_crisis";
    suggestions.push({ type: "escalate", text: "URGENT: Patient expressing suicidal thoughts. Stay on the line. Transfer to Crisis Care Centre immediately.", priority: "critical" });
  }

  // Standard intake questions
  if (suggestions.length === 0) {
    suggestions.push({ type: "ask", text: "Can you describe your pain on a scale of 1 to 10?", priority: "medium" });
    suggestions.push({ type: "ask", text: "How long have you been experiencing these symptoms?", priority: "medium" });
    suggestions.push({ type: "ask", text: "Do you have a family doctor or someone you see regularly?", priority: "medium" });
  }

  // Always add routing suggestion
  suggestions.push({ type: "route", text: `Recommended: ${destination.replace(/_/g, " ")}`, priority: urgency === "critical" ? "critical" : "high" });

  return { suggestions, detected_keywords: keywords, urgency, recommended_destination: destination };
}
