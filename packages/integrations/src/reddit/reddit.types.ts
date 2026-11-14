// =============================================================================
// Reddit API Types
// =============================================================================

export interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export interface RedditMeResponse {
  id: string;
  name: string;
  icon_img?: string;
  total_karma?: number;
  link_karma?: number;
  comment_karma?: number;
  subreddit?: {
    display_name: string;
    subscribers?: number;
  };
}

export interface RedditSubmitResponse {
  json: {
    errors: Array<[string, string, string]>;
    data?: {
      url: string;
      id: string;
      name: string; // fullname e.g. t3_abc123
    };
  };
}

export interface RedditPostListingResponse {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: {
        id: string;
        name: string;
        title: string;
        score: number;
        ups: number;
        downs: number;
        num_comments: number;
        upvote_ratio: number;
        permalink: string;
        url: string;
      };
    }>;
  };
}
