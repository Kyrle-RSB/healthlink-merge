// ============================================================
// Router — lightweight URL pattern matching, no dependencies
// ============================================================

import type { Env, Route, RouteHandler, AuthedRequest } from "../types";
import { AppError } from "../lib/errors";
import { error, handleCors, notFound } from "../lib/response";
import { logger } from "../lib/logger";
import { parseQuery } from "../lib/validate";
import { verifyAuth } from "../auth/middleware";

const routes: Route[] = [];

/** Register a route */
export function route(
  method: string,
  pattern: string,
  handler: RouteHandler,
  requiresAuth = false
) {
  routes.push({ method: method.toUpperCase(), pattern, handler, requiresAuth });
}

/** Convert route pattern like /api/records/:id to regex */
function patternToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexStr = pattern.replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

/** Match a request to a registered route */
function matchRoute(method: string, pathname: string) {
  for (const r of routes) {
    if (r.method !== method && r.method !== "ALL") continue;

    const { regex, paramNames } = patternToRegex(r.pattern);
    const match = pathname.match(regex);
    if (match) {
      const params: Record<string, string> = {};
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { route: r, params };
    }
  }
  return null;
}

/** Handle incoming request — called from index.ts */
export async function handleRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") return handleCors();

  const url = new URL(request.url);
  const { pathname } = url;
  const start = Date.now();

  logger.info("Request", { method: request.method, path: pathname });

  // Security: reject oversized request bodies (10MB limit)
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 10_000_000) {
    return error("Request body too large", 413);
  }

  try {
    const matched = matchRoute(request.method, pathname);
    if (!matched) return notFound("Route not found");

    // Build auth context
    const ctx: AuthedRequest = {
      user: null,
      params: matched.params,
      query: parseQuery(request),
      body: null,
    };

    // Run auth middleware if route requires it
    if (matched.route.requiresAuth) {
      ctx.user = await verifyAuth(request, env);
    }

    const response = await matched.route.handler(request, env, ctx);

    const ms = Date.now() - start;
    logger.info("Response", { method: request.method, path: pathname, status: response.status, ms });

    // Add server timing header
    const headers = new Headers(response.headers);
    headers.set("Server-Timing", `total;dur=${ms}`);
    headers.set("X-Response-Time", `${ms}ms`);

    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch (err) {
    if (err instanceof AppError) {
      logger.warn("AppError", { code: err.code, message: err.message, status: err.statusCode });
      return error(err.message, err.statusCode);
    }

    logger.error("Unhandled error", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });

    return error("Internal server error", 500);
  }
}
