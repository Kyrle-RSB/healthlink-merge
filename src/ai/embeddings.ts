// ============================================================
// Embeddings — OpenAI text-embedding API via fetch
// ============================================================
// Converts text into vector embeddings for semantic search.
// Uses text-embedding-3-small (1536 dimensions) by default.
// No SDK — raw fetch.
//
// Usage:
//   const vector = await embed(apiKey, "patient has chest pain");
//   // vector = [0.023, -0.041, ...] (1536 floats)
//
//   const vectors = await embedBatch(apiKey, ["text1", "text2"]);
// ============================================================

import { logger } from "../lib/logger";

const EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const DEFAULT_MODEL = "text-embedding-3-small";

/** Embed a single text string → vector */
export async function embed(
  apiKey: string,
  text: string,
  model = DEFAULT_MODEL
): Promise<number[]> {
  const results = await embedBatch(apiKey, [text], model);
  return results[0];
}

/** Embed multiple texts in one API call → array of vectors */
export async function embedBatch(
  apiKey: string,
  texts: string[],
  model = DEFAULT_MODEL
): Promise<number[][]> {
  if (texts.length === 0) return [];

  logger.info("Embedding request", { count: texts.length, model });

  const response = await fetch(EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("Embeddings API error", { status: response.status, body: errorBody });
    throw new Error(`OpenAI Embeddings API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    data: { embedding: number[]; index: number }[];
    usage: { total_tokens: number };
  };

  logger.debug("Embedding response", {
    vectors: data.data.length,
    tokens: data.usage?.total_tokens,
    dimensions: data.data[0]?.embedding.length,
  });

  // Sort by index to preserve input order
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
