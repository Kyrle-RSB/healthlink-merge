// ============================================================
// Vector endpoints — embed + search via Pinecone
// ============================================================
// POST /api/ai/embed    — index content into Pinecone
// POST /api/ai/search   — semantic search across indexed content
// GET  /api/ai/vectors/stats — index stats
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error } from "../lib/response";
import { parseBody, requireFields } from "../lib/validate";
import { embed, embedBatch } from "../ai/embeddings";
import { createPineconeClient } from "../storage/pinecone";

function getPinecone(env: Env) {
  const client = createPineconeClient(env);
  if (!client) {
    return null;
  }
  return client;
}

/** POST /api/ai/embed — index content into Pinecone */
export async function embedHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === "sk-your-key-here") {
    return error("OPENAI_API_KEY not configured", 501);
  }

  const pinecone = getPinecone(env);
  if (!pinecone) {
    return error("Pinecone not configured. Add PINECONE_API_KEY and PINECONE_INDEX_HOST to .dev.vars", 501);
  }

  const body = await parseBody(request);

  // Support single or batch embed
  // Single: { id, content, metadata? }
  // Batch:  { items: [{ id, content, metadata? }, ...] }
  const items: { id: string; content: string; metadata?: Record<string, unknown> }[] = [];

  if ((body as Record<string, unknown>).items) {
    const { items: batchItems } = body as { items: typeof items };
    items.push(...batchItems);
  } else {
    const { id, content } = requireFields<{ id: string; content: string }>(body, ["id", "content"]);
    const metadata = (body as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
    items.push({ id, content, metadata });
  }

  if (items.length === 0) {
    return error("No items to embed", 400);
  }

  if (items.length > 100) {
    return error("Max 100 items per batch", 400);
  }

  // Generate embeddings
  const texts = items.map((item) => item.content);
  const vectors = await embedBatch(env.OPENAI_API_KEY, texts);

  // Upsert to Pinecone
  const pineconeVectors = items.map((item, i) => ({
    id: item.id,
    values: vectors[i],
    metadata: {
      ...item.metadata,
      content: item.content,  // Store content in metadata for retrieval
    },
  }));

  const namespace = ((body as Record<string, unknown>).namespace as string) || "";
  const result = await pinecone.upsert(pineconeVectors, namespace);

  return success({
    upsertedCount: result.upsertedCount,
    ids: items.map((item) => item.id),
    disclaimer: "MOCK/DEMO: Vector indexing for demonstration only.",
  });
}

/** POST /api/ai/search — semantic search */
export async function vectorSearchHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === "sk-your-key-here") {
    return error("OPENAI_API_KEY not configured", 501);
  }

  const pinecone = getPinecone(env);
  if (!pinecone) {
    return error("Pinecone not configured", 501);
  }

  const body = await parseBody(request);
  const { query } = requireFields<{ query: string }>(body, ["query"]);
  const topK = ((body as Record<string, unknown>).topK as number) || 5;
  const namespace = ((body as Record<string, unknown>).namespace as string) || "";
  const filter = (body as Record<string, unknown>).filter as Record<string, unknown> | undefined;

  // Embed the query
  const queryVector = await embed(env.OPENAI_API_KEY, query);

  // Search Pinecone
  const result = await pinecone.query(queryVector, {
    topK,
    namespace,
    includeMetadata: true,
    filter,
  });

  return success({
    matches: result.matches.map((m) => ({
      id: m.id,
      score: m.score,
      content: m.metadata?.content || "",
      metadata: m.metadata || {},
    })),
    query,
    disclaimer: "MOCK/DEMO: Search results from demonstration index.",
  });
}

/** GET /api/ai/vectors/stats — index statistics */
export async function vectorStatsHandler(
  _request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const pinecone = getPinecone(env);
  if (!pinecone) {
    return error("Pinecone not configured", 501);
  }

  const stats = await pinecone.describeStats();

  return success({
    totalVectors: stats.totalVectorCount,
    dimension: stats.dimension,
    namespaces: stats.namespaces,
  });
}
