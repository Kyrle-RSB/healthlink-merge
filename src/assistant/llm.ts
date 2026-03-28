// ============================================================
// AI Assistant — Streaming LLM Caller
// ============================================================
// Streams responses from OpenAI or Anthropic.
// Adapted from bwhockey's llm.ts for Cloudflare Workers.
// ============================================================

import { SAFETY_PREAMBLE } from "../ai/prompts";
import { logger } from "../lib/logger";

export interface LLMConfig {
  provider: "openai" | "anthropic";
  apiKey: string;
  model: string;
}

const ANSWERER_SYSTEM_PROMPT = `
${SAFETY_PREAMBLE}

You are an AI assistant for SILA, a healthcare navigation system. You help administrators
understand patient data, facility status, routing decisions, and system metrics.

RULES:
1. ONLY use data provided between DATA_START and DATA_END markers. Never invent or estimate.
2. If the data doesn't contain what was asked, say so clearly and mention what data IS available.
3. Format responses clearly with bullet points, numbers, and bold text where helpful.
4. When discussing patients, always note their barriers and access issues.
5. When discussing facilities, include current load and wait time.
6. For routing questions, explain the decision logic (CTAS level, confidence, destination reasoning).
7. Never provide medical advice or diagnoses — you're a data analyst, not a clinician.
8. All data is MOCK/SYNTHETIC. Always treat it as such.
9. Be concise and actionable. Administrators need quick answers.

ADMIN PAGE REFERENCES (direct users to these for actions):
- /admin.html#patients — Patient management
- /admin.html#facilities — Facility monitoring
- /admin.html#sessions — Routing session history
- /admin.html#analytics — Analytics and metrics
- /admin.html#staff — Staff management
- /admin.html#problems — Medical condition reference
- /carepoint.html — Patient routing interface
`.trim();

/**
 * Call the LLM with formatted context and stream the response.
 * Returns a ReadableStream of text chunks.
 */
export async function callLLM(
  formattedContext: string,
  userMessage: string,
  config: LLMConfig
): Promise<ReadableStream<Uint8Array>> {
  const fullMessage = `${formattedContext}\n\nUSER QUESTION: ${userMessage}`;

  if (config.provider === "anthropic") {
    return callAnthropic(fullMessage, config);
  }
  return callOpenAI(fullMessage, config);
}

async function callOpenAI(
  message: string,
  config: LLMConfig
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: ANSWERER_SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      stream: true,
      temperature: 0.1,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("OpenAI API error", { status: response.status, body: body.slice(0, 200) });
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  if (!response.body) throw new Error("No response body from OpenAI");

  return transformOpenAIStream(response.body);
}

async function callAnthropic(
  message: string,
  config: LLMConfig
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model || "claude-haiku-4-5-20251001",
      system: ANSWERER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: message }],
      stream: true,
      temperature: 0.1,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("Anthropic API error", { status: response.status, body: body.slice(0, 200) });
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  if (!response.body) throw new Error("No response body from Anthropic");

  return transformAnthropicStream(response.body);
}

function transformOpenAIStream(input: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = input.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    },
  });
}

function transformAnthropicStream(input: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = input.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              controller.enqueue(encoder.encode(parsed.delta.text));
            }
            if (parsed.type === "message_stop") {
              controller.close();
              return;
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    },
  });
}
