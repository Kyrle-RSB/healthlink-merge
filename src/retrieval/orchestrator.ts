// ============================================================
// Retrieval Orchestrator — routes queries to the right source
// ============================================================
// This is the core of the retrieval architecture.
// It accepts a query, decides which retrievers to use,
// merges results, and returns a unified response.
//
// To add a new retriever (e.g., vector search):
// 1. Implement the Retriever interface
// 2. Register it with orchestrator.register()
// 3. Queries will automatically route to it
// ============================================================

import type { Retriever, RetrievalQuery, RetrievalResult } from "./types";
import { StructuredRetriever } from "./structured";
import { DocumentRetriever } from "./document";
import { VectorRetriever } from "./vector";
import { PineconeClient } from "../storage/pinecone";
import { logger } from "../lib/logger";

export class RetrievalOrchestrator {
  private retrievers: Map<string, Retriever> = new Map();

  /** Register a retriever */
  register(retriever: Retriever): void {
    this.retrievers.set(retriever.name, retriever);
    logger.debug("Retriever registered", { name: retriever.name });
  }

  /** Execute a retrieval query across selected sources */
  async query(query: RetrievalQuery): Promise<RetrievalResult[]> {
    const sources = query.sources || Array.from(this.retrievers.keys());
    const results: RetrievalResult[] = [];

    logger.info("Retrieval query", { text: query.text, sources });

    // Query all selected sources in parallel
    const promises = sources
      .filter((s) => this.retrievers.has(s))
      .map(async (source) => {
        try {
          const retriever = this.retrievers.get(source)!;
          const sourceResults = await retriever.retrieve(query);
          return sourceResults;
        } catch (err) {
          logger.error("Retriever failed", {
            source,
            error: err instanceof Error ? err.message : "Unknown",
          });
          return [];
        }
      });

    const allResults = await Promise.all(promises);
    for (const batch of allResults) {
      results.push(...batch);
    }

    // Sort by score if available, otherwise keep source order
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Apply global limit
    return results.slice(0, query.limit || 20);
  }

  /** Get list of registered retrievers */
  listRetrievers(): string[] {
    return Array.from(this.retrievers.keys());
  }
}

/** Factory: create a configured orchestrator from env bindings */
export function createOrchestrator(
  db: D1Database,
  r2: R2Bucket,
  options?: {
    pinecone?: PineconeClient;
    openaiKey?: string;
    pineconeNamespace?: string;
  }
): RetrievalOrchestrator {
  const orchestrator = new RetrievalOrchestrator();
  orchestrator.register(new StructuredRetriever(db));
  orchestrator.register(new DocumentRetriever(r2));

  // Auto-register vector retriever if Pinecone is configured
  if (options?.pinecone && options?.openaiKey) {
    orchestrator.register(
      new VectorRetriever(options.pinecone, options.openaiKey, options.pineconeNamespace)
    );
    logger.info("Vector retriever registered (Pinecone)");
  }

  return orchestrator;
}
