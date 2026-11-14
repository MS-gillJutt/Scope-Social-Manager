// =============================================================================
// LinkedIn API v2 Integration
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
  LinkedInTokenResponse,
  LinkedInUserInfoResponse,
  LinkedInRegisterUploadRequest,
  LinkedInRegisterUploadResponse,
  LinkedInUgcPostResponse,
  LinkedInShareStatisticsResponse,
} from './linkedin.types.js';

export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
}

export class LinkedInIntegration extends BaseSocialPlatformIntegration {
  readonly platform: Platform = 'LINKEDIN';

  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(config?: LinkedInConfig) {
    super('https://api.linkedin.com');
    this.clientId = config?.clientId || process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = config?.clientSecret || process.env.LINKEDIN_CLIENT_SECRET || '';
  }

  // -------------------------------------------------------------------------
  // OAuth
  // -------------------------------------------------------------------------

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const scopes = [
      'openid',
      'profile',
      'email',
      'w_member_social',
      'w_organization_social',
      'r_organization_social',
      'rw_organization_admin',
    ].join(' ');

    return this.buildUrl('https://www.linkedin.com/oauth/v2/authorization', {
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
      scope: scopes,
    });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const res = await axios.post<LinkedInTokenResponse>(
        'https://www.linkedin.com/oauth/v2/accessToken',
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
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const res = await axios.post<LinkedInTokenResponse>(
        'https://www.linkedin.com/oauth/v2/accessToken',
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
      // Modern LinkedIn userinfo endpoint (OpenID Connect)
      const res = await this.get<LinkedInUserInfoResponse>('/v2/userinfo', tokens);
      return {
        valid: !!res.data.sub,
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
  // Account Information
  // -------------------------------------------------------------------------

  async getAccountInfo(tokens: OAuthTokens): Promise<SocialAccountInfo> {
    try {
      const res = await this.get<LinkedInUserInfoResponse>('/v2/userinfo', tokens);
      const user = res.data;

      return {
        platformAccountId: user.sub,
        accountName: user.name,
        accountUsername: user.email,
        accountImageUrl: user.picture,
        accountType: 'profile',
        metadata: {
          sub: user.sub,
          givenName: user.given_name,
          familyName: user.family_name,
          email: user.email,
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Publishing (POST /v2/ugcPosts)
  // -------------------------------------------------------------------------

  async publishPost(tokens: OAuthTokens, post: PlatformPostPayload): Promise<PublishResult> {
    try {
      // Determine author URN (either personal profile or organization page)
      const targetUrn =
        (tokens.extra?.authorUrn as string) ||
        (tokens.extra?.platformAccountId
          ? `urn:li:person:${tokens.extra.platformAccountId}`
          : undefined);

      const author = targetUrn || (await this.resolveAuthorUrn(tokens));

      let shareMediaCategory = 'NONE';
      const mediaList: Array<Record<string, unknown>> = [];

      // Handle Image/Video assets
      if (post.media && post.media.length > 0) {
        const item = post.media[0]!;
        const isVideo =
          post.contentType === 'VIDEO' ||
          item.mimeType?.startsWith('video/') ||
          item.url.endsWith('.mp4');

        if (isVideo) {
          shareMediaCategory = 'VIDEO';
          const assetUrn = await this.uploadMediaToLinkedIn(author, item.url, 'VIDEO', tokens);
          mediaList.push({
            media: assetUrn,
            status: 'READY',
            title: { text: post.title || post.caption?.slice(0, 50) || 'Video' },
          });
        } else {
          shareMediaCategory = 'IMAGE';
          const assetUrn = await this.uploadMediaToLinkedIn(author, item.url, 'IMAGE', tokens);
          mediaList.push({
            media: assetUrn,
            status: 'READY',
            title: { text: item.altText || post.title || 'Image' },
          });
        }
      } else if (post.linkUrl) {
        shareMediaCategory = 'ARTICLE';
        mediaList.push({
          status: 'READY',
          originalUrl: post.linkUrl,
          title: { text: post.title || post.linkUrl },
        });
      }

      // Prepare UGC Post Body
      const ugcPayload: Record<string, unknown> = {
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: post.caption || '',
            },
            shareMediaCategory,
            ...(mediaList.length > 0 ? { media: mediaList } : {}),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const res = await this.post<LinkedInUgcPostResponse>(
        '/v2/ugcPosts',
        ugcPayload,
        tokens,
        {
          headers: {
            'X-Restli-Protocol-Version': '2.0.0',
          },
        },
      );

      const postUrn = res.data.id;
      return {
        platformPostId: postUrn,
        platformPostUrl: `https://www.linkedin.com/feed/update/${postUrn}/`,
        rawResponse: res.data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  /**
   * 2-Step media upload: register upload -> stream bytes to uploadUrl -> return asset URN
   */
  private async uploadMediaToLinkedIn(
    ownerUrn: string,
    mediaUrl: string,
    type: 'IMAGE' | 'VIDEO',
    tokens: OAuthTokens,
  ): Promise<string> {
    const recipe =
      type === 'VIDEO'
        ? 'urn:li:digitalmediaRecipe:feedshare-video'
        : 'urn:li:digitalmediaRecipe:feedshare-image';

    const registerReq: LinkedInRegisterUploadRequest = {
      registerUploadRequest: {
        recipes: [recipe],
        owner: ownerUrn,
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    };

    const registerRes = await this.post<LinkedInRegisterUploadResponse>(
      '/v2/assets?action=registerUpload',
      registerReq,
      tokens,
    );

    const uploadMechanism =
      registerRes.data.value.uploadMechanism[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ];

    if (!uploadMechanism?.uploadUrl) {
      throw new IntegrationError(
        'LinkedIn failed to provide an upload URL for media asset.',
        'PLATFORM_ERROR',
      );
    }

    // Download media binary from R2/URL
    const mediaBuffer = await axios.get(mediaUrl, { responseType: 'arraybuffer' });

    // Upload binary directly to LinkedIn upload URL
    await axios.put(uploadMechanism.uploadUrl, mediaBuffer.data, {
      headers: {
        'Content-Type': 'application/octet-stream',
        ...uploadMechanism.headers,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return registerRes.data.value.asset;
  }

  private async resolveAuthorUrn(tokens: OAuthTokens): Promise<string> {
    const info = await this.getAccountInfo(tokens);
    return `urn:li:person:${info.platformAccountId}`;
  }

  /**
   * Delete post from LinkedIn feed
   */
  async deletePost(tokens: OAuthTokens, platformPostId: string): Promise<void> {
    try {
      const encodedPostUrn = encodeURIComponent(platformPostId);
      await this.deleteRequest(`/v2/ugcPosts/${encodedPostUrn}`, tokens, {
        headers: {
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  async getPostMetrics(tokens: OAuthTokens, platformPostId: string): Promise<PostMetrics | null> {
    try {
      const encodedUrn = encodeURIComponent(platformPostId);
      const res = await this.get<LinkedInShareStatisticsResponse>(
        `/v2/organizationalEntityShareStatistics?q=organizationalEntity&shares[0]=${encodedUrn}`,
        tokens,
      );

      const stats = res.data.elements?.[0]?.totalShareStatistics;
      if (!stats) return null;

      return {
        impressions: stats.impressionCount,
        reach: stats.uniqueImpressionsCount,
        likes: stats.likeCount,
        comments: stats.commentCount,
        shares: stats.shareCount,
        clicks: stats.clickCount,
        raw: stats as unknown as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  }

  async getAccountMetrics(_tokens: OAuthTokens): Promise<AccountMetrics | null> {
    // Network size metrics require Member Network API partner access
    return null;
  }

  // -------------------------------------------------------------------------
  // Capabilities & Validation
  // -------------------------------------------------------------------------

  getSupportedFeatures(): PlatformFeatures {
    return {
      supportedContentTypes: ['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'DOCUMENT'],
      maxCaptionLength: 3000,
      maxMediaItems: 1, // UGC single-media upload per post
      requiresAppReview: true,
      rateLimits: {
        postsPerDay: 100,
        requestsPerSecond: 10,
      },
      unsupported: [
        {
          feature: 'STORY',
          reason: 'LinkedIn discontinued Stories globally.',
        },
        {
          feature: 'CAROUSEL_IMAGES',
          reason: 'LinkedIn image carousels are not supported via the public UGC API. PDFs/Documents are used for carousels.',
        },
      ],
      notes: [
        'Post character limit is 3,000 characters.',
        'Supports personal profiles and company pages.',
        'PDF documents can be posted as carousel slide decks.',
      ],
    };
  }

  validateContent(post: PlatformPostPayload): ContentValidationResult[] {
    const results: ContentValidationResult[] = [];

    if (post.caption && post.caption.length > 3000) {
      results.push({
        field: 'caption',
        message: 'LinkedIn posts cannot exceed 3,000 characters.',
        severity: 'error',
      });
    }

    if (post.contentType === 'IMAGE' && (!post.media || post.media.length === 0)) {
      results.push({
        field: 'media',
        message: 'Image post requires an image.',
        severity: 'error',
      });
    }

    return results;
  }
}
