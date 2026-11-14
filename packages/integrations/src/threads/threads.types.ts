// =============================================================================
// Threads API (Meta) Types
// =============================================================================

export interface ThreadsTokenResponse {
  access_token: string;
  user_id: string;
}

export interface ThreadsLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ThreadsUserResponse {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
  threads_biography?: string;
}

export interface ThreadsContainerResponse {
  id: string; // container creation_id
}

export interface ThreadsPublishResponse {
  id: string; // published threads media ID
}

export interface ThreadsContainerStatusResponse {
  id: string;
  status: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
  error_message?: string;
}

export interface ThreadsInsightMetricItem {
  name: string;
  period: string;
  values: Array<{
    value: number;
  }>;
  title: string;
  description: string;
  id: string;
}

export interface ThreadsInsightsResponse {
  data: ThreadsInsightMetricItem[];
}
