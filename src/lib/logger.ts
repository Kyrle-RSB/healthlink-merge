// ============================================================
// Logger — structured logging for hackathon debugging
// ============================================================
// Outputs JSON lines to `wrangler tail` and Workers logs.
// Intentionally simple — no external dependencies.
// ============================================================

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let minLevel: LogLevel = "debug";

export function setLogLevel(level: LogLevel) {
  minLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    default:
      console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log("debug", msg, data),
  info: (msg: string, data?: Record<string, unknown>) => log("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log("error", msg, data),
};
