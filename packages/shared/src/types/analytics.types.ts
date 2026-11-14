// =============================================================================
// Analytics Types
// =============================================================================

import type { Platform } from "@scope/config";

export interface MetricValue {
  value: number;
  changePercent: number | null; // vs previous period
}

export interface AccountMetrics {
  socialAccountId: string;
  platform: Platform;
  date: string; // YYYY-MM-DD
  followers: number;
  following: number;
  impressions: number;
  reach: number;
  profileViews: number;
  engagementRate: number; // 0-100
}

export interface PostMetrics {
  postId: string;
  postPlatformResultId: string;
  platform: Platform;
  date: string; // YYYY-MM-DD
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  videoViews: number | null;
  engagementRate: number;
}

export interface DashboardSummary {
  totalFollowers: MetricValue;
  totalImpressions: MetricValue;
  totalEngagements: MetricValue;
  avgEngagementRate: MetricValue;
  postsPublished: MetricValue;
  topPlatform: Platform | null;
}

export interface AnalyticsFilter {
  from: Date;
  to: Date;
  platforms?: Platform[];
  socialAccountIds?: string[];
  granularity?: "day" | "week" | "month";
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface PlatformBreakdown {
  platform: Platform;
  followers: number;
  impressions: number;
  engagements: number;
  engagementRate: number;
  postsCount: number;
}

export interface BestTimeToPost {
  platform: Platform;
  dayOfWeek: number; // 0 = Sunday
  hourUtc: number; // 0-23
  avgEngagementRate: number;
}
