// ============================================================
// AI Assistant — Keyword Intent Classifier (No LLM Fallback)
// ============================================================
// Synchronous classification when the LLM planner fails.
// Adapted from bwhockey's classifier for healthcare domain.
// ============================================================

import type { QueryPlan } from "./planner";

interface IntentPattern {
  intent: string;
  exactPhrases: string[];
  keywords: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: "patient_lookup",
    exactPhrases: ["find patient", "patient profile", "who is", "tell me about", "patient details", "look up patient"],
    keywords: ["patient", "patients", "person", "profile", "demographics", "who"],
  },
  {
    intent: "facility_status",
    exactPhrases: ["facility status", "er load", "wait time", "what facilities", "hospital load", "which facilities"],
    keywords: ["facility", "facilities", "hospital", "clinic", "urgent care", "er", "emergency", "load", "wait", "capacity", "available", "open"],
  },
  {
    intent: "problem_info",
    exactPhrases: ["medical condition", "what conditions", "problem info", "ctas level", "what problems"],
    keywords: ["condition", "conditions", "problem", "problems", "symptoms", "diagnosis", "ctas", "severity", "icd", "medical"],
  },
  {
    intent: "routing_history",
    exactPhrases: ["routing history", "routing sessions", "recent routing", "what was routed", "routing decisions"],
    keywords: ["routing", "routed", "session", "sessions", "decision", "diverted", "reroute", "rerouted"],
  },
  {
    intent: "staff_lookup",
    exactPhrases: ["who is on duty", "staff on duty", "show staff", "list staff", "who works at"],
    keywords: ["staff", "doctor", "nurse", "physician", "provider", "on duty", "working", "employee"],
  },
  {
    intent: "encounter_history",
    exactPhrases: ["encounter history", "patient encounters", "visit history", "clinical history"],
    keywords: ["encounter", "encounters", "visit", "visits", "appointment", "appointments", "seen"],
  },
  {
    intent: "system_overview",
    exactPhrases: ["system overview", "overall status", "how is the system", "give me a summary", "dashboard"],
    keywords: ["overview", "summary", "overall", "system", "dashboard", "metrics", "stats", "statistics", "diversion"],
  },
  {
    intent: "medication_info",
    exactPhrases: ["medication list", "what medications", "current medications", "active medications", "drug info"],
    keywords: ["medication", "medications", "medicine", "drug", "drugs", "prescription", "prescribed", "dosage"],
  },
  {
    intent: "general_summary",
    exactPhrases: ["tell me everything", "what do you know", "full summary"],
    keywords: ["everything", "all", "general"],
  },
];

const STOP_WORDS = new Set([
  "i", "me", "my", "we", "our", "you", "your", "the", "a", "an", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
  "did", "will", "would", "could", "should", "may", "might", "can", "shall",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into",
  "about", "between", "through", "during", "before", "after", "above", "below",
  "and", "but", "or", "nor", "not", "so", "yet", "both", "each", "few", "more",
  "most", "other", "some", "such", "no", "only", "own", "same", "than", "too",
  "very", "just", "how", "what", "which", "who", "whom", "this", "that", "these",
  "those", "am", "if", "then", "because", "while", "where", "when", "why",
  "all", "any", "many", "much", "tell", "show", "give", "get", "find", "list",
  "look", "up", "me", "please", "thanks", "thank",
]);

/**
 * Classify intent using keyword matching (no LLM).
 * Fallback when the planner LLM fails.
 */
export function classifyIntent(message: string): QueryPlan {
  const lower = message.toLowerCase();

  // Check exact phrases first (high confidence)
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.exactPhrases.some((phrase) => lower.includes(phrase))) {
      return {
        primaryIntent: pattern.intent,
        parameters: extractParameters(lower),
        names: extractNames(message),
        reasoning: `Keyword match (exact phrase) → ${pattern.intent}`,
      };
    }
  }

  // Check keyword matches
  let bestMatch = { intent: "general_summary", score: 0 };
  for (const pattern of INTENT_PATTERNS) {
    const matches = pattern.keywords.filter((kw) => lower.includes(kw)).length;
    if (matches > bestMatch.score) {
      bestMatch = { intent: pattern.intent, score: matches };
    }
  }

  if (bestMatch.score >= 1) {
    return {
      primaryIntent: bestMatch.intent,
      parameters: extractParameters(lower),
      names: extractNames(message),
      reasoning: `Keyword match (${bestMatch.score} keywords) → ${bestMatch.intent}`,
    };
  }

  // Ultimate fallback
  return {
    primaryIntent: "general_summary",
    parameters: {},
    names: extractNames(message),
    reasoning: "No keyword match — falling back to general_summary",
  };
}

function extractParameters(lower: string): Record<string, string> {
  const params: Record<string, string> = {};

  if (lower.includes("no family doctor") || lower.includes("without a doctor") || lower.includes("no doctor")) {
    params.filter = "no_family_doctor";
  }
  if (lower.includes("no insurance") || lower.includes("uninsured")) {
    params.filter = "no_insurance";
  }
  if (lower.includes("active") && lower.includes("condition")) {
    params.filter = "active_conditions";
  }

  // Destination extraction
  const dests = ["er", "urgent_care", "clinic", "virtual", "pharmacy", "self_care", "mental_health_crisis"];
  for (const d of dests) {
    if (lower.includes(d.replace("_", " "))) {
      params.destination = d;
    }
  }

  // CTAS level
  const ctasMatch = lower.match(/ctas\s*(\d)/);
  if (ctasMatch) params.ctas_level = ctasMatch[1];

  return params;
}

function extractNames(message: string): string[] {
  const words = message.split(/\s+/);
  const names: string[] = [];

  for (const word of words) {
    const cleaned = word.replace(/[^a-zA-Z]/g, "");
    if (
      cleaned.length > 1 &&
      cleaned[0] === cleaned[0].toUpperCase() &&
      cleaned[0] !== cleaned[0].toLowerCase() &&
      !STOP_WORDS.has(cleaned.toLowerCase())
    ) {
      names.push(cleaned.toLowerCase());
    }
  }

  return names;
}
