/**
 * Sanitizes API responses, payloads, and error objects so no tokens or credentials
 * can ever be leaked to the database or logs.
 */

const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /authorization/i,
  /auth_header/i,
  /bearer/i,
  /api[_-]?key/i,
  /client[_-]?secret/i,
  /credential/i,
  /private/i,
];

export function sanitizeObject<T>(input: T, depth = 0): T {
  if (depth > 6) {
    return '[TRUNCATED_DEPTH]' as unknown as T;
  }

  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item, depth + 1)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeObject(val, depth + 1);
    } else if (typeof val === 'string' && val.length > 5000) {
      sanitized[key] = val.slice(0, 5000) + '...[TRUNCATED]';
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized as T;
}

export function sanitizeApiResponse(response: unknown): Record<string, unknown> {
  if (!response || typeof response !== 'object') {
    return { data: response };
  }
  return sanitizeObject(response as Record<string, unknown>);
}
