// ============================================================
// R2 helpers — upload, download, list for Cloudflare R2
// ============================================================
// Use for: documents, PDFs, images, uploaded files, large blobs
// ============================================================

/** Upload a file/blob to R2 */
export async function uploadToR2(
  r2: R2Bucket,
  key: string,
  body: ReadableStream | ArrayBuffer | string
): Promise<R2Object | null> {
  return r2.put(key, body);
}

/** Download a file from R2 */
export async function downloadFromR2(
  r2: R2Bucket,
  key: string
): Promise<{ body: ReadableStream; metadata: R2Object } | null> {
  const object = await r2.get(key);
  if (!object) return null;
  return { body: object.body, metadata: object };
}

/** List objects in R2 by prefix */
export async function listR2Objects(
  r2: R2Bucket,
  prefix = "",
  limit = 100
): Promise<{ key: string; size: number; uploaded: string }[]> {
  const list = await r2.list({ prefix, limit });
  return list.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded.toISOString(),
  }));
}

/** Delete an object from R2 */
export async function deleteFromR2(r2: R2Bucket, key: string): Promise<void> {
  await r2.delete(key);
}
