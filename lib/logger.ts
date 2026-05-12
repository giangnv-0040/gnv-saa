/**
 * Redacting logger. Strips secrets and PII before forwarding to console.
 * - Drops keys: authorization, cookie, access_token, refresh_token, id_token, password
 * - Reduces email values to their domain part (e.g. "alice@sun-asterisk.com" → "@sun-asterisk.com")
 * - Recursively cleans nested objects + arrays
 */

const SECRET_KEYS = new Set([
  'authorization',
  'cookie',
  'access_token',
  'refresh_token',
  'id_token',
  'password',
  'api_key',
  'apikey',
  'secret',
]);

const EMAIL_PATTERN = /^[^\s@]+@([^\s@]+)$/;

function redactValue(key: string, value: unknown): unknown {
  if (SECRET_KEYS.has(key.toLowerCase())) return '[REDACTED]';
  if (typeof value === 'string') {
    const match = EMAIL_PATTERN.exec(value);
    if (match) return `@${match[1]}`;
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => redactValue(key, item));
  if (value && typeof value === 'object') return redact(value as Record<string, unknown>);
  return value;
}

function redact(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    out[key] = redactValue(key, value);
  }
  return out;
}

type LogContext = Record<string, unknown>;

function format(level: string, message: string, context?: LogContext) {
  const ts = new Date().toISOString();
  if (context) return `[${ts}] ${level} ${message} ${JSON.stringify(redact(context))}`;
  return `[${ts}] ${level} ${message}`;
}

export const logger = {
  info: (message: string, context?: LogContext) => console.log(format('INFO', message, context)),
  warn: (message: string, context?: LogContext) => console.warn(format('WARN', message, context)),
  error: (message: string, context?: LogContext) =>
    console.error(format('ERROR', message, context)),
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(format('DEBUG', message, context));
    }
  },
};
