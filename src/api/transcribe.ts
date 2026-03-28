// ============================================================
// Transcription endpoint — POST /api/ai/transcribe
// ============================================================
// Accepts audio as raw body or multipart form data.
// Returns transcription text + confidence + word timings.
// ============================================================

import type { Env, AuthedRequest } from "../types";
import { success, error } from "../lib/response";
import { transcribeAudio } from "../ai/transcribe";

/** POST /api/ai/transcribe — transcribe audio to text */
export async function transcribeHandler(
  request: Request,
  env: Env,
  _ctx: AuthedRequest
): Promise<Response> {
  if (!env.DEEPGRAM_API_KEY || env.DEEPGRAM_API_KEY === "your-deepgram-key") {
    return error("DEEPGRAM_API_KEY not configured. Add it to .dev.vars", 501);
  }

  const contentType = request.headers.get("content-type") || "";

  let audioData: ArrayBuffer;
  let audioContentType: string;

  if (contentType.includes("multipart/form-data")) {
    // Handle form upload
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    if (!file) {
      return error("Missing 'audio' field in form data", 400);
    }
    audioData = await file.arrayBuffer();
    audioContentType = file.type || "audio/wav";
  } else {
    // Handle raw audio body
    audioData = await request.arrayBuffer();
    audioContentType = contentType || "audio/wav";
  }

  if (audioData.byteLength === 0) {
    return error("Empty audio data", 400);
  }

  // 25MB limit
  if (audioData.byteLength > 25 * 1024 * 1024) {
    return error("Audio file too large (max 25MB)", 413);
  }

  const result = await transcribeAudio(
    env.DEEPGRAM_API_KEY,
    audioData,
    audioContentType
  );

  return success({
    transcript: result.transcript,
    confidence: result.confidence,
    words: result.words,
    duration: result.duration,
    model: result.model,
    disclaimer: "MOCK/DEMO: Transcription is for demonstration purposes only.",
  });
}
