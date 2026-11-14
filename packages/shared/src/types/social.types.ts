// =============================================================================
// Social Account / Platform Connection Types
// =============================================================================

import type { Platform } from "@scope/config";

export type TokenType = "oauth2" | "api_key";

export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: Platform;
  platformAccountId: string;
  platformUsername: string;
  platformDisplayName: string;
  platformAvatarUrl: string | null;
  /** Encrypted access token (AES-256-GCM) */
  accessTokenEncrypted: string;
  /** Encrypted refresh token — may be null for platforms that don't issue one */
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
  tokenType: TokenType;
  scopes: string[];
  isActive: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe version without encrypted token fields — for API responses */
export type SocialAccountPublic = Omit<
  SocialAccount,
  "accessTokenEncrypted" | "refreshTokenEncrypted"
>;

export interface ConnectSocialAccountInput {
  platform: Platform;
  code: string; // OAuth authorization code
  redirectUri: string;
}

export interface OAuthState {
  workspaceId: string;
  platform: Platform;
  redirectUri: string;
  nonce: string; // CSRF protection
}

export interface PlatformTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes: string[];
}
