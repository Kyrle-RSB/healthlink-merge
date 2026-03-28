// ============================================================
// Supabase query helpers — mirrors queries.ts for D1
// ============================================================
// Drop-in replacement when BACKEND=supabase.
// Same function signatures, same return types.
// ============================================================

import type { RecordRow, UserRow } from "./queries";
import { SupabaseClient } from "./supabase";

/** List records with pagination */
export async function queryAllSupabase(
  client: SupabaseClient,
  limit = 50,
  offset = 0
): Promise<RecordRow[]> {
  const { data, error } = await client.select<RecordRow>("records", {
    order: "created_at.desc",
    limit,
    offset,
  });
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data || [];
}

/** Get single record by ID */
export async function queryOneSupabase(
  client: SupabaseClient,
  id: string
): Promise<RecordRow | null> {
  const { data, error } = await client.select<RecordRow>("records", {
    filter: `id=eq.${id}`,
    limit: 1,
  });
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data?.[0] || null;
}

/** Full-text search on records (Postgres tsvector) */
export async function searchRecordsSupabase(
  client: SupabaseClient,
  query: string,
  limit = 20
): Promise<RecordRow[]> {
  // PostgREST full-text search using Postgres tsvector
  const tsQuery = query.split(/\s+/).join(" & ");
  const { data, error } = await client.select<RecordRow>("records", {
    filter: `or=(title.fts.${tsQuery},content.fts.${tsQuery})`,
    limit,
  });
  if (error) throw new Error(`Supabase search failed: ${error.message}`);
  return data || [];
}

/** Insert a new record */
export async function insertRecordSupabase(
  client: SupabaseClient,
  data: { title: string; category: string; content: string; created_by?: string }
): Promise<RecordRow> {
  const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const row = {
    id,
    title: data.title,
    category: data.category,
    content: data.content,
    created_by: data.created_by || null,
    created_at: now,
    updated_at: now,
  };

  const { error } = await client.insert("records", row);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return row as RecordRow;
}

/** Find user by email */
export async function findUserByEmailSupabase(
  client: SupabaseClient,
  email: string
): Promise<UserRow | null> {
  const { data, error } = await client.select<UserRow>("users", {
    filter: `email=eq.${email}`,
    limit: 1,
  });
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data?.[0] || null;
}

/** Create user */
export async function createUserSupabase(
  client: SupabaseClient,
  data: { email: string; password_hash: string; role?: string }
): Promise<UserRow> {
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const role = data.role || "user";

  const row = {
    id,
    email: data.email,
    password_hash: data.password_hash,
    role,
    created_at: now,
    updated_at: now,
  };

  const { error } = await client.insert("users", row);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return row as UserRow;
}
