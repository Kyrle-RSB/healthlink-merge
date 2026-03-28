// ============================================================
// Retrieval types — shared interfaces for all retrievers
// ============================================================

/** A single retrieval result from any source */
export interface RetrievalResult {
  id: string;
  source: "d1" | "r2" | "kv" | "vector";
  content: string;
  metadata: Record<string, unknown>;
  score?: number;
}

/** Query routed to the retrieval orchestrator */
export interface RetrievalQuery {
  text: string;
  sources?: ("d1" | "r2" | "kv" | "vector")[];
  category?: string;
  limit?: number;
}

/** Interface all retrievers implement */
export interface Retriever {
  name: string;
  retrieve(query: RetrievalQuery): Promise<RetrievalResult[]>;
}
