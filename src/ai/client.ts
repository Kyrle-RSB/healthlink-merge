// ============================================================
// AI Client — OpenAI/GPT API wrapper
// ============================================================
// Lightweight wrapper, no SDK dependency. Uses fetch directly.
// Supports chat completions with streaming option.
// ============================================================

import { logger } from "../lib/logger";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

const DEFAULT_MODEL = "gpt-4o-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";

/** Send a chat completion request */
export async function chatCompletion(
  apiKey: string,
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 1024,
    systemPrompt,
  } = options;

  const allMessages: ChatMessage[] = [];
  if (systemPrompt) {
    allMessages.push({ role: "system", content: systemPrompt });
  }
  allMessages.push(...messages);

  logger.debug("AI request", { model, messageCount: allMessages.length });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("AI API error", { status: response.status, body: errorBody });
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
    usage: { total_tokens: number };
  };

  logger.debug("AI response", { tokens: data.usage?.total_tokens });

  return data.choices[0]?.message?.content || "";
}

/** Convenience: single-turn question */
export async function askAI(
  apiKey: string,
  question: string,
  systemPrompt?: string
): Promise<string> {
  return chatCompletion(
    apiKey,
    [{ role: "user", content: question }],
    { systemPrompt }
  );
}
