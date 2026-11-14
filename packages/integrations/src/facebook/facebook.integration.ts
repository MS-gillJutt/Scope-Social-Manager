// =============================================================================
// Facebook Graph API Integration
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
  FacebookAccountsResponse,
  FacebookOAuthTokenResponse,
  FacebookDebugTokenResponse,
  FacebookFeedPostResponse,
  FacebookPostInsightsResponse,
  FacebookPageDetailsResponse,
} from './facebook.types.js';

export interface FacebookConfig {
  appId: string;
  appSecret: string;
}

export class FacebookIntegration extends BaseSocialPlatformIntegration {
  readonly platform: Platform = 'FACEBOOK';

  private readonly appId: string;
  private readonly appSecret: string;
  private readonly apiVersion = 'v19.0';
  private readonly graphBaseUrl = 'https://graph.facebook.com/v19.0';

  constructor(config?: FacebookConfig) {
    super('https://graph.facebook.com/v19.0');
    this.appId = config?.appId || process.env.FACEBOOK_APP_ID || '';
    this.appSecret = config?.appSecret || process.env.FACEBOOK_APP_SECRET || '';
  }

  // -------------------------------------------------------------------------
  // OAuth
  // -------------------------------------------------------------------------

  /**
   * Generates Facebook OAuth URL with required page management and instagram scopes
   */
  getAuthorizationUrl(state: string, redirectUri: string): string {
    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'pages_read_user_content',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',');

