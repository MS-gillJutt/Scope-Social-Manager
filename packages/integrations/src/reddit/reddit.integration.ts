// =============================================================================
// Reddit API Integration (text + link posts)
// Docs: https://www.reddit.com/dev/api
// NOTE: Image/video posts need Reddit's media-upload lease flow and are not
// supported yet. Commercial use of the Reddit API requires approval — see
// docs/COSTS.md before launching this platform publicly.
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
  RedditTokenResponse,
  RedditMeResponse,
  RedditSubmitResponse,
  RedditPostListingResponse,
} from './reddit.types.js';

export interface RedditConfig {
  clientId: string;
  clientSecret: string;
}

const AUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const API_BASE = 'https://oauth.reddit.com';
const SCOPES = ['identity', 'submit', 'edit', 'read', 'history'];
const USER_AGENT = 'web:scope-social-manager:v1.0 (by /u/scope-social-manager)';

export class RedditIntegration extends BaseSocialPlatformIntegration {
  readonly platform: Platform = 'REDDIT';

  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(config?: RedditConfig) {
    // Reddit rejects generic User-Agents, so always send a descriptive one.
    super(API_BASE, { 'User-Agent': USER_AGENT });
    this.clientId = config?.clientId || process.env.REDDIT_CLIENT_ID || '';
    this.clientSecret = config?.clientSecret || process.env.REDDIT_CLIENT_SECRET || '';
  }

  // -------------------------------------------------------------------------
  // OAuth
  // -------------------------------------------------------------------------

  getAuthorizationUrl(state: string, redirectUri: string): string {
    return this.buildUrl(AUTH_URL, {
      client_id: this.clientId,
      response_type: 'code',
      state,
      redirect_uri: redirectUri,
      duration: 'permanent', // required to receive a refresh token
      scope: SCOPES.join(' '),
    });
  }

