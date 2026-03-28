// ============================================================
// CarePoint Routing Engine — makes care destination decisions
// ============================================================
// NOT a diagnostic tool. Makes ROUTING decisions only.
// Hard rules for emergencies. AI-augmented for ambiguous cases.
// ============================================================

import type { Env, PatientContext, RoutingDecision, FacilityRow, AlternativeRoute, ChatMessage } from "../types";
import { queryFacilitiesByDestination } from "../db/queries-carepoint";
import { chatCompletion } from "../ai/client";
import { ROUTING_SYSTEM_PROMPT, buildConversationPrompt } from "../ai/prompts";
import { logger } from "../lib/logger";
import { calculateVitalScore, type VitalScoreResult } from "./vital-scoring";

/**
 * Make a routing decision based on patient context.
 * Safety-first: hard rules for emergencies, AI for ambiguous cases.
 */
export async function makeRoutingDecision(
  context: PatientContext,
  complaint: string,
  env: Env,
  conversationHistory?: ChatMessage[],
  previousSentiment?: string | null
): Promise<RoutingDecision> {
  // Step 1: Check hard rules (emergency red flags)
  const hardRule = checkHardRules(complaint, context);
  if (hardRule) {
    if (hardRule.type === "follow_up" && hardRule.followUpQuestion) {
      // Ask a clarifying question instead of routing immediately
      return {
        destination: "pending_follow_up",
        facility: null,
        confidence: 0.5,
        urgency: 0.7,
        reasoning: hardRule.followUpQuestion,
        clinical_reasoning: "Ambiguous emergency symptom detected — asking follow-up before routing",
        alternatives: [],
        wait_estimate_minutes: 0,
        reroute_eligible: false,
        sentiment: "cautious",
        follow_up_rule: hardRule.followUpRule,
      } as RoutingDecision & { follow_up_rule?: unknown };
    }
    if (hardRule.decision) {
      const facility = await findBestFacility(env.DB, hardRule.decision.destination, context);
      return {
        ...hardRule.decision,
        facility,
        alternatives: [],
        wait_estimate_minutes: facility?.wait_minutes ?? 0,
        reroute_eligible: false,
      };
    }
  }

  // Step 1b: Calculate vital triage score from observations
  const vitalScore = calculateVitalScore(
    complaint,
    context.observations,
    context.conditions,
    context.patient
  );
  logger.info("Vital triage score", {
    score: vitalScore.score,
    level: vitalScore.level,
    flags: vitalScore.flags,
  });

  // Step 1c: If vitals indicate Level 1-2 and hard rules didn't catch it, escalate to ER
  if (!hardRule && vitalScore.level <= 2) {
    const facility = await findBestFacility(env.DB, "er", context);
    return {
      destination: "er",
      facility,
      confidence: Math.min(0.8 + vitalScore.score / 500, 0.98),
      urgency: vitalScore.level === 1 ? 1.0 : 0.9,
      reasoning:
        "Your vital signs indicate this needs immediate emergency attention. Please call 911 or go to the nearest emergency room right away.",
      clinical_reasoning: `Vital triage score ${vitalScore.score} (Level ${vitalScore.level}). Flags: ${vitalScore.flags.join("; ")}`,
      alternatives: [],
      wait_estimate_minutes: facility?.wait_minutes ?? 0,
      reroute_eligible: false,
      sentiment: "urgent",
    };
  }

  // Step 2: If we have matched problems from FTS, use the highest severity match
  if (context.matchedProblems.length > 0) {
    const bestMatch = context.matchedProblems[0];
    const destination = bestMatch.recommended_destination;

    // For CTAS 1-2 matched problems, go straight to ER
    if (bestMatch.ctas_level <= 2) {
      const facility = await findBestFacility(env.DB, "er", context);
      return {
        destination: "er",
        facility,
        confidence: 0.95,
        urgency: bestMatch.severity / 5,
        reasoning: `Your symptoms match a condition that needs immediate emergency care. Please go to ${facility?.name || "the nearest ER"} right away.`,
        clinical_reasoning: `Matched: ${bestMatch.title} (${bestMatch.icd10_code}), CTAS ${bestMatch.ctas_level}, severity ${bestMatch.severity}/5`,
        alternatives: [],
        wait_estimate_minutes: facility?.wait_minutes ?? 0,
        reroute_eligible: false,
        sentiment: "urgent",
      };
    }

    // For CTAS 3-5, use AI to refine the routing with context
    const aiDecision = await getAIRoutingDecision(complaint, context, env, conversationHistory, previousSentiment);
    if (aiDecision) {
      const facility = await findBestFacility(env.DB, aiDecision.destination, context);
      const alternatives = await findAlternatives(env.DB, aiDecision.destination, context);
      return {
        ...aiDecision,
        facility,
        alternatives,
        wait_estimate_minutes: facility?.wait_minutes ?? 0,
        reroute_eligible: bestMatch.ctas_level >= 4,
      };
    }

    // Fallback: use the problem's recommended destination directly
    const facility = await findBestFacility(env.DB, destination, context);
    const alternatives = await findAlternatives(env.DB, destination, context);
    return {
      destination,
      facility,
      confidence: 0.7,
      urgency: bestMatch.severity / 5,
      reasoning: `Based on your symptoms, ${formatDestination(destination)} would be the best place for you. ${facility ? `${facility.name} can see you with about a ${facility.wait_minutes}-minute wait.` : ""}`,
      clinical_reasoning: `FTS match: ${bestMatch.title} (${bestMatch.icd10_code}), recommended ${destination}`,
      alternatives,
      wait_estimate_minutes: facility?.wait_minutes ?? 0,
      reroute_eligible: bestMatch.ctas_level >= 4,
      sentiment: "neutral",
    };
  }

  // Step 3: No problem match — use AI to route from complaint text alone
  const aiDecision = await getAIRoutingDecision(complaint, context, env, conversationHistory, previousSentiment);
  if (aiDecision) {
    // Enhance AI decision with vital score data
    const enhanced = applyVitalScoreBoost(aiDecision, vitalScore);
    const facility = await findBestFacility(env.DB, enhanced.destination, context);
    const alternatives = await findAlternatives(env.DB, enhanced.destination, context);
    return {
      ...enhanced,
      facility,
      alternatives,
      wait_estimate_minutes: facility?.wait_minutes ?? 0,
      reroute_eligible: vitalScore.level >= 4,
    };
  }

  // Step 4: Ultimate fallback — suggest urgent care (safe middle ground)
  // Boost urgency if vital score warrants it
  const fallbackUrgency = vitalScore.level <= 3 ? Math.max(0.5, vitalScore.score / 100) : 0.5;
  const facility = await findBestFacility(env.DB, "urgent_care", context);
  return {
    destination: "urgent_care",
    facility,
    confidence: 0.4,
    urgency: fallbackUrgency,
    reasoning: "I want to make sure you get the right care. Based on what you've described, I'd recommend visiting an urgent care centre where they can properly assess your situation.",
    clinical_reasoning: `No confident match — defaulting to urgent care for safety. Vital score: ${vitalScore.score} (Level ${vitalScore.level})`,
    alternatives: await findAlternatives(env.DB, "urgent_care", context),
    wait_estimate_minutes: facility?.wait_minutes ?? 0,
    reroute_eligible: true,
    sentiment: vitalScore.level <= 3 ? "cautious" : "neutral",
  };
}

