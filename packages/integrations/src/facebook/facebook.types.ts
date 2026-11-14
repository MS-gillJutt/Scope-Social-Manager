// =============================================================================
// Facebook Graph API Types
// =============================================================================

export interface FacebookPageAccount {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
  picture?: {
    data: {
      url: string;
      is_silhouette: boolean;
    };
  };
}

export interface FacebookAccountsResponse {
  data: FacebookPageAccount[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface FacebookOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface FacebookDebugTokenResponse {
  data: {
    app_id: string;
    type: string;
    application: string;
    data_access_expires_at: number;
    expires_at: number;
    is_valid: boolean;
    scopes: string[];
    user_id: string;
  };
}

export interface FacebookFeedPostResponse {
  id: string;
  post_id?: string;
}

export interface FacebookInsightValue {
  value: number | Record<string, number>;
  end_time?: string;
}

export interface FacebookInsightData {
  name: string;
  period: string;
  values: FacebookInsightValue[];
  title?: string;
  description?: string;
  id: string;
}

export interface FacebookPostInsightsResponse {
  data: FacebookInsightData[];
}

export interface FacebookPageDetailsResponse {
  id: string;
  name: string;
  fan_count?: number;
  followers_count?: number;
  picture?: {
    data: {
      url: string;
    };
  };
}
