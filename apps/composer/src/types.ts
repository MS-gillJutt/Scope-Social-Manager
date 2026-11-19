export type PlatformId = "linkedin" | "tiktok" | "instagram" | "facebook" | "twitter" | "whatsapp";

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  charLimit: number;
  supportsVideo: boolean;
  supportsImage: boolean;
  recommendedAspect: string;
  iconName: string;
  handlePlaceholder: string;
  /**
   * True when the platform has NO publish API and posting finishes by hand
   * in the platform's own app (WhatsApp Status). The worker marks the post
   * NEEDS_MANUAL_ACTION and the composer shows the manual-action card.
   */
  manualOnly?: boolean;
  /**
   * MS rule (Nov 17, 2026): every platform is CHECKED by default EXCEPT
   * LinkedIn (professional only — the user ticks it only when they want the
   * post on LinkedIn). A platform that is not wired yet is also unchecked.
   * When true (or unset) the platform starts checked in the picker.
   */
  defaultSelected?: boolean;
  /** Short note shown under the platform name in the picker. */
  note?: string;
}

export type MediaType = "none" | "image" | "video";

export interface MediaAttachment {
  type: MediaType;
  url: string;
  name: string;
  size: string;
  mimeType: string;
  duration?: number;
  /** The picked File itself (browser-only, never serialized) — uploaded to the API on publish. */
  file?: File;
  /** R2 media asset id (set when the media was already uploaded / loaded from the API). */
  mediaAssetId?: string;
}

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

/** One platform's real outcome for a post (from the API, not the old fake flow). */
export interface PlatformResult {
  platform: PlatformId;
  /** API PostStatus: QUEUED, SCHEDULED, PUBLISHING, PUBLISHED, FAILED, NEEDS_MANUAL_ACTION, ... */
  status: string;
  platformPostId?: string;
  platformPostUrl?: string | null;
  errorMessage?: string | null;
  /** WhatsApp manual-action note from the worker (when status is NEEDS_MANUAL_ACTION). */
  manualActionNote?: string;
  /** Prepared media URLs for the manual step (WhatsApp). */
  mediaUrls?: string[];
}

export interface PlatformPostVariation {
  caption?: string;
  hashtags?: string[];
}

export interface SocialPost {
  id: string;
  createdAt: string;
  caption: string;
  hashtags: string[];
  media?: MediaAttachment;
  selectedPlatforms: PlatformId[];
  variations?: Partial<Record<PlatformId, PlatformPostVariation>>;
  scheduledFor?: string; // ISO string
  status: PostStatus;
  publishedAt?: string;
  publishedPlatforms?: PlatformId[];
  /** Real per-platform outcomes from the API (set after publish / queue load). */
  platformResults?: PlatformResult[];
}

export interface UserSettings {
  webhookUrl: string;
  authorName: string;
  socialHandles: Partial<Record<PlatformId, string>>;
  autoCopyMediaLink: boolean;
}
