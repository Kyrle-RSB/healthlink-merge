// ============================================================
// KV helpers — typed get/set/delete for Cloudflare KV
// ============================================================
// Use for: sessions, tokens, feature flags, cached lookups
// ============================================================

/** Get a typed value from KV */
export async function kvGet<T = string>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  const value = await kv.get(key, "text");
  if (value === null) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/** Set a value in KV with optional TTL (seconds) */
export async function kvSet(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  const options: KVNamespacePutOptions = {};
  if (ttlSeconds) options.expirationTtl = ttlSeconds;
  await kv.put(key, serialized, options);
}

/** Delete a key from KV */
export async function kvDelete(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}

/** List keys with a prefix */
export async function kvList(
  kv: KVNamespace,
  prefix: string,
  limit = 100
): Promise<string[]> {
  const list = await kv.list({ prefix, limit });
  return list.keys.map((k) => k.name);
}
