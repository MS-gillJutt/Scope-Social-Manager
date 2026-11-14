// =============================================================================
// LinkedIn API v2 Types
// =============================================================================

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

export interface LinkedInUserInfoResponse {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
}

export interface LinkedInRegisterUploadRequest {
  registerUploadRequest: {
    recipes: string[];
    owner: string;
    serviceRelationships: Array<{
      relationshipType: string;
      identifier: string;
    }>;
  };
}

export interface LinkedInRegisterUploadResponse {
  value: {
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'?: {
        uploadUrl: string;
        headers?: Record<string, string>;
      };
    };
    asset: string;
    mediaArtifact?: string;
  };
}

export interface LinkedInUgcPostResponse {
  id: string;
}

export interface LinkedInOrganizationAclResponse {
  elements: Array<{
    organization: string;
    role: string;
  }>;
}

export interface LinkedInOrganizationDetailsResponse {
  id: string;
  localizedName: string;
  vanityName?: string;
  logoV2?: {
    'cropped~'?: {
      elements?: Array<{
        identifiers?: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
}

export interface LinkedInShareStatisticsResponse {
  elements: Array<{
    share: string;
    totalShareStatistics: {
      shareCount: number;
      clickCount: number;
      likeCount: number;
      commentCount: number;
      impressionCount: number;
      uniqueImpressionsCount?: number;
      engagement?: number;
    };
  }>;
}

export interface LinkedInFollowerStatisticsResponse {
  elements: Array<{
    followerCountsByAssociationType?: Array<{
      followerCounts: {
        organicFollowerCount: number;
        paidFollowerCount: number;
      };
    }>;
  }>;
}
