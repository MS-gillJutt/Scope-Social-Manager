// =============================================================================
// WhatsApp Status Integration — MANUAL-ACTION destination (no API)
// =============================================================================
//
// THE HONEST FACT: Meta's official WhatsApp Business API (Cloud API) has NO
// endpoint for posting to Status. Meta documents no Status-posting API, and
// practitioner guides confirm posting stays manual (open the WhatsApp /
// WhatsApp Business app on the phone → Status → My Status → pick the media).
// Third-party services that "post Status by API" (e.g. Wawp, Pilot Status)
// drive an unofficial WhatsApp Web session — paid, against WhatsApp's terms,
// and a ban risk for MS's number. This integration deliberately does NOT use
// any of them.
//
// How it works instead:
// - publishPost() NEVER calls an API. It returns a PublishResult with
//   requiresManualAction: true. The publish worker marks the PlatformPost
//   NEEDS_MANUAL_ACTION (the status the schema already provides for exactly
//   this) and the composer shows MS a card: download the prepared media,
//   caption already copied, and a "Mark as posted" button to close the loop.
// - There is no OAuth: no ConnectedAccount is needed for WHATSAPP posts
//   (PlatformPost.connectedAccountId is nullable). All OAuth methods throw
//   IntegrationError('NOT_SUPPORTED') with a plain message.
// - validateContent() enforces what the WhatsApp app itself enforces:
//   Status video clips are max 60 seconds, text is short, one media item
//   per Status (the composer sends one post = one Status).
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

const NOT_SUPPORTED_MESSAGE =
  'WhatsApp Status has no official API and no OAuth login — it is posted by hand from the WhatsApp app on your phone. This integration only prepares the media and caption.';

export class WhatsappStatusIntegration extends BaseSocialPlatformIntegration {
  readonly platform: Platform = 'WHATSAPP';

  constructor() {
    // No base URL: this integration makes no HTTP calls at all.
    super(undefined);
  }

  // -------------------------------------------------------------------------
  // OAuth — not applicable (no API, no connected account)
  // -------------------------------------------------------------------------

  getAuthorizationUrl(_state: string, _redirectUri: string): string {
    throw new IntegrationError(NOT_SUPPORTED_MESSAGE, 'NOT_SUPPORTED');
  }

  async exchangeCodeForTokens(_code: string, _redirectUri: string): Promise<OAuthTokens> {
    throw new IntegrationError(NOT_SUPPORTED_MESSAGE, 'NOT_SUPPORTED');
  }

  async refreshTokens(_refreshToken: string): Promise<OAuthTokens> {
    throw new IntegrationError(NOT_SUPPORTED_MESSAGE, 'NOT_SUPPORTED');
  }

  async validateTokens(_tokens: OAuthTokens): Promise<TokenValidationResult> {
    throw new IntegrationError(NOT_SUPPORTED_MESSAGE, 'NOT_SUPPORTED');
  }

  async getAccountInfo(_tokens: OAuthTokens): Promise<SocialAccountInfo> {
    throw new IntegrationError(NOT_SUPPORTED_MESSAGE, 'NOT_SUPPORTED');
  }

  // -------------------------------------------------------------------------
  // Publishing — manual action, never an API call
  // -------------------------------------------------------------------------

  async publishPost(
    _tokens: OAuthTokens,
    post: PlatformPostPayload
  ): Promise<PublishResult> {
    const problems = this.validateContent(post).filter((r) => r.severity === 'error');
    if (problems.length > 0) {
      throw new IntegrationError(
        `Content invalid for WhatsApp Status: ${problems.map((p) => p.message).join('; ')}`,
        'CONTENT_REJECTED'
      );
    }

    const mediaKind =
      post.contentType === 'VIDEO' ? 'video' : post.media && post.media.length > 0 ? 'photo' : 'text';
    const action =
      mediaKind === 'text'
        ? 'type this text as a Status'
        : `pick this ${mediaKind}`;
    return {
      // No platform post ID exists — nothing was published by an API.
      platformPostId: 'manual-action',
      requiresManualAction: true,
      manualActionNote:
        `Open WhatsApp on your phone → Status → My Status → ${action} ` +
        `(caption is copied for you) → Post. Then tap "Mark as posted" here. ` +
        `Status disappears after 24 hours and is only seen by contacts who saved your number.`,
      rawResponse: { manualAction: true, mediaKind },
    };
  }

  async deletePost(_tokens: OAuthTokens, _platformPostId: string): Promise<void> {
    throw new IntegrationError(
      'A WhatsApp Status can only be deleted from the WhatsApp app (Status → My Status → ⋮ → Delete).',
      'NOT_SUPPORTED'
    );
  }

  async getPostMetrics(
    _tokens: OAuthTokens,
    _platformPostId: string
  ): Promise<PostMetrics | null> {
    // Views are only visible inside the WhatsApp app.
    return null;
  }

  async getAccountMetrics(_tokens: OAuthTokens): Promise<AccountMetrics | null> {
    return null;
  }

  // -------------------------------------------------------------------------
  // Capabilities & validation
  // -------------------------------------------------------------------------

  getSupportedFeatures(): PlatformFeatures {
    return {
      supportedContentTypes: ['TEXT', 'IMAGE', 'VIDEO'],
      maxCaptionLength: 700,
      maxMediaItems: 1,
      requiresAppReview: false,
      unsupported: [
        {
          feature: 'API_PUBLISH',
          reason:
            'Meta provides no WhatsApp Business API endpoint for posting Status. Posting is manual, from the WhatsApp app.',
        },
        {
          feature: 'SCHEDULED_PUBLISH',
          reason:
            'Status cannot be scheduled — the app posts it the moment you tap Post. The composer can still remind you at the scheduled time.',
        },
        {
          feature: 'METRICS',
          reason: 'Status views are only visible inside the WhatsApp app.',
        },
      ],
      notes: [
        'Status video clips are max 60 seconds in the WhatsApp app — longer videos are split.',
        'Status disappears after 24 hours.',
        'Only contacts who saved your number (and whom you saved) reliably see your Status.',
      ],
    };
  }

  validateContent(post: PlatformPostPayload): ContentValidationResult[] {
    const results: ContentValidationResult[] = [];

    if (post.caption && post.caption.length > 700) {
      results.push({
        field: 'caption',
        message: 'WhatsApp Status text is limited to 700 characters.',
        severity: 'error',
      });
    }

    if (post.media && post.media.length > 1) {
      results.push({
        field: 'media',
        message: 'One Status holds one photo or video — extra media is ignored for WhatsApp.',
        severity: 'warning',
      });
    }

    if (post.contentType === 'VIDEO' && !post.media?.[0]?.url) {
      results.push({
        field: 'media',
        message: 'WhatsApp Status video needs a video file.',
        severity: 'error',
      });
    }

    if (post.contentType === 'TEXT' && !post.caption) {
      results.push({
        field: 'caption',
        message: 'A text Status needs some text.',
        severity: 'error',
      });
    }

    if (!post.media?.length && !post.caption) {
      results.push({
        field: 'media',
        message: 'A Status needs a photo/video or some text.',
        severity: 'error',
      });
    }

    return results;
  }
}
