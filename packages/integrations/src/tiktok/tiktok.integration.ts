// =============================================================================
// TikTok Content Posting API Integration
// =============================================================================

import axios from 'axios';
import { BaseSocialPlatformIntegration } from '../base/base-integration.js';
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
} from '../base/integration.types.js';
import { IntegrationError } from '../base/integration.types.js';
import type {
  TikTokTokenResponse,
  TikTokUserInfoResponse,
  TikTokPublishInitRequest,
  TikTokPublishInitResponse,
  TikTokPublishStatusResponse,
} from './tiktok.types.js';

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
}

export class TikTokIntegration extends BaseSocialPlatformIntegration {
  readonly platform: Platform = 'TIKTOK';

  private readonly clientKey: string;
  private readonly clientSecret: string;

  constructor(config?: TikTokConfig) {
    super('https://open.tiktokapis.com');
    this.clientKey = config?.clientKey || process.env.TIKTOK_CLIENT_KEY || '';
    this.clientSecret = config?.clientSecret || process.env.TIKTOK_CLIENT_SECRET || '';
  }

  // -------------------------------------------------------------------------
  // OAuth
  // -------------------------------------------------------------------------

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const scopes = ['user.info.basic', 'video.publish', 'video.upload'].join(',');

    return this.buildUrl('https://www.tiktok.com/v2/auth/authorize/', {
      client_key: this.clientKey,
      scope: scopes,
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
    });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    try {
      const params = new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      const res = await axios.post<TikTokTokenResponse>(
        'https://open.tiktokapis.com/v2/oauth/token/',
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const data = res.data;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
        scope: data.scope,
        extra: {
          openId: data.open_id,
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    try {
      const params = new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const res = await axios.post<TikTokTokenResponse>(
        'https://open.tiktokapis.com/v2/oauth/token/',
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const data = res.data;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
        scope: data.scope,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async validateTokens(tokens: OAuthTokens): Promise<TokenValidationResult> {
    try {
      const res = await this.get<TikTokUserInfoResponse>(
        '/v2/user/info/?fields=open_id,display_name',
        tokens,
      );

      return {
        valid: res.data.error.code === 'ok',
        expired: false,
        expiresAt: tokens.expiresAt,
      };
    } catch (error) {
      return {
        valid: false,
        expired: true,
        errorMessage: (error as Error).message,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Account Info
  // -------------------------------------------------------------------------

  async getAccountInfo(tokens: OAuthTokens): Promise<SocialAccountInfo> {
    try {
      const res = await this.get<TikTokUserInfoResponse>(
        '/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,is_verified',
        tokens,
      );

      if (res.data.error.code !== 'ok') {
        throw new IntegrationError(
          `TikTok API error: ${res.data.error.message}`,
          'PLATFORM_ERROR',
        );
      }

      const user = res.data.data.user;
      return {
        platformAccountId: user.open_id,
        accountName: user.display_name,
        accountImageUrl: user.avatar_url,
        accountType: 'profile',
        metadata: {
          openId: user.open_id,
          unionId: user.union_id,
          bio: user.bio_description,
          isVerified: user.is_verified,
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Publishing (PULL mode via signed public URL)
  // -------------------------------------------------------------------------

  async publishPost(tokens: OAuthTokens, post: PlatformPostPayload): Promise<PublishResult> {
    if (post.contentType !== 'VIDEO' || !post.media?.[0]?.url) {
      throw new IntegrationError(
        'TikTok Content Posting API only supports VIDEO content. Video URL is required.',
        'CONTENT_REJECTED',
      );
    }

    try {
      const videoItem = post.media[0];
      const privacyLevel =
        (post.platformOptions?.privacyLevel as TikTokPublishInitRequest['post_info']['privacy_level']) ||
        'PUBLIC_TO_EVERYONE';

      // 1. Initialize video upload in PULL mode
      const initPayload: TikTokPublishInitRequest = {
        post_info: {
          title: post.caption || post.title || '',
          privacy_level: privacyLevel,
          disable_duet: (post.platformOptions?.disableDuet as boolean) ?? false,
          disable_stitch: (post.platformOptions?.disableStitch as boolean) ?? false,
          disable_comment: (post.platformOptions?.disableComment as boolean) ?? false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoItem.url,
        },
      };

      const initRes = await this.post<TikTokPublishInitResponse>(
        '/v2/post/publish/video/init/',
        initPayload,
        tokens,
      );

      if (initRes.data.error.code !== 'ok') {
        throw new IntegrationError(
          `TikTok video publish initiation failed: ${initRes.data.error.message}`,
          'PLATFORM_ERROR',
        );
      }

      const publishId = initRes.data.data.publish_id;

      // 2. Poll publish status (wait up to 30s for download)
      const postDetails = await this.pollPublishStatus(publishId, tokens);

      const postId = postDetails.publicaly_available_post_id?.[0] || publishId;

      return {
        platformPostId: postId,
        platformPostUrl: `https://www.tiktok.com/`,
        rawResponse: initRes.data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  private async pollPublishStatus(
    publishId: string,
    tokens: OAuthTokens,
    maxWaitMs = 30000,
  ): Promise<TikTokPublishStatusResponse['data']> {
    const startTime = Date.now();
    const interval = 3000;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      const res = await this.post<TikTokPublishStatusResponse>(
        '/v2/post/publish/status/fetch/',
        { publish_id: publishId },
        tokens,
      );

      const status = res.data.data.status;
      if (status === 'SUCCESS') {
        return res.data.data;
      }

      if (status === 'FAILED') {
        throw new IntegrationError(
          `TikTok video publishing failed: ${res.data.data.fail_reason || 'Unknown reason'}`,
          'CONTENT_REJECTED',
        );
      }
    }

    // Still in progress, return publishId as provisional
    return { status: 'PROCESSING_DOWNLOAD' };
  }

  async deletePost(_tokens: OAuthTokens, _platformPostId: string): Promise<void> {
    throw new IntegrationError(
      'TikTok API does not support programmatic video deletion. Videos must be deleted in the TikTok app.',
      'PERMISSION_DENIED',
    );
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  async getPostMetrics(_tokens: OAuthTokens, _platformPostId: string): Promise<PostMetrics | null> {
    // TikTok video metrics via API require separate Research API approval or Commercial Content API
    return null;
  }

  async getAccountMetrics(_tokens: OAuthTokens): Promise<AccountMetrics | null> {
    return null;
  }

  // -------------------------------------------------------------------------
  // Capabilities & Validation
  // -------------------------------------------------------------------------

  getSupportedFeatures(): PlatformFeatures {
    return {
      supportedContentTypes: ['VIDEO'],
      maxCaptionLength: 2200,
      maxMediaItems: 1,
      requiresAppReview: true,
      rateLimits: {
        postsPerDay: 50,
        requestsPerSecond: 10,
      },
      unsupported: [
        {
          feature: 'TEXT',
          reason: 'TikTok does not support text-only posts.',
        },
        {
          feature: 'IMAGE',
          reason: 'Photo mode publishing requires additional TikTok API permissions.',
        },
        {
          feature: 'DELETE_POST',
          reason: 'TikTok Content Posting API does not provide post deletion.',
        },
      ],
      notes: [
        'Requires TikTok App Review for production publishing.',
        'Video file must be publicly accessible URL for PULL mode ingestion.',
        'Supports privacy controls: public, mutual friends, follower only, self only.',
      ],
    };
  }

  validateContent(post: PlatformPostPayload): ContentValidationResult[] {
    const results: ContentValidationResult[] = [];

    if (post.contentType !== 'VIDEO') {
      results.push({
        field: 'contentType',
        message: 'TikTok only supports VIDEO content.',
        severity: 'error',
      });
    }

    if (post.caption && post.caption.length > 2200) {
      results.push({
        field: 'caption',
        message: 'TikTok caption cannot exceed 2,200 characters.',
        severity: 'error',
      });
    }

    if (!post.media || post.media.length === 0) {
      results.push({
        field: 'media',
        message: 'TikTok upload requires a video file.',
        severity: 'error',
      });
    }

    return results;
  }
}
