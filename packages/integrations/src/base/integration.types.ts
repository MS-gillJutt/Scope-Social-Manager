// =============================================================================
// Integration Types — All shared types for social platform integrations
// =============================================================================

/** Supported social media platforms */
export type Platform =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'THREADS'
  | 'LINKEDIN'
  | 'YOUTUBE'
  | 'REDDIT'
  | 'WHATSAPP';

/** OAuth tokens returned by platform */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  /** Unix timestamp (seconds) when access token expires */
  expiresAt?: number;
  /** Raw scope string as returned by platform */
  scope?: string;
  /** Additional platform-specific token fields */
  extra?: Record<string, unknown>;
}

/** Result of token validation */
export interface TokenValidationResult {
  valid: boolean;
  /** Whether the token is expired or expiring soon (< 5 min) */
  expired: boolean;
  expiresAt?: number;
  scopes?: string[];
  errorMessage?: string;
}

/** Normalized social account info returned from platform */
export interface SocialAccountInfo {
  /** Platform-specific account/page/channel ID */
  platformAccountId: string;
  /** Display name */
  accountName: string;
  /** Username / handle */
  accountUsername?: string;
  /** Profile image URL */
  accountImageUrl?: string;
  /** e.g. 'page', 'profile', 'channel', 'business' */
  accountType?: string;
  /** Platform-specific extra data */
  metadata?: Record<string, unknown>;
}

/** Type of content to publish */
export type ContentType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'CAROUSEL'
  | 'REEL'
  | 'STORY'
  | 'DOCUMENT'
  | 'LINK';

/** Media item in a post */
export interface MediaItem {
  /** Publicly accessible URL for the media */
  url: string;
  /** MIME type, e.g. 'image/jpeg', 'video/mp4' */
  mimeType?: string;
  /** Alt text for images */
  altText?: string;
  /** Thumbnail URL (video) */
  thumbnailUrl?: string;
}

/** Platform-agnostic post payload sent to publishPost() */
export interface PlatformPostPayload {
  contentType: ContentType;
  /** Main caption / body text */
  caption?: string;
  /** Post title (YouTube, Reddit, LinkedIn) */
  title?: string;
  /** Link URL (Facebook link posts, Reddit link posts) */
  linkUrl?: string;
  /** Media attachments */
  media?: MediaItem[];
  /** Hashtags (without #) */
  hashtags?: string[];
  /** Platform-specific options (e.g. subreddit, privacy, category) */
  platformOptions?: Record<string, unknown>;
}

/** Result of a successful publish */
export interface PublishResult {
  /** Platform-assigned post/video ID */
  platformPostId: string;
  /** URL to view the published post */
  platformPostUrl?: string;
  /** Raw platform API response (sanitized — no tokens) */
  rawResponse?: Record<string, unknown>;
  /**
   * True when the platform has NO publish API and the post needs a human to
   * finish it in the platform's own app (WhatsApp Status). The worker marks
   * the PlatformPost NEEDS_MANUAL_ACTION instead of PUBLISHED, and the
   * composer shows the manual-action card. Never set alongside a real
   * platformPostUrl.
   */
  requiresManualAction?: boolean;
  /** What the user must do in the platform's app (shown in the composer) */
  manualActionNote?: string;
}

/** Post-level engagement metrics */
export interface PostMetrics {
  impressions?: number;
  reach?: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  saves?: number;
  engagements?: number;
  /** Video-specific */
  videoViews?: number;
  watchTimeSeconds?: number;
  /** Raw platform metrics */
  raw?: Record<string, unknown>;
}

/** Account-level metrics */
export interface AccountMetrics {
  followers?: number;
  following?: number;
  posts?: number;
  views?: number;
  raw?: Record<string, unknown>;
}

/** Platform feature capabilities */
export interface PlatformFeatures {
  supportedContentTypes: ContentType[];
  /** Maximum caption length in characters */
  maxCaptionLength?: number;
  /** Maximum number of media items per post */
  maxMediaItems?: number;
  /** Whether posting to this platform requires app review */
  requiresAppReview?: boolean;
  /** Rate limit info */
  rateLimits?: {
    postsPerDay?: number;
    requestsPerSecond?: number;
  };
  /** Features explicitly NOT supported, with reason */
  unsupported?: Array<{
    feature: string;
    reason: string;
  }>;
  /** Any extra platform-specific notes */
  notes?: string[];
}

/** Result of content validation before publishing */
export interface ContentValidationResult {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type IntegrationErrorCode =
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'
  | 'PLATFORM_ERROR'
  | 'CONTENT_REJECTED'
  | 'NETWORK_ERROR'
  | 'NOT_SUPPORTED'
  | 'UNKNOWN';

export class IntegrationError extends Error {
  public readonly code: IntegrationErrorCode;
  public readonly statusCode?: number;
  public readonly retryAfterSeconds?: number;
  public readonly platformMessage?: string;

  constructor(
    message: string,
    code: IntegrationErrorCode,
    options?: {
      statusCode?: number;
      retryAfterSeconds?: number;
      platformMessage?: string;
    },
  ) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.retryAfterSeconds = options?.retryAfterSeconds;
    this.platformMessage = options?.platformMessage;
  }
}
