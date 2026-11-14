// =============================================================================
// YouTube Data API v3 Types
// =============================================================================

export interface YouTubeOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface YouTubeChannelItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  statistics?: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}

export interface YouTubeChannelListResponse {
  items: YouTubeChannelItem[];
}

export interface YouTubeVideoMetadata {
  snippet: {
    title: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
  };
  status: {
    privacyStatus: 'public' | 'private' | 'unlisted';
    selfDeclaredMadeForKids?: boolean;
    publishAt?: string;
  };
}

export interface YouTubeVideoResponse {
  id: string;
  snippet?: {
    title: string;
    description: string;
    publishedAt: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    dislikeCount?: string;
    favoriteCount: string;
    commentCount: string;
  };
}

export interface YouTubeVideoListResponse {
  items: YouTubeVideoResponse[];
}