// ---- Vital Score Boost ----

/**
 * Enhance a routing decision using objective vital triage data.
 * If vital score suggests higher urgency than text analysis, boost
 * confidence and urgency. If vitals say Level 3 but AI routed to
 * self_care/pharmacy, escalate to urgent_care.
 */
function applyVitalScoreBoost(
  decision: Omit<RoutingDecision, "facility" | "alternatives" | "wait_estimate_minutes" | "reroute_eligible">,
  vitalScore: VitalScoreResult
): Omit<RoutingDecision, "facility" | "alternatives" | "wait_estimate_minutes" | "reroute_eligible"> {
  // No vitals data — return as-is
  if (vitalScore.flags.length === 0) return decision;

  const result = { ...decision };

  // Escalate low-acuity destinations when vitals indicate Level 3
  if (
    vitalScore.level <= 3 &&
    (decision.destination === "self_care" ||
      decision.destination === "pharmacy" ||
      decision.destination === "virtual")
  ) {
    result.destination = "urgent_care";
    result.clinical_reasoning += ` | Vital score escalation: score ${vitalScore.score} (Level ${vitalScore.level}) overrides ${decision.destination}`;
  }

  // Boost confidence when vitals corroborate the routing
  const vitalUrgency = Math.min(vitalScore.score / 100, 1);
  if (vitalUrgency > result.urgency) {
    result.urgency = Math.round(((result.urgency + vitalUrgency) / 2) * 100) / 100;
  }

  // Bump confidence slightly when we have supporting vital data
  result.confidence = Math.min(result.confidence + 0.05, 1);

  return result;
}

// ---- Hard Rules (never bypassed) ----

