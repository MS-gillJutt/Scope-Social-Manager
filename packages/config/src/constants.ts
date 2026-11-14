// =============================================================================
// Postlane — Application Constants
// =============================================================================

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------
export const BRAND = {
  NAME: "Postlane",
  TAGLINE: "Schedule smarter. Publish everywhere.",
  PRIMARY_COLOR: "#6366f1",
  SECONDARY_COLOR: "#0ea5e9",
  SUPPORT_EMAIL: "support@postlane.io",
  WEBSITE_URL: "https://postlane.io",
} as const;

// ---------------------------------------------------------------------------
// Supported Social Platforms
// ---------------------------------------------------------------------------
export const PLATFORMS = [
  "facebook",
  "instagram",
  "tiktok",
  "linkedin",
  "youtube",
  "reddit",
  "threads",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_META: Record<
  Platform,
  {
    label: string;
    color: string;
    supportsScheduling: boolean;
    supportsCarousel: boolean;
    supportsVideo: boolean;
    supportsStories: boolean;
    maxCaptionLength: number;
    maxHashtags: number;
  }
> = {
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    supportsScheduling: true,
    supportsCarousel: true,
    supportsVideo: true,
    supportsStories: false,
    maxCaptionLength: 63206,
    maxHashtags: 30,
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    supportsScheduling: true,
    supportsCarousel: true,
    supportsVideo: true,
    supportsStories: true,
    maxCaptionLength: 2200,
    maxHashtags: 30,
  },
  tiktok: {
    label: "TikTok",
    color: "#010101",
    supportsScheduling: true,
    supportsCarousel: false,
    supportsVideo: true,
    supportsStories: false,
    maxCaptionLength: 2200,
    maxHashtags: 30,
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    supportsScheduling: true,
    supportsCarousel: true,
    supportsVideo: true,
    supportsStories: false,
    maxCaptionLength: 3000,
    maxHashtags: 5,
  },
  youtube: {
    label: "YouTube",
    color: "#FF0000",
    supportsScheduling: true,
    supportsCarousel: false,
    supportsVideo: true,
    supportsStories: false,
    maxCaptionLength: 5000,
    maxHashtags: 15,
  },
  reddit: {
    label: "Reddit",
    color: "#FF4500",
    supportsScheduling: true,
    supportsCarousel: false,
    supportsVideo: true,
    supportsStories: false,
    maxCaptionLength: 40000,
    maxHashtags: 0,
  },
  threads: {
    label: "Threads",
    color: "#000000",
    supportsScheduling: true,
    supportsCarousel: true,
    supportsVideo: true,
    supportsStories: false,
    maxCaptionLength: 500,
    maxHashtags: 10,
  },
};

