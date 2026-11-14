// =============================================================================
// Content / Post Types
// =============================================================================

import type { Platform, PostStatus } from "@scope/config";

export interface MediaAttachment {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null; // for video
  altText: string | null;
}

export interface PlatformPostConfig {
  platform: Platform;
  /** Override caption for this platform (falls back to post.caption) */
  caption?: string;
  /** Override hashtags for this platform */
  hashtags?: string[];
  /** Platform-specific options */
  options?: Record<string, unknown>;
}

export interface Post {
  id: string;
  workspaceId: string;
  createdById: string;
  title: string | null;
  caption: string;
  hashtags: string[];
  media: MediaAttachment[];
  platformConfigs: PlatformPostConfig[];
  scheduledAt: Date | null;
  publishedAt: Date | null;
  status: PostStatus;
  failureReason: string | null;
  labels: string[];
  isCarousel: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostPlatformResult {
  id: string;
  postId: string;
  platform: Platform;
  socialAccountId: string;
  platformPostId: string | null;
  platformPostUrl: string | null;
  status: PostStatus;
  failureReason: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  title?: string;
  caption: string;
  hashtags?: string[];
  mediaIds?: string[];
  platformConfigs: PlatformPostConfig[];
  scheduledAt?: Date | null;
  labels?: string[];
}

export interface UpdatePostInput {
  title?: string;
  caption?: string;
  hashtags?: string[];
  mediaIds?: string[];
  platformConfigs?: PlatformPostConfig[];
  scheduledAt?: Date | null;
  labels?: string[];
}

export interface PostFilter {
  status?: PostStatus | PostStatus[];
  platform?: Platform;
  from?: Date;
  to?: Date;
  labels?: string[];
  search?: string;
}

export interface CalendarEntry {
  date: string; // YYYY-MM-DD
  posts: Array<{
    id: string;
    title: string | null;
    caption: string;
    status: PostStatus;
    scheduledAt: Date;
    platforms: Platform[];
    thumbnailUrl: string | null;
  }>;
}
