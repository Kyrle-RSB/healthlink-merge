// ============================================================
// Auth handlers — login and register endpoints
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error } from "../lib/response";
import { parseBody, requireFields, validateEmail } from "../lib/validate";
import { findUserByEmail, createUser } from "../db/queries";
import { createToken, hashPassword } from "./tokens";

/** POST /api/auth/login */
export async function loginHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody(request);
  const { email, password } = requireFields<{ email: string; password: string }>(
    body,
    ["email", "password"]
  );

  const user = await findUserByEmail(env.DB, email);
  if (!user) return error("Invalid credentials", 401);

  const hash = await hashPassword(password);
  if (hash !== user.password_hash) return error("Invalid credentials", 401);

  const token = await createToken(
    env.KV,
    { id: user.id, email: user.email, role: user.role },
    env.AUTH_SECRET
  );

  return success({ token, user: { id: user.id, email: user.email, role: user.role } });
}

/** POST /api/auth/register */
export async function registerHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const body = await parseBody(request);
  const { email, password } = requireFields<{ email: string; password: string }>(
    body,
    ["email", "password"]
  );

  validateEmail(email);

  const existing = await findUserByEmail(env.DB, email);
  if (existing) return error("Email already registered", 409);

  const password_hash = await hashPassword(password);
  const user = await createUser(env.DB, { email, password_hash });

  const token = await createToken(
    env.KV,
    { id: user.id, email: user.email, role: user.role },
    env.AUTH_SECRET
  );

  return success({ token, user: { id: user.id, email: user.email, role: user.role } });
}