// ---------------------------------------------------------------------------
// Subscription Plans
// ---------------------------------------------------------------------------
export const PLANS = ["free", "starter", "pro", "agency"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LIMITS: Record<
  Plan,
  {
    workspaces: number;
    socialAccounts: number;
    scheduledPosts: number; // per month
    teamMembers: number;
    mediaStorageGB: number;
    analyticsRetentionDays: number;
    aiCreditsPerMonth: number;
    apiAccess: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
  }
> = {
  free: {
    workspaces: 1,
    socialAccounts: 2,
    scheduledPosts: 10,
    teamMembers: 1,
    mediaStorageGB: 1,
    analyticsRetentionDays: 7,
    aiCreditsPerMonth: 0,
    apiAccess: false,
    whiteLabel: false,
    prioritySupport: false,
  },
  starter: {
    workspaces: 2,
    socialAccounts: 10,
    scheduledPosts: 100,
    teamMembers: 3,
    mediaStorageGB: 10,
    analyticsRetentionDays: 30,
    aiCreditsPerMonth: 50,
    apiAccess: false,
    whiteLabel: false,
    prioritySupport: false,
  },
  pro: {
    workspaces: 10,
    socialAccounts: 30,
    scheduledPosts: 1000,
    teamMembers: 10,
    mediaStorageGB: 50,
    analyticsRetentionDays: 90,
    aiCreditsPerMonth: 500,
    apiAccess: true,
    whiteLabel: false,
    prioritySupport: true,
  },
  agency: {
    workspaces: 100,
    socialAccounts: 500,
    scheduledPosts: -1, // unlimited
    teamMembers: 100,
    mediaStorageGB: 500,
    analyticsRetentionDays: 365,
    aiCreditsPerMonth: -1, // unlimited
    apiAccess: true,
    whiteLabel: true,
    prioritySupport: true,
  },
};

// ---------------------------------------------------------------------------
// Stripe Price IDs (replace with actual IDs from Stripe dashboard)
// ---------------------------------------------------------------------------
export const STRIPE_PRICE_IDS: Record<
  Exclude<Plan, "free">,
  { monthly: string; yearly: string }
> = {
  starter: {
    monthly: "price_starter_monthly",
    yearly: "price_starter_yearly",
  },
  pro: {
    monthly: "price_pro_monthly",
    yearly: "price_pro_yearly",
  },
  agency: {
    monthly: "price_agency_monthly",
    yearly: "price_agency_yearly",
  },
};

// ---------------------------------------------------------------------------
// Media / File Upload Limits
// ---------------------------------------------------------------------------
export const MEDIA_LIMITS = {
  /** Max image file size in bytes (10 MB) */
  IMAGE_MAX_BYTES: 10 * 1024 * 1024,
  /** Max video file size in bytes (500 MB) */
  VIDEO_MAX_BYTES: 500 * 1024 * 1024,
  /** Max number of images in a single carousel post */
  MAX_CAROUSEL_IMAGES: 10,
  /** Accepted image MIME types */
  ACCEPTED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ] as const,
  /** Accepted video MIME types */
  ACCEPTED_VIDEO_TYPES: [
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ] as const,
} as const;

// ---------------------------------------------------------------------------
// Rate Limits
// ---------------------------------------------------------------------------
export const RATE_LIMITS = {
  /** Auth endpoints: 10 requests per 15 minutes per IP */
  AUTH: { requests: 10, windowMs: 15 * 60 * 1000 },
  /** General API: 300 requests per minute per user */
  API: { requests: 300, windowMs: 60 * 1000 },
  /** Media upload: 20 uploads per minute per user */
  UPLOAD: { requests: 20, windowMs: 60 * 1000 },
  /** AI endpoints: 20 requests per minute per user */
  AI: { requests: 20, windowMs: 60 * 1000 },
} as const;

// ---------------------------------------------------------------------------
// Token Expiry
// ---------------------------------------------------------------------------
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN_SECONDS: 15 * 60, // 15 minutes
  REFRESH_TOKEN_DAYS: 30,
  EMAIL_VERIFICATION_HOURS: 24,
  PASSWORD_RESET_HOURS: 1,
  INVITATION_DAYS: 7,
} as const;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ---------------------------------------------------------------------------
// Queue Names (BullMQ)
// ---------------------------------------------------------------------------
export const QUEUE_NAMES = {
  POST_SCHEDULER: "post-scheduler",
  POST_PUBLISHER: "post-publisher",
  ANALYTICS_SYNC: "analytics-sync",
  TOKEN_REFRESH: "token-refresh",
  EMAIL: "email",
  MEDIA_PROCESS: "media-process",
  WEBHOOK: "webhook",
} as const;

// ---------------------------------------------------------------------------
// Cache TTLs (seconds)
// ---------------------------------------------------------------------------
export const CACHE_TTL = {
  WORKSPACE_DATA: 60,
  USER_PROFILE: 60 * 5,
  ANALYTICS: 60 * 15,
  PLATFORM_TOKENS: 60 * 55, // slightly less than 1 hour
} as const;

// ---------------------------------------------------------------------------
// Workspace Roles
// ---------------------------------------------------------------------------
export const WORKSPACE_ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

// ---------------------------------------------------------------------------
// Post Status
// ---------------------------------------------------------------------------
export const POST_STATUSES = [
  "draft",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "cancelled",
] as const;
export type PostStatus = (typeof POST_STATUSES)[number];
