// =============================================================================
// YouTube Data API v3 Integration
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
  YouTubeOAuthTokenResponse,
  YouTubeChannelListResponse,
  YouTubeVideoMetadata,
  YouTubeVideoResponse,
  YouTubeVideoListResponse,
} from './youtube.types.js';

export interface YouTubeConfig {
  clientId: string;
  clientSecret: string;
}

export class YouTubeIntegration extends BaseSocialPlatformIntegration {
  readonly platform: Platform = 'YOUTUBE';

  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(config?: YouTubeConfig) {
    super('https://www.googleapis.com');
    this.clientId = config?.clientId || process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
  }

  // -------------------------------------------------------------------------
  // OAuth
  // -------------------------------------------------------------------------

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    return this.buildUrl('https://accounts.google.com/o/oauth2/v2/auth', {
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline', // Required to obtain refresh_token
      prompt: 'consent', // Force consent prompt to guarantee refresh_token
      state,
    });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    try {
      const res = await axios.post<YouTubeOAuthTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
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
      const res = await axios.post<YouTubeOAuthTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        },
      );

      const data = res.data;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async validateTokens(tokens: OAuthTokens): Promise<TokenValidationResult> {
    try {
      const res = await this.get<YouTubeChannelListResponse>(
        '/youtube/v3/channels?part=snippet&mine=true',
        tokens,
      );

      return {
        valid: Array.isArray(res.data.items) && res.data.items.length > 0,
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
      const res = await this.get<YouTubeChannelListResponse>(
        '/youtube/v3/channels?part=snippet,statistics&mine=true',
        tokens,
      );

      const channel = res.data.items?.[0];
      if (!channel) {
        throw new IntegrationError(
          'No YouTube Channel found for the authenticated Google account.',
          'PERMISSION_DENIED',
        );
      }

      return {
        platformAccountId: channel.id,
        accountName: channel.snippet.title,
        accountUsername: channel.snippet.customUrl,
        accountImageUrl:
          channel.snippet.thumbnails?.high?.url ||
          channel.snippet.thumbnails?.medium?.url ||
          channel.snippet.thumbnails?.default?.url,
        accountType: 'channel',
        metadata: {
          customUrl: channel.snippet.customUrl,
          subscriberCount: channel.statistics?.subscriberCount,
          videoCount: channel.statistics?.videoCount,
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Publishing (Resumable Upload)
  // -------------------------------------------------------------------------

  async publishPost(tokens: OAuthTokens, post: PlatformPostPayload): Promise<PublishResult> {
    if (post.contentType !== 'VIDEO' || !post.media?.[0]?.url) {
      throw new IntegrationError(
        'YouTube only supports VIDEO content. A valid video file URL is required.',
        'CONTENT_REJECTED',
      );
    }

    try {
      const videoItem = post.media[0];
      const privacy = (post.platformOptions?.privacy as 'public' | 'private' | 'unlisted') || 'public';
      const categoryId = (post.platformOptions?.categoryId as string) || '22'; // 22 = People & Blogs

      // Step 1: Initiate Resumable Upload Session
      const metadata: YouTubeVideoMetadata = {
        snippet: {
          title: post.title || post.caption?.slice(0, 70) || 'Uploaded Video',
          description: post.caption || '',
          tags: post.hashtags,
          categoryId,
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: (post.platformOptions?.madeForKids as boolean) || false,
        },
      };

      const initRes = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        metadata,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': videoItem.mimeType || 'video/mp4',
          },
        },
      );

      const uploadUrl = initRes.headers.location;
      if (!uploadUrl) {
        throw new IntegrationError(
          'Failed to retrieve YouTube resumable upload location header.',
          'PLATFORM_ERROR',
        );
      }

      // Step 2: Download video buffer from media storage URL
      const videoBuffer = await axios.get(videoItem.url, { responseType: 'arraybuffer' });

      // Step 3: Upload video binary to resumable upload endpoint
      const uploadRes = await axios.put<YouTubeVideoResponse>(uploadUrl, videoBuffer.data, {
        headers: {
          'Content-Type': videoItem.mimeType || 'video/mp4',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const videoId = uploadRes.data.id;
      return {
        platformPostId: videoId,
        platformPostUrl: `https://www.youtube.com/watch?v=${videoId}`,
        rawResponse: uploadRes.data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async deletePost(tokens: OAuthTokens, platformPostId: string): Promise<void> {
    try {
      await this.deleteRequest(`/youtube/v3/videos?id=${platformPostId}`, tokens);
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------

  async getPostMetrics(tokens: OAuthTokens, platformPostId: string): Promise<PostMetrics | null> {
    try {
      const res = await this.get<YouTubeVideoListResponse>(
        `/youtube/v3/videos?part=statistics&id=${platformPostId}`,
        tokens,
      );

      const stats = res.data.items?.[0]?.statistics;
      if (!stats) return null;

      return {
        views: parseInt(stats.viewCount, 10) || 0,
        likes: parseInt(stats.likeCount, 10) || 0,
        comments: parseInt(stats.commentCount, 10) || 0,
        videoViews: parseInt(stats.viewCount, 10) || 0,
        raw: stats as unknown as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  }

  async getAccountMetrics(tokens: OAuthTokens): Promise<AccountMetrics | null> {
    try {
      const res = await this.get<YouTubeChannelListResponse>(
        '/youtube/v3/channels?part=statistics&mine=true',
        tokens,
      );

      const stats = res.data.items?.[0]?.statistics;
      if (!stats) return null;

      return {
        followers: parseInt(stats.subscriberCount, 10) || 0,
        posts: parseInt(stats.videoCount, 10) || 0,
        views: parseInt(stats.viewCount, 10) || 0,
        raw: stats as unknown as Record<string, unknown>,
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
      supportedContentTypes: ['VIDEO'],
      maxCaptionLength: 5000, // YouTube description
      maxMediaItems: 1,
      requiresAppReview: true,
      rateLimits: {
        postsPerDay: 50, // Subject to Google Cloud quota (10,000 units/day, video upload = 1,600 units)
        requestsPerSecond: 10,
      },
      unsupported: [
        {
          feature: 'IMAGE',
          reason: 'YouTube Data API v3 does not support uploading standalone image or Community posts.',
        },
        {
          feature: 'TEXT',
          reason: 'Text-only posts (Community tab) are not available via standard YouTube Data API.',
        },
      ],
      notes: [
        'Supports YouTube Shorts when uploaded in 9:16 vertical aspect ratio under 60 seconds.',
        'Requires YouTube upload quota units (each upload consumes 1,600 quota units).',
        'Uploads the actual video binary data directly to Google via resumable upload.',
      ],
    };
  }

  validateContent(post: PlatformPostPayload): ContentValidationResult[] {
    const results: ContentValidationResult[] = [];

    if (post.contentType !== 'VIDEO') {
      results.push({
        field: 'contentType',
        message: 'YouTube only accepts VIDEO content.',
        severity: 'error',
      });
    }

    if (!post.title || post.title.trim().length === 0) {
      results.push({
        field: 'title',
        message: 'YouTube video title is required.',
        severity: 'error',
      });
    } else if (post.title.length > 100) {
      results.push({
        field: 'title',
        message: 'YouTube video title cannot exceed 100 characters.',
        severity: 'error',
      });
    }

    if (post.caption && post.caption.length > 5000) {
      results.push({
        field: 'caption',
        message: 'YouTube video description cannot exceed 5,000 characters.',
        severity: 'error',
      });
    }

    if (!post.media || post.media.length === 0) {
      results.push({
        field: 'media',
        message: 'YouTube upload requires a video media file.',
        severity: 'error',
      });
    }

    return results;
  }
}
