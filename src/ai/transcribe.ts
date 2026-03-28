// ============================================================
// Audio Transcription — Deepgram API via fetch
// ============================================================
// Supports audio file upload → text transcription.
// Uses Deepgram's nova-3 model with smart formatting.
// No SDK dependency — raw fetch to the REST API.
//
// Usage:
//   POST /api/ai/transcribe  (multipart/form-data with audio file)
//   POST /api/ai/transcribe  (raw audio body with Content-Type header)
// ============================================================

import { logger } from "../lib/logger";

const DEEPGRAM_URL = "https://api.deepgram.com/v1/listen";

export interface TranscriptionOptions {
  model?: string;
  language?: string;
  smartFormat?: boolean;
  punctuate?: boolean;
  diarize?: boolean;
  summarize?: boolean;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words: { word: string; start: number; end: number; confidence: number }[];
  duration: number;
  model: string;
}

/** Transcribe audio bytes using Deepgram */
export async function transcribeAudio(
  apiKey: string,
  audioData: ArrayBuffer,
  contentType: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const {
    model = "nova-3",
    language = "en",
    smartFormat = true,
    punctuate = true,
    diarize = false,
    summarize = false,
  } = options;

  const params = new URLSearchParams({
    model,
    language,
    smart_format: smartFormat.toString(),
    punctuate: punctuate.toString(),
    diarize: diarize.toString(),
    summarize: summarize ? "v2" : "false",
  });

  const url = `${DEEPGRAM_URL}?${params}`;

  logger.info("Transcription request", { model, contentType, bytes: audioData.byteLength });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": contentType,
    },
    body: audioData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("Deepgram API error", { status: response.status, body: errorBody });
    throw new Error(`Deepgram API error: ${response.status}`);
  }

  const data = await response.json() as {
    results: {
      channels: {
        alternatives: {
          transcript: string;
          confidence: number;
          words: { word: string; start: number; end: number; confidence: number }[];
        }[];
      }[];
    };
    metadata: { duration: number; models: string[] };
  };

  const alt = data.results.channels[0]?.alternatives[0];

  if (!alt) {
    throw new Error("No transcription result returned");
  }

  logger.info("Transcription complete", {
    confidence: alt.confidence,
    duration: data.metadata.duration,
    wordCount: alt.words?.length || 0,
  });

  return {
    transcript: alt.transcript,
    confidence: alt.confidence,
    words: alt.words || [],
    duration: data.metadata.duration,
    model: data.metadata.models?.[0] || model,
  };
}
