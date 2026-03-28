// ============================================================
// Pinecone Client — fetch-based, no SDK dependency
// ============================================================
// Lightweight wrapper for Pinecone's REST API.
// Supports upsert, query, fetch, and delete operations.
//
// Setup:
//   1. Create a free index at pinecone.io
//      - Dimensions: 1536 (for text-embedding-3-small)
//      - Metric: cosine
//   2. Add to .dev.vars:
//      PINECONE_API_KEY=your-api-key
//      PINECONE_INDEX_HOST=https://your-index-abc123.svc.pinecone.io
// ============================================================

import { logger } from "../lib/logger";

export interface PineconeConfig {
  apiKey: string;
  indexHost: string;  // full URL including https://
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface PineconeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, unknown>;
}

export interface PineconeQueryResult {
  matches: PineconeMatch[];
  namespace: string;
}

/** Lightweight Pinecone REST client */
export class PineconeClient {
  private host: string;
  private headers: Record<string, string>;

  constructor(config: PineconeConfig) {
    // Remove trailing slash if present
    this.host = config.indexHost.replace(/\/$/, "");
    this.headers = {
      "Api-Key": config.apiKey,
      "Content-Type": "application/json",
    };
  }

  /** Upsert vectors (insert or update) */
  async upsert(
    vectors: PineconeVector[],
    namespace = ""
  ): Promise<{ upsertedCount: number }> {
    logger.info("Pinecone upsert", { count: vectors.length, namespace });

    const response = await this.request("/vectors/upsert", {
      vectors,
      namespace,
    });

    return response as { upsertedCount: number };
  }

  /** Query for similar vectors */
  async query(
    vector: number[],
    options: {
      topK?: number;
      namespace?: string;
      includeMetadata?: boolean;
      includeValues?: boolean;
      filter?: Record<string, unknown>;
    } = {}
  ): Promise<PineconeQueryResult> {
    const {
      topK = 5,
      namespace = "",
      includeMetadata = true,
      includeValues = false,
      filter,
    } = options;

    logger.info("Pinecone query", { topK, namespace, hasFilter: !!filter });

    const body: Record<string, unknown> = {
      vector,
      topK,
      namespace,
      includeMetadata,
      includeValues,
    };

    if (filter) body.filter = filter;

    const response = await this.request("/query", body);
    return response as PineconeQueryResult;
  }

  /** Fetch vectors by IDs */
  async fetch(
    ids: string[],
    namespace = ""
  ): Promise<{ vectors: Record<string, PineconeVector> }> {
    const params = new URLSearchParams();
    ids.forEach((id) => params.append("ids", id));
    if (namespace) params.set("namespace", namespace);

    const url = `${this.host}/vectors/fetch?${params}`;

    logger.debug("Pinecone fetch", { ids: ids.length, namespace });

    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Pinecone fetch error", { status: response.status, body: errorBody });
      throw new Error(`Pinecone fetch error: ${response.status}`);
    }

    return (await response.json()) as { vectors: Record<string, PineconeVector> };
  }

  /** Delete vectors by IDs or by filter */
  async delete(
    options: {
      ids?: string[];
      deleteAll?: boolean;
      namespace?: string;
      filter?: Record<string, unknown>;
    }
  ): Promise<void> {
    const { ids, deleteAll = false, namespace = "", filter } = options;

    logger.info("Pinecone delete", { ids: ids?.length, deleteAll, namespace });

    await this.request("/vectors/delete", {
      ids,
      deleteAll,
      namespace,
      filter,
    });
  }

  /** Describe index stats */
  async describeStats(): Promise<{
    namespaces: Record<string, { vectorCount: number }>;
    dimension: number;
    totalVectorCount: number;
  }> {
    return this.request("/describe_index_stats", {}) as Promise<{
      namespaces: Record<string, { vectorCount: number }>;
      dimension: number;
      totalVectorCount: number;
    }>;
  }

  /** Core POST request helper */
  private async request(path: string, body: unknown): Promise<unknown> {
    const url = `${this.host}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Pinecone API error", { path, status: response.status, body: errorBody });
      throw new Error(`Pinecone API error ${path}: ${response.status}`);
    }

    return response.json();
  }
}

/** Create a Pinecone client from env vars (returns null if not configured) */
export function createPineconeClient(env: {
  PINECONE_API_KEY?: string;
  PINECONE_INDEX_HOST?: string;
}): PineconeClient | null {
  if (!env.PINECONE_API_KEY || !env.PINECONE_INDEX_HOST) {
    logger.warn("Pinecone not configured — missing PINECONE_API_KEY or PINECONE_INDEX_HOST");
    return null;
  }

  return new PineconeClient({
    apiKey: env.PINECONE_API_KEY,
    indexHost: env.PINECONE_INDEX_HOST,
  });
}
