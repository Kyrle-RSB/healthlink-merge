// ============================================================
// Document Retriever — fetches documents from R2
// ============================================================

import type { Retriever, RetrievalQuery, RetrievalResult } from "./types";
import { listR2Objects, downloadFromR2 } from "../storage/r2";

export class DocumentRetriever implements Retriever {
  name = "r2";
  private r2: R2Bucket;

  constructor(r2: R2Bucket) {
    this.r2 = r2;
  }

  async retrieve(query: RetrievalQuery): Promise<RetrievalResult[]> {
    // List objects matching the query text as a prefix/keyword
    const prefix = query.category || "uploads/";
    const objects = await listR2Objects(this.r2, prefix, query.limit || 20);

    // Filter by query text in the key name (simple keyword match)
    const matches = objects.filter((obj) =>
      obj.key.toLowerCase().includes(query.text.toLowerCase())
    );

    const results: RetrievalResult[] = [];

    for (const obj of matches.slice(0, query.limit || 10)) {
      // For listing, return metadata without downloading full content
      results.push({
        id: obj.key,
        source: "r2",
        content: `Document: ${obj.key} (${obj.size} bytes)`,
        metadata: {
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
        },
      });
    }

    return results;
  }

  /** Download full document content — call separately when needed */
  async getDocument(key: string): Promise<string | null> {
    const result = await downloadFromR2(this.r2, key);
    if (!result) return null;

    const reader = result.body.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) chunks.push(value);
    }

    const decoder = new TextDecoder();
    return chunks.map((c) => decoder.decode(c)).join("");
  }
}
