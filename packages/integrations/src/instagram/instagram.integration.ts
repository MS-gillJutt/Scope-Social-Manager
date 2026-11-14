// =============================================================================
// Instagram Graph API Integration (Professional / Business / Creator)
// =============================================================================

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
  InstagramContainerResponse,
  InstagramPublishResponse,
  InstagramContainerStatusResponse,
  InstagramMediaInsightsResponse,
  InstagramAccountDetailsResponse,
  InstagramAccountsQueryResponse,
} from './instagram.types.js';

export interface InstagramConfig {
  appId: string;
  appSecret: string;
}

export class InstagramIntegration extends BaseSocialPlatformIntegration {
  readonly platform: Platform = 'INSTAGRAM';

  private readonly appId: string;
  private readonly appSecret: string;
  private readonly apiVersion = 'v19.0';

  constructor(config?: InstagramConfig) {
    super('https://graph.facebook.com/v19.0');
    this.appId =
      config?.appId ||
      process.env.INSTAGRAM_APP_ID ||
      process.env.FACEBOOK_APP_ID ||
      '';
    this.appSecret =
      config?.appSecret ||
      process.env.INSTAGRAM_APP_SECRET ||
      process.env.FACEBOOK_APP_SECRET ||
      '';
  }

  // -------------------------------------------------------------------------
  // OAuth (Flows through Facebook OAuth dialog with Instagram scopes)
  // -------------------------------------------------------------------------

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');

