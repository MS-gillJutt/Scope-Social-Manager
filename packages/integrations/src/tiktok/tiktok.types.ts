// =============================================================================
// TikTok Content Posting API Types
// =============================================================================

export interface TikTokTokenResponse {
  open_id: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  scope: string;
  token_type: string;
}

export interface TikTokUserInfoResponse {
  data: {
    user: {
      open_id: string;
      union_id?: string;
      avatar_url?: string;
      display_name: string;
      bio_description?: string;
      profile_deep_link?: string;
      is_verified?: boolean;
    };
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokPublishInitRequest {
  post_info: {
    title: string;
    privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY' | 'FOLLOWER_OF_CREATOR';
    disable_duet?: boolean;
    disable_stitch?: boolean;
    disable_comment?: boolean;
    video_cover_timestamp_ms?: number;
  };
  source_info: {
    source: 'PULL_FROM_URL' | 'FILE_UPLOAD';
    video_url?: string;
    video_size?: number;
    chunk_size?: number;
    total_chunk_count?: number;
  };
}

export interface TikTokPublishInitResponse {
  data: {
    publish_id: string;
    upload_url?: string;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokPublishStatusResponse {
  data: {
    status: 'PROCESSING_DOWNLOAD' | 'PROCESSING_UPLOAD' | 'SUCCESS' | 'FAILED';
    fail_reason?: string;
    publicaly_available_post_id?: string[];
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}
