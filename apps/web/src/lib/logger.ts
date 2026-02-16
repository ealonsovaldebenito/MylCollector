/**
 * Logger estructurado JSON (doc 12).
 * Campos minimos: ts, level, request_id, route, method, status, duration_ms.
 * Compatible con Edge Runtime (no usa pino).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogData = Record<string, unknown>;

const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';
const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[LOG_LEVEL as LogLevel];
}

function formatLog(level: LogLevel, data: LogData): string {
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...data,
  });
}

export const logger = {
  info(data: LogData): void {
    if (shouldLog('info')) {
      console.log(formatLog('info', data));
    }
  },
  warn(data: LogData): void {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', data));
    }
  },
  error(data: LogData): void {
    if (shouldLog('error')) {
      console.error(formatLog('error', data));
    }
  },
  debug(data: LogData): void {
    if (shouldLog('debug')) {
      console.debug(formatLog('debug', data));
    }
  },
};
