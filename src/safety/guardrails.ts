// ============================================================
// Safety Guardrails — PHI detection and data classification
// ============================================================
// IMPORTANT: This is a DEMO guardrail system for hackathons.
// It catches common patterns but is NOT a certified PHI filter.
// For production healthcare apps, use a validated PHI detection
// service (e.g., AWS Comprehend Medical, Azure Text Analytics).
// ============================================================

import { logger } from "../lib/logger";

/** Patterns that may indicate real PHI */
const PHI_PATTERNS = [
  // US Social Security Numbers
  /\b\d{3}-\d{2}-\d{4}\b/,
  // US Phone numbers (various formats)
  /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  // Email addresses (real-looking, not @example.com)
  /\b[A-Za-z0-9._%+-]+@(?!example\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  // Medical Record Numbers (MRN patterns)
  /\bMRN[:\s]?\d{6,}\b/i,
  // Date of birth patterns
  /\bDOB[:\s]?\d{1,2}\/\d{1,2}\/\d{2,4}\b/i,
  // US Medicare/Medicaid numbers
  /\b\d{1}[A-Za-z]{1}\d{1,2}-?\d{1,2}-?\d{1,2}-?\d{1,2}\b/,
  // IP addresses (could identify individuals)
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
];

/** Check if text contains patterns that look like real PHI */
export function containsPHIPatterns(text: string): boolean {
  for (const pattern of PHI_PATTERNS) {
    if (pattern.test(text)) {
      logger.warn("PHI pattern detected", { pattern: pattern.source });
      return true;
    }
  }
  return false;
}

/** Scrub detected PHI patterns from text (replace with [REDACTED]) */
export function scrubPHIPatterns(text: string): string {
  let scrubbed = text;
  for (const pattern of PHI_PATTERNS) {
    scrubbed = scrubbed.replace(new RegExp(pattern, "g"), "[REDACTED]");
  }
  return scrubbed;
}

/** Validate that data is explicitly marked as mock/synthetic */
export function assertMockData(data: unknown): void {
  const str = JSON.stringify(data);
  const hasMockIndicator =
    str.includes("MOCK") ||
    str.includes("SYNTHETIC") ||
    str.includes("SYN-") ||
    str.includes("mock") ||
    str.includes("example.com");

  if (!hasMockIndicator) {
    logger.warn("Data may not be mock — no mock indicators found");
  }
}

/** Safety classification levels */
export type SafetyLevel = "safe" | "caution" | "blocked";

/** Classify content safety level */
export function classifyContent(text: string): {
  level: SafetyLevel;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (containsPHIPatterns(text)) {
    reasons.push("Contains patterns matching real PHI");
    return { level: "blocked", reasons };
  }

  // Check for healthcare-sensitive keywords without mock markers
  const sensitiveTerms = ["diagnosis", "prescription", "patient name", "insurance id"];
  for (const term of sensitiveTerms) {
    if (text.toLowerCase().includes(term) && !text.includes("MOCK") && !text.includes("mock")) {
      reasons.push(`Contains sensitive term "${term}" without mock marker`);
    }
  }

  if (reasons.length > 0) {
    return { level: "caution", reasons };
  }

  return { level: "safe", reasons: [] };
}
