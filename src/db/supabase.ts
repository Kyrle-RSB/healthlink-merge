// ============================================================
// Supabase Client — fetch-based, no SDK dependency
// ============================================================
// Alternative to D1 for teams more familiar with Postgres.
// Uses Supabase REST API (PostgREST) directly via fetch.
//
// Setup:
//   1. Create a free project at supabase.com
//   2. Add SUPABASE_URL and SUPABASE_ANON_KEY to .dev.vars
//   3. Optionally add SUPABASE_SERVICE_ROLE_KEY for admin ops
//   4. Set BACKEND=supabase in .dev.vars (default is "d1")
// ============================================================

import { logger } from "../lib/logger";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string; code: string } | null;
  count?: number;
}

/** Lightweight Supabase REST client — no SDK needed */
export class SupabaseClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: SupabaseConfig) {
    this.baseUrl = `${config.url}/rest/v1`;
    this.headers = {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.serviceRoleKey || config.anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
  }

  /** SELECT — fetch rows from a table */
  async select<T = Record<string, unknown>>(
    table: string,
    options: {
      columns?: string;
      filter?: string;
      order?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SupabaseResponse<T[]>> {
    const params = new URLSearchParams();
    if (options.columns) params.set("select", options.columns);
    if (options.order) params.set("order", options.order);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());

    const filterStr = options.filter ? `&${options.filter}` : "";
    const url = `${this.baseUrl}/${table}?${params}${filterStr}`;

    return this.request<T[]>("GET", url);
  }

  /** INSERT — create one or more rows */
  async insert<T = Record<string, unknown>>(
    table: string,
    data: Record<string, unknown> | Record<string, unknown>[]
  ): Promise<SupabaseResponse<T[]>> {
    const url = `${this.baseUrl}/${table}`;
    return this.request<T[]>("POST", url, data);
  }

  /** UPDATE — update rows matching a filter */
  async update<T = Record<string, unknown>>(
    table: string,
    data: Record<string, unknown>,
    filter: string
  ): Promise<SupabaseResponse<T[]>> {
    const url = `${this.baseUrl}/${table}?${filter}`;
    return this.request<T[]>("PATCH", url, data);
  }

  /** DELETE — delete rows matching a filter */
  async delete<T = Record<string, unknown>>(
    table: string,
    filter: string
  ): Promise<SupabaseResponse<T[]>> {
    const url = `${this.baseUrl}/${table}?${filter}`;
    return this.request<T[]>("DELETE", url);
  }

  /** RPC — call a Postgres function */
  async rpc<T = unknown>(
    functionName: string,
    params: Record<string, unknown> = {}
  ): Promise<SupabaseResponse<T>> {
    const url = `${this.baseUrl}/rpc/${functionName}`;
    return this.request<T>("POST", url, params);
  }

  /** Core fetch wrapper */
  private async request<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<SupabaseResponse<T>> {
    logger.debug("Supabase request", { method, url });

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage: string;
        try {
          const parsed = JSON.parse(errorBody);
          errorMessage = parsed.message || parsed.error || errorBody;
        } catch {
          errorMessage = errorBody;
        }

        logger.error("Supabase error", { status: response.status, error: errorMessage });
        return {
          data: null,
          error: { message: errorMessage, code: response.status.toString() },
        };
      }

      const data = (await response.json()) as T;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Supabase fetch failed", { error: message });
      return {
        data: null,
        error: { message, code: "FETCH_ERROR" },
      };
    }
  }
}

/** Create a Supabase client from env vars */
export function createSupabaseClient(env: {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    logger.warn("Supabase not configured — missing SUPABASE_URL or SUPABASE_ANON_KEY");
    return null;
  }

  return new SupabaseClient({
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