// Hard rules: some are instant ER, others ask a follow-up first
const INSTANT_ER_KEYWORDS = [
  { keywords: ["chest pain", "chest pressure", "heart attack", "crushing chest"], destination: "er" as const },
  { keywords: ["stroke", "face drooping", "arm weakness", "speech slur", "sudden confusion"], destination: "er" as const },
  { keywords: ["seizure", "convulsion", "fitting"], destination: "er" as const },
  { keywords: ["overdose", "poisoning", "took too many", "swallowed"], destination: "er" as const },
  { keywords: ["severe bleeding", "wont stop bleeding", "won't stop bleeding", "blood everywhere"], destination: "er" as const },
  { keywords: ["unconscious", "not breathing", "unresponsive", "passed out and not waking"], destination: "er" as const },
  { keywords: ["blue lips", "gasping", "choking"], destination: "er" as const },
  { keywords: ["anaphylaxis", "throat closing", "tongue swelling", "epipen", "severe allergic"], destination: "er" as const },
  { keywords: ["coughing blood", "vomiting blood", "blood in vomit"], destination: "er" as const },
  { keywords: ["sudden vision loss", "sudden blindness", "can't see"], destination: "er" as const },
  { keywords: ["labour", "labor", "water broke", "contractions", "pregnancy bleeding"], destination: "er" as const },
  { keywords: ["suicidal", "want to die", "kill myself", "self harm", "self-harm", "ending it"], destination: "mental_health_crisis" as const },
  { keywords: ["hearing voices", "hallucinating", "psychosis", "seeing things that aren't there"], destination: "mental_health_crisis" as const },
  { keywords: ["haven't slept in days", "not eating for days", "can't stop crying"], destination: "mental_health_crisis" as const },
];

// These keywords trigger a follow-up question before routing — could be emergency OR not
const FOLLOW_UP_KEYWORDS = [
  {
    keywords: ["cant breathe", "can't breathe", "cannot breathe", "difficulty breathing", "hard to breathe"],
    softeners: ["panic", "anxiety", "anxious", "panic attack", "stressed", "hyperventilat"],
    followUpQuestion: "I want to make sure you're safe. Are you having any chest pain, arm numbness, or blue lips right now?",
    ifConfirmed: "er" as const,
    ifDenied: "mental_health_crisis" as const,
    deniedReasoning: "It sounds like this might be a panic attack, which is very real and very scary. The Crisis Care Centre specializes in exactly this and can help you right now.",
  },
  {
    keywords: ["worst headache", "severe headache", "thunderclap headache"],
    softeners: ["migraine", "tension", "stress headache", "had these before"],
    followUpQuestion: "I need to check something important. Did this headache come on very suddenly — like the worst headache of your life — and do you have any neck stiffness or vision changes?",
    ifConfirmed: "er" as const,
    ifDenied: "urgent_care" as const,
    deniedReasoning: "That sounds like it could be a severe migraine or tension headache. An urgent care centre can help manage the pain and check for anything more serious.",
  },
  {
    keywords: ["passed out", "passing out", "fainted", "fainting"],
    softeners: ["stood up too fast", "dehydrated", "skipped meals", "low blood sugar"],
    followUpQuestion: "Did you hit your head when you fell, or did you lose consciousness for more than a few seconds?",
    ifConfirmed: "er" as const,
    ifDenied: "urgent_care" as const,
    deniedReasoning: "A brief fainting episode without head injury should still be checked out. An urgent care centre can run the right tests.",
  },
  {
    keywords: ["fell down", "had a fall", "tripped and fell", "fell and hurt"],
    softeners: ["minor", "just a bruise", "small scrape", "fine now"],
    followUpQuestion: "Are you able to put weight on the injured area? Do you have any dizziness, confusion, or are you taking blood thinners?",
    ifConfirmed: "er" as const,
    ifDenied: "urgent_care" as const,
    deniedReasoning: "Falls should be properly assessed to rule out fractures or other injuries. An urgent care centre can do X-rays and a thorough check.",
  },
];

export interface HardRuleResult {
  type: "instant" | "follow_up";
  decision?: Omit<RoutingDecision, "facility" | "alternatives" | "wait_estimate_minutes" | "reroute_eligible">;
  followUpQuestion?: string;
  followUpRule?: typeof FOLLOW_UP_KEYWORDS[0];
}

