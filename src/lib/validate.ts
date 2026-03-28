// ============================================================
// Input validation — lightweight, no dependencies
// ============================================================

import { ValidationError } from "./errors";

/** Require fields exist on an object. Returns typed result. */
export function requireFields<T extends Record<string, unknown>>(
  input: unknown,
  fields: string[]
): T {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const obj = input as Record<string, unknown>;
  const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === "");

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
  }

  return obj as T;
}

/** Validate string length */
export function validateLength(
  value: string,
  field: string,
  min: number,
  max: number
): void {
  if (value.length < min || value.length > max) {
    throw new ValidationError(
      `${field} must be between ${min} and ${max} characters`
    );
  }
}

/** Validate email format (basic) */
export function validateEmail(email: string): void {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    throw new ValidationError("Invalid email format");
  }
}

/** Parse JSON body safely */
export async function parseBody<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
}

/** Parse URL query params into a plain object */
export function parseQuery(request: Request): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
