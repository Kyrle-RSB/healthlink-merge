// ============================================================
// Structured Retriever — queries D1 via full-text search
// ============================================================

import type { Retriever, RetrievalQuery, RetrievalResult } from "./types";
import { searchRecords } from "../db/queries";

export class StructuredRetriever implements Retriever {
  name = "d1";
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async retrieve(query: RetrievalQuery): Promise<RetrievalResult[]> {
    const results = await searchRecords(this.db, query.text, query.limit || 20);

    return results.map((row) => ({
      id: row.id,
      source: "d1" as const,
      content: row.content,
      metadata: {
        title: row.title,
        category: row.category,
        created_at: row.created_at,
      },
    }));
  }
}