function checkHardRules(
  complaint: string,
  _context: PatientContext
): HardRuleResult | null {
  const lower = complaint.toLowerCase();

  // Check instant rules first (always route immediately)
  for (const rule of INSTANT_ER_KEYWORDS) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const isMentalHealth = rule.destination === "mental_health_crisis";
      return {
        type: "instant",
        decision: {
          destination: rule.destination,
          confidence: 0.95,
          urgency: 1.0,
          reasoning: isMentalHealth
            ? "I hear you, and I want you to know that help is available right now. The Crisis Care Centre has people who specialize in exactly this — they can see you quickly and in a safe, private setting."
            : "Based on what you're describing, this needs immediate emergency attention. Please call 911 or go to the nearest emergency room right away.",
          clinical_reasoning: `Hard rule triggered: "${rule.keywords.find((kw) => lower.includes(kw))}" detected`,
          sentiment: isMentalHealth ? "compassionate" : "urgent",
        },
      };
    }
  }

  // Check follow-up rules (ask before routing)
  for (const rule of FOLLOW_UP_KEYWORDS) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      // If patient already mentioned a softener, skip the follow-up and route appropriately
      if (rule.softeners.some((s) => lower.includes(s))) {
        return {
          type: "instant",
          decision: {
            destination: rule.ifDenied,
            confidence: 0.85,
            urgency: 0.6,
            reasoning: rule.deniedReasoning,
            clinical_reasoning: `Follow-up rule matched with softener — routing to ${rule.ifDenied}`,
            sentiment: "compassionate",
          },
        };
      }

      // Need to ask follow-up
      return {
        type: "follow_up",
        followUpQuestion: rule.followUpQuestion,
        followUpRule: rule,
      };
    }
  }

  return null;
}

/**
 * Evaluate a follow-up answer. Returns routing decision.
 */
export function evaluateFollowUp(
  answer: string,
  rule: typeof FOLLOW_UP_KEYWORDS[0]
): Omit<RoutingDecision, "facility" | "alternatives" | "wait_estimate_minutes" | "reroute_eligible"> {
  const lower = answer.toLowerCase();
  const confirmsEmergency = ["yes", "yeah", "yep", "i do", "i am", "it is", "affirmative"].some((w) => lower.includes(w))
    && !["no", "not", "don't", "dont", "nope"].some((w) => lower.startsWith(w));
  const deniesEmergency = ["no", "nope", "not", "don't", "dont", "i don't", "no chest", "no pain", "no numbness"].some((w) => lower.includes(w));

  if (deniesEmergency || !confirmsEmergency) {
    return {
      destination: rule.ifDenied,
      confidence: 0.85,
      urgency: 0.5,
      reasoning: rule.deniedReasoning,
      clinical_reasoning: `Follow-up answer suggests non-emergency → ${rule.ifDenied}`,
      sentiment: "compassionate",
    };
  }

  return {
    destination: rule.ifConfirmed,
    confidence: 0.95,
    urgency: 1.0,
    reasoning: "Based on your answer, this needs emergency attention. Please call 911 or go to the nearest emergency room right away.",
    clinical_reasoning: `Follow-up answer confirms emergency → ${rule.ifConfirmed}`,
    sentiment: "urgent",
  };
}

// ---- AI-Augmented Routing ----

async function getAIRoutingDecision(
  complaint: string,
  context: PatientContext,
  env: Env,
  conversationHistory?: ChatMessage[],
  previousSentiment?: string | null
): Promise<Omit<RoutingDecision, "facility" | "alternatives" | "wait_estimate_minutes" | "reroute_eligible"> | null> {
  if (!env.OPENAI_API_KEY) return null;

  // Build context summary for AI
  const contextSummary = buildContextSummary(context);

  // Build facility availability summary
  const facilitySummary = context.systemState
    .filter((s) => s.facility.accepting_patients)
    .map((s) => `${s.facility.name} (${s.facility.type}): ${s.wait_minutes}min wait, ${s.load_pct}% load`)
    .join("\n");

  // Multi-turn: use conversation-aware prompt if we have history
  const isMultiTurn = conversationHistory && conversationHistory.length > 2;

  const userMessage = `
PATIENT COMPLAINT: "${complaint}"

${contextSummary}

AVAILABLE FACILITIES:
${facilitySummary}

Based on this information, make a routing decision. Return ONLY valid JSON.
`.trim();

  const systemPrompt = isMultiTurn
    ? buildConversationPrompt(
        conversationHistory!.map((m) => ({ role: m.role, content: m.content })),
        previousSentiment || null
      )
    : ROUTING_SYSTEM_PROMPT;

  try {
    const response = await chatCompletion(env.OPENAI_API_KEY, [
      { role: "user", content: userMessage },
    ], {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 500,
    });

    const parsed = JSON.parse(response);
    return {
      destination: parsed.destination || "urgent_care",
      confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      urgency: Math.min(Math.max(parsed.urgency || 0.5, 0), 1),
      reasoning: parsed.reasoning || "Based on your situation, I recommend seeking care.",
      clinical_reasoning: parsed.clinical_reasoning || "AI routing decision",
      sentiment: parsed.sentiment || "neutral",
    };
  } catch (err) {
    logger.error("AI routing failed", { error: err instanceof Error ? err.message : "Unknown" });
    return null;
  }
}

