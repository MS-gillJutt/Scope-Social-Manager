// =============================================================================
// SocialPlatformIntegration Interface
// =============================================================================

import type {
  Platform,
  OAuthTokens,
  TokenValidationResult,
  SocialAccountInfo,
  PlatformPostPayload,
  PublishResult,
  PostMetrics,
  AccountMetrics,
  PlatformFeatures,
  ContentValidationResult,
} from './integration.types.js';

/**
 * Contract that every social platform integration must implement.
 * Each method is documented with its expected behavior, error handling,
 * and any platform-specific caveats.
 */
export interface SocialPlatformIntegration {
  /** The platform this integration handles */
  platform: Platform;

  // -------------------------------------------------------------------------
  // OAuth
  // -------------------------------------------------------------------------

  /**
   * Build the OAuth authorization URL to redirect the user to.
   *
   * @param state  CSRF-protection state token (store in session, verify on callback)
   * @param redirectUri  Callback URL registered with the platform app
   * @returns Fully-qualified URL to redirect the browser to
   */
  getAuthorizationUrl(state: string, redirectUri: string): string;

  /**
   * Exchange the short-lived authorization code (from the OAuth callback) for
   * access and refresh tokens.
   *
   * @param code        Authorization code received in the callback query string
   * @param redirectUri The same redirect_uri used when generating the auth URL
   * @returns OAuthTokens — MUST NOT be logged or returned to the frontend
   * @throws IntegrationError(TOKEN_INVALID) if the code is expired or invalid
   */
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens>;

  /**
   * Refresh an expired access token using the stored refresh token.
   *
   * @param refreshToken Decrypted refresh token (from DB)
   * @returns Fresh OAuthTokens — caller must re-encrypt and persist to DB
   * @throws IntegrationError(TOKEN_EXPIRED) if refresh token is also expired
   * @throws IntegrationError(PERMISSION_DENIED) if the app was de-authorized
   */
  refreshTokens(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Validate that the current access token is still usable.
   * Makes a lightweight API call to verify liveness.
   *
   * @param tokens Current (decrypted) tokens
   * @returns TokenValidationResult — includes expiry and granted scopes
   */
  validateTokens(tokens: OAuthTokens): Promise<TokenValidationResult>;

  // -------------------------------------------------------------------------
  // Account
  // -------------------------------------------------------------------------

  /**
   * Fetch normalized profile / page / channel info from the platform.
   * Used when first connecting an account and during periodic sync.
   *
   * @param tokens Current (decrypted) tokens
   * @returns SocialAccountInfo to be persisted in ConnectedAccount
   */
  getAccountInfo(tokens: OAuthTokens): Promise<SocialAccountInfo>;

  // -------------------------------------------------------------------------
  // Publishing
  // -------------------------------------------------------------------------

  /**
   * Publish a post to the platform.
   * Implementations must handle multi-step flows (e.g. Instagram media container)
   * and media uploads internally.
   *
   * @param tokens   Current (decrypted) tokens
   * @param post     Platform-agnostic post payload
   * @returns PublishResult with the platform post ID and URL
   * @throws IntegrationError(TOKEN_EXPIRED) on 401
   * @throws IntegrationError(PERMISSION_DENIED) on 403
   * @throws IntegrationError(RATE_LIMITED) on 429 — includes retryAfterSeconds
   * @throws IntegrationError(CONTENT_REJECTED) when platform rejects content
   * @throws IntegrationError(PLATFORM_ERROR) on 5xx
   */
  publishPost(tokens: OAuthTokens, post: PlatformPostPayload): Promise<PublishResult>;

  /**
   * Delete a previously published post.
   *
   * @param tokens          Current (decrypted) tokens
   * @param platformPostId  The ID returned by publishPost()
   * @throws IntegrationError if deletion fails
   */
  deletePost(tokens: OAuthTokens, platformPostId: string): Promise<void>;

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  /**
   * Fetch engagement metrics for a specific post.
   * Returns null if the platform does not expose metrics for this post type.
   *
   * @param tokens          Current (decrypted) tokens
   * @param platformPostId  The platform post ID
   */
  getPostMetrics(tokens: OAuthTokens, platformPostId: string): Promise<PostMetrics | null>;

  /**
   * Fetch account-level metrics (followers, following, post count).
   * Returns null if the platform does not expose account metrics.
   *
   * @param tokens Current (decrypted) tokens
   */
  getAccountMetrics(tokens: OAuthTokens): Promise<AccountMetrics | null>;

  // -------------------------------------------------------------------------
  // Introspection
  // -------------------------------------------------------------------------

  /**
   * Return static metadata describing what this platform supports.
   * Used to filter available options in the UI and validate payloads.
   */
  getSupportedFeatures(): PlatformFeatures;

  /**
   * Validate a post payload against platform-specific rules before publishing.
   * Returns an array of errors/warnings; empty array means content is valid.
   *
   * @param post The post payload to validate
   */
  validateContent(post: PlatformPostPayload): ContentValidationResult[];
}
