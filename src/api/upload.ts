// ============================================================
// Upload endpoint — POST /api/upload (R2)
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, created } from "../lib/response";
import { ValidationError } from "../lib/errors";
import { uploadToR2, listR2Objects } from "../storage/r2";

/** POST /api/upload — upload a file to R2 */
export async function uploadFile(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  const contentType = request.headers.get("Content-Type") || "";

  if (!contentType.includes("multipart/form-data") && !contentType.includes("application/octet-stream")) {
    throw new ValidationError("Content-Type must be multipart/form-data or application/octet-stream");
  }

  let key: string;
  let body: ReadableStream | ArrayBuffer;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new ValidationError("No file field in form data");
    key = `uploads/${Date.now()}-${file.name}`;
    body = file.stream();
  } else {
    const filename = request.headers.get("X-Filename") || `upload-${Date.now()}`;
    key = `uploads/${filename}`;
    body = await request.arrayBuffer();
  }

  await uploadToR2(env.R2, key, body);

  return created({ key, message: "File uploaded successfully" });
}

/** GET /api/uploads — list uploaded files */
export async function listUploads(
  _request: Request,
  env: Env,
  ctx: AuthedRequest
): Promise<Response> {
  const prefix = ctx.query.prefix || "uploads/";
  const objects = await listR2Objects(env.R2, prefix);
  return success(objects);
}