    return this.buildUrl(`https://www.facebook.com/${this.apiVersion}/dialog/oauth`, {
      client_id: this.appId,
      redirect_uri: redirectUri,
      state,
      scope: scopes,
      response_type: 'code',
    });
  }

  /**
   * Exchanges code for a user access token, then upgrades to a long-lived user token (60 days)
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    try {
      // 1. Exchange short-lived code for user access token
      const shortLivedRes = await this.http.get<FacebookOAuthTokenResponse>('/oauth/access_token', {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: redirectUri,
          code,
        },
      });

      const shortLivedToken = shortLivedRes.data.access_token;

      // 2. Exchange for long-lived user token (60 days)
      const longLivedRes = await this.http.get<FacebookOAuthTokenResponse>('/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      const longLivedToken = longLivedRes.data.access_token;
      const expiresIn = longLivedRes.data.expires_in ?? 5184000; // default 60 days in seconds

      return {
        accessToken: longLivedToken,
        expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
        extra: {
          tokenType: 'user_long_lived',
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  /**
   * Refresh long-lived token via fb_exchange_token
   */
  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    try {
      const response = await this.http.get<FacebookOAuthTokenResponse>('/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: refreshToken,
        },
      });

      const expiresIn = response.data.expires_in ?? 5184000;
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  /**
   * Validates token using the debug_token endpoint
   */
  async validateTokens(tokens: OAuthTokens): Promise<TokenValidationResult> {
    try {
      const res = await this.http.get<FacebookDebugTokenResponse>('/debug_token', {
        params: {
          input_token: tokens.accessToken,
          access_token: `${this.appId}|${this.appSecret}`,
        },
      });

      const data = res.data.data;
      const now = Math.floor(Date.now() / 1000);
      const isExpired = data.expires_at > 0 && data.expires_at <= now + 300; // 5 min buffer

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
  // Account Information
  // -------------------------------------------------------------------------

  /**
   * Fetches connected Facebook Pages. If a specific page ID is provided in extra/metadata,
   * returns that page's info; otherwise returns the first available page and includes
   * all pages in metadata.
   */
  async getAccountInfo(tokens: OAuthTokens): Promise<SocialAccountInfo> {
    try {
      const res = await this.get<FacebookAccountsResponse>(
        '/me/accounts?fields=id,name,access_token,category,picture{url}',
        tokens,
      );

      const pages = res.data.data;
      if (!pages || pages.length === 0) {
        throw new IntegrationError(
          'No Facebook Pages found. You must be an admin of at least one Facebook Page to connect.',
          'PERMISSION_DENIED',
        );
      }

      // Check if target page is specified in tokens.extra
      const targetPageId = tokens.extra?.targetPageId as string | undefined;
      const selectedPage = targetPageId
        ? pages.find((p) => p.id === targetPageId) || pages[0]!
        : pages[0]!;

      return {
        platformAccountId: selectedPage.id,
        accountName: selectedPage.name,
        accountImageUrl: selectedPage.picture?.data?.url,
        accountType: 'page',
        metadata: {
          category: selectedPage.category,
          pageAccessToken: selectedPage.access_token, // Page-specific access token required for publishing
          allPages: pages.map((p) => ({
            id: p.id,
            name: p.name,
            accessToken: p.access_token,
            category: p.category,
            imageUrl: p.picture?.data?.url,
          })),
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Publishing
  // -------------------------------------------------------------------------

  /**
   * Publishes content to Facebook Page feed or videos endpoint.
   * NOTE: Facebook publishing REQUIRES the Page access token, which is either passed
   * in tokens.extra.pageAccessToken or tokens.accessToken if already stored as page token.
   */
  async publishPost(tokens: OAuthTokens, post: PlatformPostPayload): Promise<PublishResult> {
    const pageToken = (tokens.extra?.pageAccessToken as string) || tokens.accessToken;
    const pageId = (tokens.extra?.platformAccountId as string) || (tokens.extra?.pageId as string) || 'me';

    const pageAuthTokens: OAuthTokens = {
      accessToken: pageToken,
    };

    try {
      // 1. VIDEO POST
      if (post.contentType === 'VIDEO' && post.media?.[0]?.url) {
        const videoRes = await this.post<FacebookFeedPostResponse>(
          `/${pageId}/videos`,
          {
            file_url: post.media[0].url,
            description: post.caption,
            title: post.title,
          },
          pageAuthTokens,
        );

        const videoId = videoRes.data.id;
        return {
          platformPostId: videoId,
          platformPostUrl: `https://www.facebook.com/${videoId}`,
          rawResponse: videoRes.data as unknown as Record<string, unknown>,
        };
      }

      // 2. SINGLE IMAGE POST
      if (post.contentType === 'IMAGE' && post.media?.[0]?.url) {
        const photoRes = await this.post<FacebookFeedPostResponse>(
          `/${pageId}/photos`,
          {
            url: post.media[0].url,
            caption: post.caption,
          },
          pageAuthTokens,
        );

        const photoId = photoRes.data.post_id || photoRes.data.id;
        return {
          platformPostId: photoId,
          platformPostUrl: `https://www.facebook.com/${photoId}`,
          rawResponse: photoRes.data as unknown as Record<string, unknown>,
        };
      }

      // 3. TEXT / LINK POST
      const feedPayload: Record<string, unknown> = {
        message: post.caption,
      };

      if (post.linkUrl) {
        feedPayload.link = post.linkUrl;
      }

      const feedRes = await this.post<FacebookFeedPostResponse>(
        `/${pageId}/feed`,
        feedPayload,
        pageAuthTokens,
      );

      const postId = feedRes.data.id;
      return {
        platformPostId: postId,
        platformPostUrl: `https://www.facebook.com/${postId}`,
        rawResponse: feedRes.data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  /**
   * Delete post from Facebook Page
   */
  async deletePost(tokens: OAuthTokens, platformPostId: string): Promise<void> {
    const pageToken = (tokens.extra?.pageAccessToken as string) || tokens.accessToken;
    try {
      await this.deleteRequest(`/${platformPostId}`, { accessToken: pageToken });
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  /**
   * Fetches Facebook post insights: post_impressions, post_engaged_users, post_reactions_by_type_total, post_clicks
   */
  async getPostMetrics(tokens: OAuthTokens, platformPostId: string): Promise<PostMetrics | null> {
    const pageToken = (tokens.extra?.pageAccessToken as string) || tokens.accessToken;
    try {
      const res = await this.get<FacebookPostInsightsResponse>(
        `/${platformPostId}/insights?metric=post_impressions,post_engaged_users,post_reactions_by_type_total,post_clicks`,
        { accessToken: pageToken },
      );

      const metricsMap: Record<string, number> = {};
      for (const item of res.data.data) {
        const val = item.values[0]?.value;
        if (typeof val === 'number') {
          metricsMap[item.name] = val;
        } else if (typeof val === 'object' && val !== null) {
          // e.g. reactions by type total: sum all reaction counts
          const total = Object.values(val).reduce((a, b) => a + (Number(b) || 0), 0);
          metricsMap[item.name] = total;
        }
      }

      return {
        impressions: metricsMap.post_impressions,
        reach: metricsMap.post_impressions, // Facebook Graph API uses impressions/reach
        engagements: metricsMap.post_engaged_users,
        likes: metricsMap.post_reactions_by_type_total,
        clicks: metricsMap.post_clicks,
        raw: metricsMap,
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetches Facebook Page follower counts
   */
  async getAccountMetrics(tokens: OAuthTokens): Promise<AccountMetrics | null> {
    const pageToken = (tokens.extra?.pageAccessToken as string) || tokens.accessToken;
    const pageId = (tokens.extra?.platformAccountId as string) || 'me';
    try {
      const res = await this.get<FacebookPageDetailsResponse>(
        `/${pageId}?fields=fan_count,followers_count`,
        { accessToken: pageToken },
      );

      return {
        followers: res.data.followers_count ?? res.data.fan_count,
        raw: res.data as unknown as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Capabilities & Validation
  // -------------------------------------------------------------------------

  getSupportedFeatures(): PlatformFeatures {
    return {
      supportedContentTypes: ['TEXT', 'IMAGE', 'VIDEO', 'LINK'],
      maxCaptionLength: 63206,
      maxMediaItems: 10,
      requiresAppReview: true,
      rateLimits: {
        postsPerDay: 100,
        requestsPerSecond: 200,
      },
      unsupported: [
        {
          feature: 'STORY',
          reason: 'Facebook Stories are not supported via the standard Graph API for Pages.',
        },
        {
          feature: 'REEL',
          reason: 'Reels publishing requires a dedicated Facebook Reels API endpoint and approval.',
        },
      ],
      notes: [
        'Publishing requires a Facebook Page access token (automatically managed).',
        'Personal Facebook profiles cannot be published to due to Meta Platform Terms.',
      ],
    };
  }

  validateContent(post: PlatformPostPayload): ContentValidationResult[] {
    const results: ContentValidationResult[] = [];

    if (post.contentType === 'STORY') {
      results.push({
        field: 'contentType',
        message: 'Facebook Stories are not supported via the Graph API.',
        severity: 'error',
      });
    }

    if (post.caption && post.caption.length > 63206) {
      results.push({
        field: 'caption',
        message: 'Caption exceeds maximum length of 63,206 characters.',
        severity: 'error',
      });
    }

    if (post.contentType === 'IMAGE' && (!post.media || post.media.length === 0)) {
      results.push({
        field: 'media',
        message: 'Image post requires at least one image attachment.',
        severity: 'error',
      });
    }

    if (post.contentType === 'VIDEO' && (!post.media || post.media.length === 0)) {
      results.push({
        field: 'media',
        message: 'Video post requires a video file attachment.',
        severity: 'error',
      });
    }

    return results;
  }
}