    return this.buildUrl(`https://www.facebook.com/${this.apiVersion}/dialog/oauth`, {
      client_id: this.appId,
      redirect_uri: redirectUri,
      state,
      scope: scopes,
      response_type: 'code',
    });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    try {
      const shortLivedRes = await this.http.get<{ access_token: string; expires_in?: number }>(
        '/oauth/access_token',
        {
          params: {
            client_id: this.appId,
            client_secret: this.appSecret,
            redirect_uri: redirectUri,
            code,
          },
        },
      );

      const shortLivedToken = shortLivedRes.data.access_token;

      // Exchange for 60-day long-lived token
      const longLivedRes = await this.http.get<{ access_token: string; expires_in?: number }>(
        '/oauth/access_token',
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.appId,
            client_secret: this.appSecret,
            fb_exchange_token: shortLivedToken,
          },
        },
      );

      const expiresIn = longLivedRes.data.expires_in ?? 5184000;
      return {
        accessToken: longLivedRes.data.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    try {
      const res = await this.http.get<{ access_token: string; expires_in?: number }>(
        '/oauth/access_token',
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.appId,
            client_secret: this.appSecret,
            fb_exchange_token: refreshToken,
          },
        },
      );

      const expiresIn = res.data.expires_in ?? 5184000;
      return {
        accessToken: res.data.access_token,
        refreshToken: res.data.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async validateTokens(tokens: OAuthTokens): Promise<TokenValidationResult> {
    try {
      const res = await this.http.get<{
        data: { is_valid: boolean; expires_at: number; scopes: string[] };
      }>('/debug_token', {
        params: {
          input_token: tokens.accessToken,
          access_token: `${this.appId}|${this.appSecret}`,
        },
      });

      const data = res.data.data;
      const now = Math.floor(Date.now() / 1000);
      const isExpired = data.expires_at > 0 && data.expires_at <= now + 300;

      return {
        valid: data.is_valid && !isExpired,
        expired: isExpired,
        expiresAt: data.expires_at || undefined,
        scopes: data.scopes,
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

  /**
   * Finds the connected Instagram Business/Creator Account via Facebook Pages
   */
  async getAccountInfo(tokens: OAuthTokens): Promise<SocialAccountInfo> {
    try {
      const res = await this.get<InstagramAccountsQueryResponse>(
        '/me/accounts?fields=id,name,instagram_business_account{id,username,name,profile_picture_url}',
        tokens,
      );

      const pages = res.data.data;
      const pageWithIg = pages.find((p) => p.instagram_business_account?.id);

      if (!pageWithIg || !pageWithIg.instagram_business_account) {
        throw new IntegrationError(
          'No Instagram Business or Creator account found. Please link your Instagram Professional account to a Facebook Page first.',
          'PERMISSION_DENIED',
        );
      }

      const igAccount = pageWithIg.instagram_business_account;
      return {
        platformAccountId: igAccount.id,
        accountName: igAccount.name || igAccount.username,
        accountUsername: igAccount.username,
        accountImageUrl: igAccount.profile_picture_url,
        accountType: 'business',
        metadata: {
          connectedFacebookPageId: pageWithIg.id,
          connectedFacebookPageName: pageWithIg.name,
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Publishing (Two-Step Process: Container Creation -> Container Publication)
  // -------------------------------------------------------------------------

  async publishPost(tokens: OAuthTokens, post: PlatformPostPayload): Promise<PublishResult> {
    const igUserId =
      (tokens.extra?.platformAccountId as string) ||
      (tokens.extra?.igUserId as string);

    if (!igUserId) {
      // If not passed in extra, fetch it
      const account = await this.getAccountInfo(tokens);
      return this.publishToAccount(account.platformAccountId, tokens, post);
    }

    return this.publishToAccount(igUserId, tokens, post);
  }

  private async publishToAccount(
    igUserId: string,
    tokens: OAuthTokens,
    post: PlatformPostPayload,
  ): Promise<PublishResult> {
    try {
      let containerId: string;

      // 1. CAROUSEL POST
      if (post.contentType === 'CAROUSEL' && post.media && post.media.length > 1) {
        // Step 1a: Create container for each carousel item
        const childContainerIds: string[] = [];
        for (const item of post.media) {
          const isVideo = item.mimeType?.startsWith('video/') || item.url.includes('.mp4');
          const itemPayload: Record<string, unknown> = {
            is_carousel_item: true,
          };

          if (isVideo) {
            itemPayload.media_type = 'VIDEO';
            itemPayload.video_url = item.url;
          } else {
            itemPayload.image_url = item.url;
          }

          const childRes = await this.post<InstagramContainerResponse>(
            `/${igUserId}/media`,
            itemPayload,
            tokens,
          );
          childContainerIds.push(childRes.data.id);

          // For video items inside carousel, wait for processing
          if (isVideo) {
            await this.waitForContainer(childRes.data.id, tokens);
          }
        }

        // Step 1b: Create carousel container
        const carouselRes = await this.post<InstagramContainerResponse>(
          `/${igUserId}/media`,
          {
            media_type: 'CAROUSEL',
            children: childContainerIds.join(','),
            caption: post.caption,
          },
          tokens,
        );
        containerId = carouselRes.data.id;
      }
      // 2. VIDEO / REELS POST
      else if (
        (post.contentType === 'VIDEO' || post.contentType === 'REEL') &&
        post.media?.[0]?.url
      ) {
        const isReel = post.contentType === 'REEL';
        const containerRes = await this.post<InstagramContainerResponse>(
          `/${igUserId}/media`,
          {
            media_type: isReel ? 'REELS' : 'VIDEO',
            video_url: post.media[0].url,
            caption: post.caption,
            share_to_feed: post.platformOptions?.shareToFeed ?? true,
          },
          tokens,
        );

        containerId = containerRes.data.id;
        // Wait for video processing before publishing
        await this.waitForContainer(containerId, tokens);
      }
      // 3. SINGLE IMAGE POST
      else if (post.media?.[0]?.url) {
        const containerRes = await this.post<InstagramContainerResponse>(
          `/${igUserId}/media`,
          {
            image_url: post.media[0].url,
            caption: post.caption,
          },
          tokens,
        );
        containerId = containerRes.data.id;
      } else {
        throw new IntegrationError(
          'Instagram does not support text-only posts. An image or video is required.',
          'CONTENT_REJECTED',
        );
      }

      // Step 2: Publish container
      const publishRes = await this.post<InstagramPublishResponse>(
        `/${igUserId}/media_publish`,
        {
          creation_id: containerId,
        },
        tokens,
      );

      const mediaId = publishRes.data.id;
      return {
        platformPostId: mediaId,
        platformPostUrl: `https://www.instagram.com/p/${mediaId}`,
        rawResponse: publishRes.data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  /**
   * Polls container status until video is finished processing (max 60 seconds)
   */
  private async waitForContainer(
    containerId: string,
    tokens: OAuthTokens,
    maxWaitMs = 60000,
  ): Promise<void> {
    const startTime = Date.now();
    const interval = 3000;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      const res = await this.get<InstagramContainerStatusResponse>(
        `/${containerId}?fields=status_code,status`,
        tokens,
      );

      const status = res.data.status_code;
      if (status === 'FINISHED') {
        return;
      }

      if (status === 'ERROR' || status === 'EXPIRED') {
        throw new IntegrationError(
          `Instagram media container processing failed with status: ${status}`,
          'CONTENT_REJECTED',
        );
      }
    }

    throw new IntegrationError(
      'Instagram media container processing timed out after 60s',
      'PLATFORM_ERROR',
    );
  }

  /**
   * Post deletion is NOT supported by Instagram Graph API
   */
  async deletePost(_tokens: OAuthTokens, _platformPostId: string): Promise<void> {
    throw new IntegrationError(
      'Instagram Graph API does not support post deletion via API. Posts must be deleted directly within the Instagram app.',
      'PERMISSION_DENIED',
    );
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  async getPostMetrics(tokens: OAuthTokens, platformPostId: string): Promise<PostMetrics | null> {
    try {
      const res = await this.get<InstagramMediaInsightsResponse>(
        `/${platformPostId}/insights?metric=impressions,reach,saved,engagement,video_views`,
        tokens,
      );

      const metrics: Record<string, number> = {};
      for (const item of res.data.data) {
        metrics[item.name] = item.values[0]?.value ?? 0;
      }

      return {
        impressions: metrics.impressions,
        reach: metrics.reach,
        saves: metrics.saved,
        engagements: metrics.engagement,
        videoViews: metrics.video_views,
        raw: metrics,
      };
    } catch {
      return null;
    }
  }

  async getAccountMetrics(tokens: OAuthTokens): Promise<AccountMetrics | null> {
    const igUserId =
      (tokens.extra?.platformAccountId as string) ||
      (tokens.extra?.igUserId as string);

    if (!igUserId) return null;

    try {
      const res = await this.get<InstagramAccountDetailsResponse>(
        `/${igUserId}?fields=followers_count,follows_count,media_count`,
        tokens,
      );

      return {
        followers: res.data.followers_count,
        following: res.data.follows_count,
        posts: res.data.media_count,
        raw: res.data as unknown as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Features & Validation
  // -------------------------------------------------------------------------

  getSupportedFeatures(): PlatformFeatures {
    return {
      supportedContentTypes: ['IMAGE', 'VIDEO', 'CAROUSEL', 'REEL'],
      maxCaptionLength: 2200,
      maxMediaItems: 10,
      requiresAppReview: true,
      rateLimits: {
        postsPerDay: 25, // 25 API-published posts per 24 hours per user
        requestsPerSecond: 200,
      },
      unsupported: [
        {
          feature: 'TEXT',
          reason: 'Instagram requires visual media for every post. Text-only posts are not possible.',
        },
        {
          feature: 'STORY',
          reason: 'Instagram Stories require a dedicated Story endpoint and are not supported via the standard media endpoint.',
        },
        {
          feature: 'DELETE_POST',
          reason: 'Instagram Graph API does not provide a post deletion endpoint.',
        },
      ],
      notes: [
        'Requires an Instagram Professional Account (Business or Creator) linked to a Facebook Page.',
        'Media URLs must be publicly accessible (Cloudflare R2 signed URLs are recommended).',
        'Strict 25 post per 24-hour publishing limit enforced by Meta.',
      ],
    };
  }

  validateContent(post: PlatformPostPayload): ContentValidationResult[] {
    const results: ContentValidationResult[] = [];

    if (post.contentType === 'TEXT') {
      results.push({
        field: 'contentType',
        message: 'Instagram does not support text-only posts. Please attach an image or video.',
        severity: 'error',
      });
    }

    if (post.contentType === 'STORY') {
      results.push({
        field: 'contentType',
        message: 'Stories publishing is not supported via the standard Instagram Graph API.',
        severity: 'error',
      });
    }

    if (post.caption && post.caption.length > 2200) {
      results.push({
        field: 'caption',
        message: 'Instagram captions are limited to 2,200 characters.',
        severity: 'error',
      });
    }

    if (post.hashtags && post.hashtags.length > 30) {
      results.push({
        field: 'hashtags',
        message: 'Instagram posts allow a maximum of 30 hashtags.',
        severity: 'error',
      });
    }

    if (post.contentType === 'CAROUSEL' && (!post.media || post.media.length < 2 || post.media.length > 10)) {
      results.push({
        field: 'media',
        message: 'Instagram carousel posts must contain between 2 and 10 media items.',
        severity: 'error',
      });
    }

    return results;
  }
}
