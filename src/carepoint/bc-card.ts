// ============================================================
// BC Services Card Validation
// ============================================================

/**
 * Validate BC Services Card number format.
 * Format: 4 digits, space, 3 digits, space, 3 digits (e.g., "9453 449 847")
 * Also accepts without spaces: "9453449847"
 * Also accepts dashes: "9453-449-847"
 */
export function validateBCServicesCard(cardNumber: string): { valid: boolean; formatted: string | null } {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  if (!/^\d{10}$/.test(cleaned)) return { valid: false, formatted: null };
  const formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
  return { valid: true, formatted };
}
