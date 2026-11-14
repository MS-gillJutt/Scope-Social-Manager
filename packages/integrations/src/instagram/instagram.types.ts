// =============================================================================
// Instagram Graph API Types
// =============================================================================

export interface InstagramContainerResponse {
  id: string; // container ID
}

export interface InstagramPublishResponse {
  id: string; // published media ID
}

export type InstagramContainerStatusCode =
  | 'EXPIRED'
  | 'ERROR'
  | 'FINISHED'
  | 'IN_PROGRESS'
  | 'PUBLISHED';

export interface InstagramContainerStatusResponse {
  id: string;
  status_code: InstagramContainerStatusCode;
  status?: string;
}

export interface InstagramMediaInsightItem {
  name: string;
  period: string;
  values: Array<{
    value: number;
  }>;
  title: string;
  description: string;
  id: string;
}

export interface InstagramMediaInsightsResponse {
  data: InstagramMediaInsightItem[];
}

export interface InstagramAccountDetailsResponse {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export interface InstagramConnectedAccountItem {
  id: string;
  name: string;
  instagram_business_account?: {
    id: string;
    username: string;
    name?: string;
    profile_picture_url?: string;
  };
}

export interface InstagramAccountsQueryResponse {
  data: InstagramConnectedAccountItem[];
}
