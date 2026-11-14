// =============================================================================
// Threads API (Meta) Integration
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
  ThreadsTokenResponse,
  ThreadsLongLivedTokenResponse,
  ThreadsUserResponse,
  ThreadsContainerResponse,
  ThreadsPublishResponse,
  ThreadsContainerStatusResponse,
  ThreadsInsightsResponse,
} from './threads.types.js';

export interface ThreadsConfig {
  appId: string;
  appSecret: string;
}

export class ThreadsIntegration extends BaseSocialPlatformIntegration {
  readonly platform: Platform = 'THREADS';

  private readonly appId: string;
  private readonly appSecret: string;

  constructor(config?: ThreadsConfig) {
    super('https://graph.threads.net/v1.0');
    this.appId = config?.appId || process.env.THREADS_APP_ID || '';
    this.appSecret = config?.appSecret || process.env.THREADS_APP_SECRET || '';
  }

  // -------------------------------------------------------------------------
  // OAuth
  // -------------------------------------------------------------------------

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const scopes = [
      'threads_basic',
      'threads_content_publish',
      'threads_read_replies',
      'threads_manage_replies',
    ].join(',');

    return this.buildUrl('https://threads.net/oauth/authorize', {
      client_id: this.appId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      state,
    });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    try {
      // 1. Exchange short-lived code for short-lived access token
      const params = new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      });

      const shortRes = await axios.post<ThreadsTokenResponse>(
        'https://graph.threads.net/oauth/access_token',
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const shortToken = shortRes.data.access_token;
      const userId = shortRes.data.user_id;

      // 2. Exchange for 60-day long-lived token
      const longRes = await axios.get<ThreadsLongLivedTokenResponse>(
        'https://graph.threads.net/access_token',
        {
          params: {
            grant_type: 'th_exchange_token',
            client_secret: this.appSecret,
            access_token: shortToken,
          },
        },
      );

      const expiresIn = longRes.data.expires_in ?? 5184000;
      return {
        accessToken: longRes.data.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
        extra: {
          threadsUserId: userId,
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    try {
      const res = await axios.get<ThreadsLongLivedTokenResponse>(
        'https://graph.threads.net/refresh_access_token',
        {
          params: {
            grant_type: 'th_refresh_token',
            access_token: refreshToken,
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
      const res = await this.get<ThreadsUserResponse>('/me?fields=id,username', tokens);
      return {
        valid: !!res.data.id,
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
      const res = await this.get<ThreadsUserResponse>(
        '/me?fields=id,username,name,threads_profile_picture_url,threads_biography',
        tokens,
      );

      const user = res.data;
      return {
        platformAccountId: user.id,
        accountName: user.name || user.username,
        accountUsername: user.username,
        accountImageUrl: user.threads_profile_picture_url,
        accountType: 'profile',
        metadata: {
          threadsUserId: user.id,
          bio: user.threads_biography,
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Publishing (Two-Step: Create Container -> Publish Container)
  // -------------------------------------------------------------------------

  async publishPost(tokens: OAuthTokens, post: PlatformPostPayload): Promise<PublishResult> {
    const userId =
      (tokens.extra?.platformAccountId as string) ||
      (tokens.extra?.threadsUserId as string) ||
      'me';

    try {
      let containerId: string;

      // 1. CAROUSEL POST
      if (post.contentType === 'CAROUSEL' && post.media && post.media.length > 1) {
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
            itemPayload.media_type = 'IMAGE';
            itemPayload.image_url = item.url;
          }

          const childRes = await this.post<ThreadsContainerResponse>(
            `/${userId}/threads`,
            itemPayload,
            tokens,
          );
          childContainerIds.push(childRes.data.id);

          if (isVideo) {
            await this.waitForContainer(childRes.data.id, tokens);
          }
        }

        const carouselRes = await this.post<ThreadsContainerResponse>(
          `/${userId}/threads`,
          {
            media_type: 'CAROUSEL',
            children: childContainerIds.join(','),
            text: post.caption,
          },
          tokens,
        );
        containerId = carouselRes.data.id;
      }
      // 2. VIDEO POST
      else if (post.contentType === 'VIDEO' && post.media?.[0]?.url) {
        const videoRes = await this.post<ThreadsContainerResponse>(
          `/${userId}/threads`,
          {
            media_type: 'VIDEO',
            video_url: post.media[0].url,
            text: post.caption,
          },
          tokens,
        );
        containerId = videoRes.data.id;
        await this.waitForContainer(containerId, tokens);
      }
      // 3. IMAGE POST
      else if (post.contentType === 'IMAGE' && post.media?.[0]?.url) {
        const imgRes = await this.post<ThreadsContainerResponse>(
          `/${userId}/threads`,
          {
            media_type: 'IMAGE',
            image_url: post.media[0].url,
            text: post.caption,
          },
          tokens,
        );
        containerId = imgRes.data.id;
      }
      // 4. TEXT ONLY POST
      else {
        const textRes = await this.post<ThreadsContainerResponse>(
          `/${userId}/threads`,
          {
            media_type: 'TEXT',
            text: post.caption,
          },
          tokens,
        );
        containerId = textRes.data.id;
      }

      // Step 2: Publish Container
      const publishRes = await this.post<ThreadsPublishResponse>(
        `/${userId}/threads_publish`,
        {
          creation_id: containerId,
        },
        tokens,
      );

      const threadPostId = publishRes.data.id;
      return {
        platformPostId: threadPostId,
        platformPostUrl: `https://www.threads.net/t/${threadPostId}`,
        rawResponse: publishRes.data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  private async waitForContainer(
    containerId: string,
    tokens: OAuthTokens,
    maxWaitMs = 60000,
  ): Promise<void> {
    const startTime = Date.now();
    const interval = 3000;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, interval));

      const res = await this.get<ThreadsContainerStatusResponse>(
        `/${containerId}?fields=id,status,error_message`,
        tokens,
      );

      const status = res.data.status;
      if (status === 'FINISHED') {
        return;
      }

      if (status === 'ERROR' || status === 'EXPIRED') {
        throw new IntegrationError(
          `Threads container processing failed: ${res.data.error_message || status}`,
          'CONTENT_REJECTED',
        );
      }
    }

    throw new IntegrationError('Threads container processing timed out after 60s', 'PLATFORM_ERROR');
  }

  async deletePost(_tokens: OAuthTokens, _platformPostId: string): Promise<void> {
    throw new IntegrationError(
      'Threads API does not support post deletion via API.',
      'PERMISSION_DENIED',
    );
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  async getPostMetrics(tokens: OAuthTokens, platformPostId: string): Promise<PostMetrics | null> {
    try {
      const res = await this.get<ThreadsInsightsResponse>(
        `/${platformPostId}/insights?metric=views,likes,replies,reposts,quotes`,
        tokens,
      );

      const metricsMap: Record<string, number> = {};
      for (const item of res.data.data) {
        metricsMap[item.name] = item.values[0]?.value ?? 0;
      }

      return {
        views: metricsMap.views,
        likes: metricsMap.likes,
        comments: metricsMap.replies,
        shares: (metricsMap.reposts ?? 0) + (metricsMap.quotes ?? 0),
        raw: metricsMap,
      };
    } catch {
      return null;
    }
  }

  async getAccountMetrics(_tokens: OAuthTokens): Promise<AccountMetrics | null> {
    return null;
  }

  // -------------------------------------------------------------------------
  // Capabilities & Validation
  // -------------------------------------------------------------------------

  getSupportedFeatures(): PlatformFeatures {
    return {
      supportedContentTypes: ['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL'],
      maxCaptionLength: 500,
      maxMediaItems: 10,
      requiresAppReview: true,
      rateLimits: {
        postsPerDay: 250,
        requestsPerSecond: 100,
      },
      unsupported: [
        {
          feature: 'DELETE_POST',
          reason: 'Threads API does not support deleting posts.',
        },
      ],
      notes: [
        'Post text is strictly limited to 500 characters.',
        'Carousels support up to 10 images or videos.',
        'Rate limit is 250 published posts per 24 hours per user.',
      ],
    };
  }

  validateContent(post: PlatformPostPayload): ContentValidationResult[] {
    const results: ContentValidationResult[] = [];

    if (post.caption && post.caption.length > 500) {
      results.push({
        field: 'caption',
        message: 'Threads posts are limited to 500 characters.',
        severity: 'error',
      });
    }

    if (post.contentType === 'CAROUSEL' && (!post.media || post.media.length < 2 || post.media.length > 10)) {
      results.push({
        field: 'media',
        message: 'Threads carousel requires between 2 and 10 media items.',
        severity: 'error',
      });
    }

    return results;
  }
}
