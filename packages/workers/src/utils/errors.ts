import { IntegrationError } from '@scope/integrations';

export type ErrorClassification = 'TEMPORARY' | 'PERMANENT';

export interface ClassifiedError {
  classification: ErrorClassification;
  statusCode?: number;
  message: string;
  details?: unknown;
  retryAfterSeconds?: number;
}

export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof IntegrationError) {
    const isTemporary =
      error.code === 'RATE_LIMITED' ||
      error.code === 'PLATFORM_ERROR' ||
      error.code === 'NETWORK_ERROR';

    return {
      classification: isTemporary ? 'TEMPORARY' : 'PERMANENT',
      statusCode: error.statusCode,
      message: error.message,
      details: {
        code: error.code,
        platformMessage: error.platformMessage,
      },
      retryAfterSeconds: error.retryAfterSeconds,
    };
  }

  // Check for HTTP-like error properties (e.g. Axios)
  const anyErr = error as any;
  const status = anyErr?.response?.status || anyErr?.statusCode || anyErr?.status;
  const statusNum = typeof status === 'number' ? status : parseInt(status, 10);

  if (!isNaN(statusNum)) {
    if (statusNum === 429 || (statusNum >= 500 && statusNum <= 599)) {
      return {
        classification: 'TEMPORARY',
        statusCode: statusNum,
        message: anyErr.message || `Platform HTTP error ${statusNum}`,
        details: anyErr.response?.data,
      };
    }

    if (statusNum >= 400 && statusNum < 500) {
      return {
        classification: 'PERMANENT',
        statusCode: statusNum,
        message: anyErr.message || `Client/Platform error ${statusNum}`,
        details: anyErr.response?.data,
      };
    }
  }

  // Network connection errors
  if (
    anyErr?.code === 'ECONNRESET' ||
    anyErr?.code === 'ETIMEDOUT' ||
    anyErr?.code === 'ECONNREFUSED' ||
    anyErr?.code === 'ENOTFOUND' ||
    anyErr?.code === 'EAI_AGAIN'
  ) {
    return {
      classification: 'TEMPORARY',
      message: `Network error: ${anyErr.code}`,
      details: anyErr.message,
    };
  }

  // Default to permanent if unknown to avoid infinite loops, but extract message
  return {
    classification: 'PERMANENT',
    message: anyErr?.message || 'Unknown processing error',
    details: String(error),
  };
}