  private tokenRequest(body: Record<string, string>): Promise<RedditTokenResponse> {
    return axios
      .post<RedditTokenResponse>(TOKEN_URL, new URLSearchParams(body).toString(), {
        auth: { username: this.clientId, password: this.clientSecret },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        timeout: 30000,
      })
      .then((res) => {
        // Reddit can answer 200 with { error: "invalid_grant" }
        const data = res.data as unknown as { error?: string };
        if (data.error) {
          throw new IntegrationError(`[REDDIT] OAuth error: ${data.error}`, 'TOKEN_INVALID');
        }
        return res.data;
      });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    try {
      const data = await this.tokenRequest({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      });
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
      const data = await this.tokenRequest({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });
      return {
        accessToken: data.access_token,
        // Reddit does not rotate refresh tokens; keep the existing one.
        refreshToken: data.refresh_token ?? refreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
        scope: data.scope,
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async validateTokens(tokens: OAuthTokens): Promise<TokenValidationResult> {
    const now = Math.floor(Date.now() / 1000);
    if (tokens.expiresAt && tokens.expiresAt - now < 300) {
      return { valid: false, expired: true, expiresAt: tokens.expiresAt };
    }
    try {
      const res = await this.get<RedditMeResponse>('/api/v1/me', tokens);
      return {
        valid: !!res.data.id,
        expired: false,
        expiresAt: tokens.expiresAt,
        scopes: tokens.scope?.split(' '),
      };
    } catch (error) {
      return { valid: false, expired: true, errorMessage: (error as Error).message };
    }
  }

  // -------------------------------------------------------------------------
  // Account
  // -------------------------------------------------------------------------

  async getAccountInfo(tokens: OAuthTokens): Promise<SocialAccountInfo> {
    try {
      const res = await this.get<RedditMeResponse>('/api/v1/me', tokens);
      const me = res.data;
      return {
        platformAccountId: me.id,
        accountName: me.name,
        accountUsername: me.name,
        // Reddit HTML-escapes the icon URL and appends resize params
        accountImageUrl: me.icon_img?.split('?')[0]?.replace(/&amp;/g, '&'),
        accountType: 'profile',
        metadata: {
          totalKarma: me.total_karma,
          linkKarma: me.link_karma,
          commentKarma: me.comment_karma,
        },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Publishing
  // -------------------------------------------------------------------------

  async publishPost(tokens: OAuthTokens, post: PlatformPostPayload): Promise<PublishResult> {
    const errors = this.validateContent(post).filter((r) => r.severity === 'error');
    if (errors.length > 0) {
      throw new IntegrationError(
        `[REDDIT] Invalid content: ${errors.map((e) => e.message).join('; ')}`,
        'CONTENT_REJECTED',
      );
    }

    const subreddit = String(post.platformOptions?.subreddit).replace(/^\/?r\//i, '');
    const flairId = post.platformOptions?.flairId as string | undefined;
    const isLink = post.contentType === 'LINK' && !!post.linkUrl;

    const form = new URLSearchParams({
      api_type: 'json',
      sr: subreddit,
      kind: isLink ? 'link' : 'self',
      title: post.title as string,
      resubmit: 'true',
    });
    if (isLink) form.set('url', post.linkUrl as string);
    else form.set('text', this.buildBody(post));
    if (flairId) form.set('flair_id', flairId);

    try {
      const res = await this.post<RedditSubmitResponse>('/api/submit', form, tokens, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // Reddit returns HTTP 200 even for failures; real errors live in json.errors
      const { errors: apiErrors, data } = res.data.json;
      if (apiErrors?.length) {
        const [code, message] = apiErrors[0] as [string, string, string];
        throw new IntegrationError(
          `[REDDIT] Submit failed: ${message || code}`,
          code === 'RATELIMIT' ? 'RATE_LIMITED' : 'CONTENT_REJECTED',
          { platformMessage: message },
        );
      }
      if (!data) {
        throw new IntegrationError('[REDDIT] Submit returned no data', 'PLATFORM_ERROR');
      }

      return {
        platformPostId: data.name, // fullname, e.g. t3_abc123 (needed for delete/metrics)
        platformPostUrl: data.url,
        rawResponse: { id: data.id, name: data.name, url: data.url },
      };
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  private buildBody(post: PlatformPostPayload): string {
    const tags = post.hashtags?.length ? `\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}` : '';
    return `${post.caption ?? ''}${tags}`;
  }

  async deletePost(tokens: OAuthTokens, platformPostId: string): Promise<void> {
    try {
      const id = platformPostId.startsWith('t3_') ? platformPostId : `t3_${platformPostId}`;
      await this.post('/api/del', new URLSearchParams({ id }), tokens, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
      const id = platformPostId.startsWith('t3_') ? platformPostId : `t3_${platformPostId}`;
      const res = await this.get<RedditPostListingResponse>('/api/info', tokens, {
        params: { id },
      });
      const post = res.data.data.children[0]?.data;
      if (!post) return null;
      return {
        likes: post.ups,
        comments: post.num_comments,
        raw: { score: post.score, upvoteRatio: post.upvote_ratio },
      };
    } catch {
      return null;
    }
  }

  async getAccountMetrics(tokens: OAuthTokens): Promise<AccountMetrics | null> {
    try {
      const res = await this.get<RedditMeResponse>('/api/v1/me', tokens);
      return { raw: { totalKarma: res.data.total_karma } };
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Capabilities & Validation
  // -------------------------------------------------------------------------

  getSupportedFeatures(): PlatformFeatures {
    return {
      supportedContentTypes: ['TEXT', 'LINK'],
      maxCaptionLength: 40000,
      maxMediaItems: 0,
      requiresAppReview: true,
      rateLimits: { requestsPerSecond: 1 }, // ~100 requests/min per OAuth client
      unsupported: [
        {
          feature: 'IMAGE_VIDEO_UPLOAD',
          reason: 'Requires Reddit media upload leases; not implemented yet.',
        },
      ],
      notes: [
        'Every post needs a title (max 300 chars) and a target subreddit.',
        'Subreddits may require flair or reject posts based on their own rules.',
        'New accounts are heavily rate-limited by Reddit.',
      ],
    };
  }

  validateContent(post: PlatformPostPayload): ContentValidationResult[] {
    const results: ContentValidationResult[] = [];

    if (!post.title?.trim()) {
      results.push({ field: 'title', message: 'Reddit posts require a title', severity: 'error' });
    } else if (post.title.length > 300) {
      results.push({
        field: 'title',
        message: 'Title must be 300 characters or fewer',
        severity: 'error',
      });
    }

    if (!post.platformOptions?.subreddit) {
      results.push({
        field: 'platformOptions.subreddit',
        message: 'A subreddit is required',
        severity: 'error',
      });
    }

    if (post.contentType === 'LINK' && !post.linkUrl) {
      results.push({ field: 'linkUrl', message: 'Link posts require a URL', severity: 'error' });
    }

    if (post.caption && post.caption.length > 40000) {
      results.push({
        field: 'caption',
        message: 'Text must be 40,000 characters or fewer',
        severity: 'error',
      });
    }

    if (post.media?.length || ['IMAGE', 'VIDEO', 'CAROUSEL', 'REEL'].includes(post.contentType)) {
      results.push({
        field: 'media',
        message: 'Image/video posts are not supported for Reddit yet',
        severity: 'error',
      });
    }

    return results;
  }
}