function buildContextSummary(context: PatientContext): string {
  const parts: string[] = [];

  if (context.patient) {
    const p = context.patient;
    const age = Math.floor(
      (Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    parts.push(`PATIENT: ${p.first_name}, ${age}yo ${p.gender}, language: ${p.language}`);
    if (!p.has_family_doctor) parts.push("- No family doctor");
    if (!p.has_insurance) parts.push("- No health insurance");
    if (context.barriers.length > 0) parts.push(`- Barriers: ${context.barriers.join(", ")}`);
  }

  if (context.conditions.length > 0) {
    parts.push(
      `ACTIVE CONDITIONS: ${context.conditions.filter((c) => c.status === "active").map((c) => c.description).join(", ")}`
    );
  }

  if (context.medications.length > 0) {
    parts.push(
      `CURRENT MEDICATIONS: ${context.medications.map((m) => `${m.description} ${m.dosage}`).join(", ")}`
    );
  }

  if (context.matchedProblems.length > 0) {
    parts.push(
      `SYMPTOM MATCHES: ${context.matchedProblems.map((p) => `${p.title} (CTAS ${p.ctas_level}, recommended: ${p.recommended_destination})`).join("; ")}`
    );
  }

  return parts.join("\n");
}

// ---- Facility Selection ----

async function findBestFacility(
  db: D1Database,
  destination: string,
  context: PatientContext
): Promise<FacilityRow | null> {
  const facilities = await queryFacilitiesByDestination(db, destination);
  if (facilities.length === 0) return null;

  // Sort by wait time (already done in query), pick first accepting
  // Boost Indigenous health centres for patients with trust_deficit or jurisdictional_complexity barriers
  if (context.barriers.some((b) => b === "trust_deficit" || b === "jurisdictional_complexity")) {
    const indigenous = facilities.find((f) => f.type === "indigenous_health");
    if (indigenous) return indigenous;
  }

  // Boost community health for patients with barriers (language, insurance, newcomer)
  if (destination === "clinic" && context.barriers.length > 0) {
    const communityHealth = facilities.find((f) => f.type === "community_health");
    if (communityHealth) return communityHealth;
  }

  // Boost facilities with NP services for non-acute conditions (NPs can handle most clinic-level issues)
  if (destination === "clinic" || destination === "virtual") {
    const withNP = facilities.find((f) => {
      try {
        const services = JSON.parse(f.services);
        return services.includes("primary_care") || services.includes("chronic_disease");
      } catch { return false; }
    });
    if (withNP) return withNP;
  }

  return facilities[0];
}

async function findAlternatives(
  db: D1Database,
  primaryDestination: string,
  context: PatientContext
): Promise<AlternativeRoute[]> {
  const alternatives: AlternativeRoute[] = [];

  // Suggest adjacent destinations
  const adjacentMap: Record<string, string[]> = {
    er: ["urgent_care"],
    urgent_care: ["clinic", "er"],
    clinic: ["virtual", "urgent_care"],
    virtual: ["clinic", "pharmacy"],
    pharmacy: ["virtual", "self_care"],
    mental_health_crisis: ["virtual"],
    self_care: ["pharmacy", "virtual"],
  };

  const adjacent = adjacentMap[primaryDestination] || [];
  for (const dest of adjacent.slice(0, 2)) {
    const facilities = await queryFacilitiesByDestination(db, dest);
    if (facilities.length > 0) {
      alternatives.push({
        destination: dest,
        facility: facilities[0],
        reasoning: `${facilities[0].name} is also an option (${facilities[0].wait_minutes}min wait)`,
        wait_estimate_minutes: facilities[0].wait_minutes,
      });
    }
  }

  return alternatives;
}

function formatDestination(dest: string): string {
  const labels: Record<string, string> = {
    er: "an emergency room",
    urgent_care: "an urgent care centre",
    clinic: "a walk-in clinic",
    virtual: "a virtual care appointment",
    pharmacy: "a pharmacy consultation",
    self_care: "self-care at home",
    mental_health_crisis: "the Crisis Care Centre",
  };
  return labels[dest] || dest;
}

/** Safety disclaimer appended to non-ER routing responses */
export const SAFETY_DISCLAIMER = "\n\nImportant: If your symptoms get worse or you develop chest pain, difficulty breathing, or feel you are in danger at any time, please call 911 or go to your nearest emergency room immediately.";
