// ============================================================
// Response builder — consistent API response shape
// ============================================================

import type { ApiResponse } from "../types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function json<T>(
  data: T,
  status = 200,
  meta?: Record<string, unknown>
): Response {
  const body: ApiResponse<T> = {
    ok: status >= 200 && status < 300,
    data: status >= 200 && status < 300 ? data : null,
    error: status >= 400 ? (data as unknown as string) : null,
    meta,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

export function success<T>(data: T, meta?: Record<string, unknown>): Response {
  return json(data, 200, meta);
}

export function created<T>(data: T): Response {
  return json(data, 201);
}

export function error(message: string, status = 500): Response {
  return json(message, status);
}

export function notFound(message = "Not found"): Response {
  return error(message, 404);
}

export function handleCors(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
