// ============================================================
// Token management — JWT-like tokens via KV
// ============================================================
// Uses HMAC-SHA256 for signing. Tokens stored in KV with TTL.
// For hackathon speed — not a production auth system.
// ============================================================

import type { AuthUser } from "../types";
import { kvGet, kvSet, kvDelete } from "../storage/kv";

const TOKEN_TTL = 60 * 60 * 24; // 24 hours

/** Generate a signed token and store in KV */
export async function createToken(
  kv: KVNamespace,
  user: AuthUser,
  secret: string
): Promise<string> {
  const payload = {
    ...user,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL * 1000,
  };

  const token = await sign(JSON.stringify(payload), secret);
  const tokenKey = `token:${token}`;

  // Store in KV with TTL for automatic expiry
  await kvSet(kv, tokenKey, payload, TOKEN_TTL);

  return token;
}

/** Verify a token exists in KV and return user */
export async function verifyToken(
  kv: KVNamespace,
  token: string
): Promise<AuthUser | null> {
  const tokenKey = `token:${token}`;
  const payload = await kvGet<AuthUser & { exp: number }>(kv, tokenKey);

  if (!payload) return null;
  if (payload.exp && payload.exp < Date.now()) {
    await kvDelete(kv, tokenKey);
    return null;
  }

  return { id: payload.id, email: payload.email, role: payload.role };
}

/** Revoke a token */
export async function revokeToken(
  kv: KVNamespace,
  token: string
): Promise<void> {
  await kvDelete(kv, `token:${token}`);
}

/** HMAC-SHA256 sign */
async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Simple password hash (SHA-256) — adequate for hackathon, not production */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
