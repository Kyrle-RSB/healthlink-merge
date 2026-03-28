// ============================================================
// Database queries — typed helpers for D1
// ============================================================

export interface RecordRow {
  id: string;
  title: string;
  category: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

/** List records with pagination */
export async function queryAll(
  db: D1Database,
  limit = 50,
  offset = 0
): Promise<RecordRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM records ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .bind(limit, offset)
    .all<RecordRow>();
  return results;
}

/** Get single record by ID */
export async function queryOne(
  db: D1Database,
  id: string
): Promise<RecordRow | null> {
  return db
    .prepare("SELECT * FROM records WHERE id = ?")
    .bind(id)
    .first<RecordRow>();
}

/** Full-text search on records */
export async function searchRecords(
  db: D1Database,
  query: string,
  limit = 20
): Promise<RecordRow[]> {
  const { results } = await db
    .prepare(
      `SELECT records.* FROM records_fts
       JOIN records ON records.rowid = records_fts.rowid
       WHERE records_fts MATCH ?
       ORDER BY rank
       LIMIT ?`
    )
    .bind(query, limit)
    .all<RecordRow>();
  return results;
}

/** Insert a new record */
export async function insertRecord(
  db: D1Database,
  data: { title: string; category: string; content: string; created_by?: string }
): Promise<RecordRow> {
  const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO records (id, title, category, content, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(id, data.title, data.category, data.content, data.created_by || null, now, now)
    .run();

  return { id, ...data, created_by: data.created_by || null, created_at: now, updated_at: now };
}

/** Find user by email */
export async function findUserByEmail(
  db: D1Database,
  email: string
): Promise<UserRow | null> {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first<UserRow>();
}

/** Create user */
export async function createUser(
  db: D1Database,
  data: { email: string; password_hash: string; role?: string }
): Promise<UserRow> {
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const role = data.role || "user";

  await db
    .prepare(
      "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(id, data.email, data.password_hash, role, now, now)
    .run();

  return { id, email: data.email, password_hash: data.password_hash, role, created_at: now, updated_at: now };
}
