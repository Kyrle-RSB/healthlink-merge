// ============================================================
// Vector Retriever — Pinecone-backed semantic search
// ============================================================
// Implements the Retriever interface for the orchestrator.
// Converts text queries into embeddings, then queries Pinecone.
//
// Registration:
//   orchestrator.register(new VectorRetriever(pineconeClient, openaiKey));
// ============================================================

import type { Retriever, RetrievalQuery, RetrievalResult } from "./types";
import { PineconeClient } from "../storage/pinecone";
import { embed } from "../ai/embeddings";
import { logger } from "../lib/logger";

export class VectorRetriever implements Retriever {
  name = "vector" as const;

  constructor(
    private pinecone: PineconeClient,
    private openaiKey: string,
    private namespace = ""
  ) {}

  async retrieve(query: RetrievalQuery): Promise<RetrievalResult[]> {
    logger.info("Vector retrieval", { query: query.text, limit: query.limit });

    // Convert query text to embedding
    const queryVector = await embed(this.openaiKey, query.text);

    // Build optional metadata filter
    const filter = query.category
      ? { category: { $eq: query.category } }
      : undefined;

    // Query Pinecone
    const result = await this.pinecone.query(queryVector, {
      topK: query.limit || 5,
      namespace: this.namespace,
      includeMetadata: true,
      filter,
    });

    // Convert to standard RetrievalResult format
    return result.matches.map((match) => ({
      id: match.id,
      source: "vector" as const,
      content: (match.metadata?.content as string) || "",
      metadata: (match.metadata as Record<string, unknown>) || {},
      score: match.score,
    }));
  }
}
