// =============================================================================
// BaseSocialPlatformIntegration — Abstract base class with HTTP & error handling
// =============================================================================

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from 'axios';
import type { SocialPlatformIntegration } from './integration.interface.js';
import {
  type Platform,
  type OAuthTokens,
  type TokenValidationResult,
  type SocialAccountInfo,
  type PlatformPostPayload,
  type PublishResult,
  type PostMetrics,
  type AccountMetrics,
  type PlatformFeatures,
  type ContentValidationResult,
  IntegrationError,
  type IntegrationErrorCode,
} from './integration.types.js';

export abstract class BaseSocialPlatformIntegration
  implements SocialPlatformIntegration
{
  abstract readonly platform: Platform;

  protected readonly http: AxiosInstance;

  constructor(baseURL?: string, defaultHeaders?: Record<string, string>) {
    this.http = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'Postlane-SocialManager/1.0',
        Accept: 'application/json',
        ...defaultHeaders,
      },
    });

    // Response interceptor to sanitize and translate errors
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        throw this.handleAxiosError(error);
      },
    );
  }

  // -------------------------------------------------------------------------
  // Abstract Methods
  // -------------------------------------------------------------------------

  abstract getAuthorizationUrl(state: string, redirectUri: string): string;
  abstract exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens>;
  abstract refreshTokens(refreshToken: string): Promise<OAuthTokens>;
  abstract validateTokens(tokens: OAuthTokens): Promise<TokenValidationResult>;
  abstract getAccountInfo(tokens: OAuthTokens): Promise<SocialAccountInfo>;
  abstract publishPost(tokens: OAuthTokens, post: PlatformPostPayload): Promise<PublishResult>;
  abstract deletePost(tokens: OAuthTokens, platformPostId: string): Promise<void>;
  abstract getPostMetrics(tokens: OAuthTokens, platformPostId: string): Promise<PostMetrics | null>;
  abstract getAccountMetrics(tokens: OAuthTokens): Promise<AccountMetrics | null>;
  abstract getSupportedFeatures(): PlatformFeatures;
  abstract validateContent(post: PlatformPostPayload): ContentValidationResult[];

  // -------------------------------------------------------------------------
  // HTTP Helpers
  // -------------------------------------------------------------------------

  /**
   * Perform an authorized GET request with bearer token
   */
  protected async get<T = unknown>(
    url: string,
    tokens: OAuthTokens,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.http.get<T>(url, {
      ...config,
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        ...config?.headers,
      },
    });
  }

  /**
   * Perform an authorized POST request with bearer token
   */
  protected async post<T = unknown>(
    url: string,
    data: unknown,
    tokens: OAuthTokens,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.http.post<T>(url, data, {
      ...config,
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        ...config?.headers,
      },
    });
  }

  /**
   * Perform an authorized DELETE request with bearer token
   */
  protected async deleteRequest<T = unknown>(
    url: string,
    tokens: OAuthTokens,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.http.delete<T>(url, {
      ...config,
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        ...config?.headers,
      },
    });
  }

  /**
   * Standard URL builder with query params
   */
  protected buildUrl(baseUrl: string, params: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(baseUrl);
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    }
    return url.toString();
  }

  // -------------------------------------------------------------------------
  // Error Classification & Sanitization
  // -------------------------------------------------------------------------

  /**
   * Safely inspect and categorize Axios errors without leaking sensitive data
   */
  protected handleAxiosError(error: unknown): IntegrationError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      const headers = error.response?.headers;

      // Parse retry-after header if present (in seconds or http date)
      let retryAfterSeconds: number | undefined;
      const rawRetry = headers?.['retry-after'];
      if (rawRetry) {
        const parsed = parseInt(String(rawRetry), 10);
        if (!isNaN(parsed)) {
          retryAfterSeconds = parsed;
        }
      }

      // Extract platform-specific error message
      const platformMessage = this.extractErrorMessage(data) || error.message;

      // Classify error code
      let code: IntegrationErrorCode = 'UNKNOWN';

      if (status === 401) {
        code = 'TOKEN_EXPIRED';
      } else if (status === 403) {
        code = 'PERMISSION_DENIED';
      } else if (status === 429) {
        code = 'RATE_LIMITED';
      } else if (status && status >= 400 && status < 500) {
        code = 'CONTENT_REJECTED';
      } else if (status && status >= 500) {
        code = 'PLATFORM_ERROR';
      } else if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || !error.response) {
        code = 'NETWORK_ERROR';
      }

      return new IntegrationError(
        `[${this.platform}] Request failed (${status ?? 'NETWORK'}): ${platformMessage}`,
        code,
        {
          statusCode: status,
          retryAfterSeconds,
          platformMessage,
        },
      );
    }

    if (error instanceof IntegrationError) {
      return error;
    }

    const err = error as Error;
    return new IntegrationError(
      `[${this.platform}] Unexpected error: ${err?.message || 'Unknown error'}`,
      'UNKNOWN',
    );
  }

  /**
   * Extract meaningful error messages across various platform formats
   */
  protected extractErrorMessage(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
      return typeof data === 'string' ? data : null;
    }

    const d = data as Record<string, unknown>;

    // Meta (Facebook/Instagram/Threads) error format: { error: { message, type, code, error_user_msg } }
    if (d.error && typeof d.error === 'object') {
      const err = d.error as Record<string, unknown>;
      return (
        (err.error_user_msg as string) ||
        (err.message as string) ||
        JSON.stringify(err)
      );
    }

    // Standard RFC 7807 / simple message
    if (typeof d.message === 'string') return d.message;
    if (typeof d.error_description === 'string') return d.error_description;
    if (typeof d.error === 'string') return d.error;

    // Reddit error format: { message: "...", json: { errors: [...] } }
    if (d.json && typeof d.json === 'object') {
      const json = d.json as { errors?: Array<[string, string, string]> };
      if (Array.isArray(json.errors) && json.errors.length > 0) {
        return json.errors.map((e) => e[1] || e[0]).join(', ');
      }
    }

    // LinkedIn error format: { message: "...", status: 400, serviceErrorCode: 100 }
    if (typeof d.description === 'string') return d.description;

    return null;
  }
}
