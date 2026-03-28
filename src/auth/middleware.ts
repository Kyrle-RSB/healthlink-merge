// ============================================================
// Auth middleware — checks token or bypasses in demo mode
// ============================================================

import type { Env, AuthUser } from "../types";
import { UnauthorizedError } from "../lib/errors";
import { verifyToken } from "./tokens";
import { logger } from "../lib/logger";

/** Demo mode user — returned when DEMO_MODE=true */
const DEMO_USER: AuthUser = {
  id: "usr_demo_001",
  email: "demo@example.com",
  role: "admin",
};

/** Verify auth from Authorization header. Returns user or throws. */
export async function verifyAuth(request: Request, env: Env): Promise<AuthUser> {
  // Demo mode bypass — skip all auth
  if (env.DEMO_MODE === "true") {
    logger.debug("Auth bypassed — demo mode active");
    return DEMO_USER;
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    throw new UnauthorizedError("Missing Authorization header");
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new UnauthorizedError("Missing token");
  }

  const user = await verifyToken(env.KV, token);
  if (!user) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  return user;
}
