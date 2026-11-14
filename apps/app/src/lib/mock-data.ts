export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "owner" | "admin" | "manager" | "editor" | "viewer";
}

export interface MockWorkspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: "free" | "starter" | "pro" | "agency";
  timezone: string;
  connectedAccountsCount: number;
  maxAccounts: number;
  scheduledPostsCount: number;
  maxPosts: number;
  membersCount: number;
  maxMembers: number;
  storageUsedBytes: number;
  storageTotalBytes: number;
}

export interface MockAccount {
  id: string;
  platform: "facebook" | "instagram" | "tiktok" | "linkedin" | "youtube" | "reddit" | "threads";
  accountName: string;
  handle: string;
  avatar: string;
  followersCount: number;
  status: "active" | "expiring_soon" | "disconnected";
  tokenExpiresInDays?: number;
  lastSyncedAt: string;
}

export interface MockPost {
  id: string;
  caption: string;
  mediaUrls: string[];
  mediaType: "image" | "video" | "carousel" | "text";
  platforms: Array<"facebook" | "instagram" | "tiktok" | "linkedin" | "youtube" | "reddit" | "threads">;
  status: "scheduled" | "in_queue" | "published" | "failed" | "draft" | "awaiting_approval";
  scheduledFor: string;
  publishedAt?: string;
  errorMessage?: string;
  platformStatuses: Record<string, "success" | "pending" | "failed">;
  externalLinks?: Record<string, string>;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  };
  author: {
    name: string;
    avatar: string;
  };
}

export interface MockMediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
  size: number;
  dimensions: string;
  usedInPostsCount: number;
  createdAt: string;
}

export interface MockTeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "editor" | "viewer";
  avatar: string;
  status: "active" | "pending";
  joinedAt: string;
}

export const CURRENT_USER: MockUser = {
  id: "usr_01",
  name: "Alex Rivera",
  email: "alex@postlane.io",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  role: "owner",
};

export const CURRENT_WORKSPACE: MockWorkspace = {
  id: "ws_01",
  name: "Acme Growth Media",
  slug: "acme-growth",
  plan: "pro",
  timezone: "America/New_York",
  connectedAccountsCount: 6,
  maxAccounts: 30,
  scheduledPostsCount: 18,
  maxPosts: 1000,
  membersCount: 4,
  maxMembers: 10,
  storageUsedBytes: 4.2 * 1024 * 1024 * 1024, // 4.2 GB
  storageTotalBytes: 50 * 1024 * 1024 * 1024, // 50 GB
};

export const WORKSPACES_LIST: MockWorkspace[] = [
  CURRENT_WORKSPACE,
  {
    id: "ws_02",
    name: "Nebula Studio",
    slug: "nebula-studio",
    plan: "starter",
    timezone: "Europe/London",
    connectedAccountsCount: 3,
    maxAccounts: 10,
    scheduledPostsCount: 4,
    maxPosts: 100,
    membersCount: 2,
    maxMembers: 3,
    storageUsedBytes: 1.1 * 1024 * 1024 * 1024,
    storageTotalBytes: 10 * 1024 * 1024 * 1024,
  },
  {
    id: "ws_03",
    name: "Apex Brands E-Commerce",
    slug: "apex-brands",
    plan: "agency",
    timezone: "America/Los_Angeles",
    connectedAccountsCount: 14,
    maxAccounts: 100,
    scheduledPostsCount: 88,
    maxPosts: 5000,
    membersCount: 8,
    maxMembers: 50,
    storageUsedBytes: 32.5 * 1024 * 1024 * 1024,
    storageTotalBytes: 250 * 1024 * 1024 * 1024,
  },
];

export const CONNECTED_ACCOUNTS: MockAccount[] = [
  {
    id: "acc_ig",
    platform: "instagram",
    accountName: "Postlane Official",
    handle: "@postlanehq",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
    followersCount: 48200,
    status: "active",
    lastSyncedAt: "10 mins ago",
  },
  {
    id: "acc_li",
    platform: "linkedin",
    accountName: "Postlane Technologies",
    handle: "postlane-tech",
    avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&auto=format&fit=crop&q=80",
    followersCount: 19450,
    status: "active",
    lastSyncedAt: "25 mins ago",
  },
  {
    id: "acc_tt",
    platform: "tiktok",
    accountName: "Postlane Daily",
    handle: "@postlanelive",
    avatar: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&auto=format&fit=crop&q=80",
    followersCount: 112000,
    status: "active",
    lastSyncedAt: "1 hour ago",
  },
  {
    id: "acc_fb",
    platform: "facebook",
    accountName: "Postlane Social Community",
    handle: "PostlaneHQ",
    avatar: "https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80",
    followersCount: 32400,
    status: "expiring_soon",
    tokenExpiresInDays: 3,
    lastSyncedAt: "2 hours ago",
  },
  {
    id: "acc_yt",
    platform: "youtube",
    accountName: "Postlane Creator Channel",
    handle: "@PostlaneMedia",
    avatar: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&auto=format&fit=crop&q=80",
    followersCount: 24900,
    status: "active",
    lastSyncedAt: "3 hours ago",
  },
  {
    id: "acc_th",
    platform: "threads",
    accountName: "Postlane HQ",
    handle: "@postlanehq",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
    followersCount: 14200,
    status: "active",
    lastSyncedAt: "40 mins ago",
  },
  {
    id: "acc_rd",
    platform: "reddit",
    accountName: "u/postlane_team",
    handle: "u/postlane_team",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80",
    followersCount: 2840,
    status: "disconnected",
    lastSyncedAt: "3 days ago",
  },
];

export const MOCK_POSTS: MockPost[] = [
  {
    id: "post_01",
    caption: "🚀 Big news! Introducing Postlane 2.0: Schedule, analyze, and publish across 7 platforms with seamless team workflows and instant AI caption generation. Try it free today! #socialmedia #marketing #growth",
    mediaUrls: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"
    ],
    mediaType: "image",
    platforms: ["instagram", "linkedin", "facebook", "threads"],
    status: "scheduled",
    scheduledFor: "2026-11-14T14:30:00Z",
    platformStatuses: {
      instagram: "pending",
      linkedin: "pending",
      facebook: "pending",
      threads: "pending",
    },
    author: {
      name: "Alex Rivera",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "post_02",
    caption: "3 tactics top creators use to double engagement without posting 10 times a day: \n1. Optimize the first 3 seconds\n2. Ask open-ended questions in comments\n3. Consistent timing with data\n\nFull guide in bio! 📈",
    mediaUrls: [
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80"
    ],
    mediaType: "image",
    platforms: ["linkedin", "threads"],
    status: "scheduled",
    scheduledFor: "2026-11-14T18:00:00Z",
    platformStatuses: {
      linkedin: "pending",
      threads: "pending",
    },
    author: {
      name: "Marcus Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "post_03",
    caption: "Behind the scenes at our product lab: How we render multi-platform previews with sub-millisecond precision. Swipe to see the architecture breakdown! 👉",
    mediaUrls: [
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80"
    ],
    mediaType: "carousel",
    platforms: ["instagram", "facebook"],
    status: "in_queue",
    scheduledFor: "2026-11-14T11:00:00Z",
    platformStatuses: {
      instagram: "pending",
      facebook: "pending",
    },
    author: {
      name: "Sophia Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "post_04",
    caption: "The state of organic reach in 2026: Short-form video continues to outperform static by 4.2x. Here are our benchmark findings from 1.2M scheduled posts.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80"
    ],
    mediaType: "image",
    platforms: ["linkedin", "youtube", "tiktok"],
    status: "published",
    scheduledFor: "2026-11-13T16:00:00Z",
    publishedAt: "2026-11-13T16:00:04Z",
    platformStatuses: {
      linkedin: "success",
      youtube: "success",
      tiktok: "success",
    },
    externalLinks: {
      linkedin: "https://linkedin.com/feed/update/urn:li:activity:712984920",
      youtube: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      tiktok: "https://tiktok.com/@postlane/video/7123984",
    },
    metrics: {
      views: 34200,
      likes: 2180,
      comments: 312,
      shares: 145,
      clicks: 890,
    },
    author: {
      name: "Alex Rivera",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "post_05",
    caption: "Token expired error test: Autumn Campaign Announcement discount codes! Use code FALL30 for 30% off any annual subscription tier.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80"
    ],
    mediaType: "image",
    platforms: ["facebook", "instagram"],
    status: "failed",
    scheduledFor: "2026-11-13T09:00:00Z",
    errorMessage: "Facebook OAuth token expired or revoked. Please reconnect your account.",
    platformStatuses: {
      facebook: "failed",
      instagram: "success",
    },
    author: {
      name: "Marcus Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "post_06",
    caption: "Draft concept: 10 tools we use everyday in our SaaS marketing stack. Need review on bullet point 4 before scheduling.",
    mediaUrls: [],
    mediaType: "text",
    platforms: ["linkedin", "threads"],
    status: "draft",
    scheduledFor: "2026-11-15T15:00:00Z",
    platformStatuses: {
      linkedin: "pending",
      threads: "pending",
    },
    author: {
      name: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "post_07",
    caption: "Upcoming Black Friday VIP early access: All team members submit your copy variations here for final sign-off.",
    mediaUrls: [
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80"
    ],
    mediaType: "image",
    platforms: ["instagram", "tiktok", "facebook"],
    status: "awaiting_approval",
    scheduledFor: "2026-11-16T12:00:00Z",
    platformStatuses: {
      instagram: "pending",
      tiktok: "pending",
      facebook: "pending",
    },
    author: {
      name: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    },
  },
];

export const MOCK_MEDIA_ITEMS: MockMediaItem[] = [
  {
    id: "med_01",
    name: "hero-dashboard-preview.png",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
    type: "image",
    size: 2400000,
    dimensions: "1920x1080",
    usedInPostsCount: 4,
    createdAt: "2026-11-12",
  },
  {
    id: "med_02",
    name: "creator-interview-clip.mp4",
    url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80",
    type: "video",
    size: 48500000,
    dimensions: "1080x1920 (9:16)",
    usedInPostsCount: 2,
    createdAt: "2026-11-10",
  },
  {
    id: "med_03",
    name: "analytics-benchmark-chart.png",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
    type: "image",
    size: 1800000,
    dimensions: "1200x630",
    usedInPostsCount: 3,
    createdAt: "2026-11-09",
  },
  {
    id: "med_04",
    name: "team-brainstorming-session.jpg",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    type: "image",
    size: 3100000,
    dimensions: "2048x1365",
    usedInPostsCount: 1,
    createdAt: "2026-11-08",
  },
  {
    id: "med_05",
    name: "black-friday-banner.jpg",
    url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80",
    type: "image",
    size: 4200000,
    dimensions: "1080x1080",
    usedInPostsCount: 1,
    createdAt: "2026-11-05",
  },
  {
    id: "med_06",
    name: "workspace-autumn-flatlay.jpg",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    type: "image",
    size: 2900000,
    dimensions: "1080x1350 (4:5)",
    usedInPostsCount: 2,
    createdAt: "2026-11-02",
  },
];

export const MOCK_TEAM_MEMBERS: MockTeamMember[] = [
  {
    id: "tm_01",
    name: "Alex Rivera",
    email: "alex@postlane.io",
    role: "owner",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    status: "active",
    joinedAt: "Jan 15, 2025",
  },
  {
    id: "tm_02",
    name: "Sophia Chen",
    email: "sophia@postlane.io",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    status: "active",
    joinedAt: "Mar 02, 2025",
  },
  {
    id: "tm_03",
    name: "Marcus Vance",
    email: "marcus@postlane.io",
    role: "manager",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: "active",
    joinedAt: "Jun 11, 2025",
  },
  {
    id: "tm_04",
    name: "Elena Rostova",
    email: "elena@postlane.io",
    role: "editor",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    status: "active",
    joinedAt: "Sep 20, 2025",
  },
  {
    id: "tm_05",
    name: "David Kim",
    email: "david.design@partner.com",
    role: "viewer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    status: "pending",
    joinedAt: "Nov 12, 2026",
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif_01",
    title: "Post Published Successfully",
    message: "Your post 'The state of organic reach in 2026' was published to LinkedIn, YouTube, and TikTok.",
    time: "2 hours ago",
    read: false,
    type: "success" as const,
  },
  {
    id: "notif_02",
    title: "Account Token Expiring Soon",
    message: "Facebook token for 'Postlane Social Community' expires in 3 days. Please reconnect to prevent publishing errors.",
    time: "5 hours ago",
    read: false,
    type: "warning" as const,
  },
  {
    id: "notif_03",
    title: "Post Failed to Publish",
    message: "Autumn Campaign Announcement failed on Facebook due to an expired token.",
    time: "Yesterday",
    read: true,
    type: "error" as const,
  },
  {
    id: "notif_04",
    title: "Team Invite Accepted",
    message: "Elena Rostova accepted your invitation to join Acme Growth Media.",
    time: "2 days ago",
    read: true,
    type: "info" as const,
  },
];

export const MOCK_ANALYTICS_DATA = [
  { date: "Nov 01", engagement: 2400, impressions: 18400, reach: 14200, clicks: 540 },
  { date: "Nov 03", engagement: 3100, impressions: 22100, reach: 17800, clicks: 680 },
  { date: "Nov 05", engagement: 2900, impressions: 20500, reach: 16100, clicks: 620 },
  { date: "Nov 07", engagement: 4200, impressions: 31000, reach: 24500, clicks: 940 },
  { date: "Nov 09", engagement: 3800, impressions: 28900, reach: 21900, clicks: 810 },
  { date: "Nov 11", engagement: 5600, impressions: 42000, reach: 33400, clicks: 1250 },
  { date: "Nov 13", engagement: 6800, impressions: 51200, reach: 41000, clicks: 1680 },
  { date: "Nov 14", engagement: 7400, impressions: 58900, reach: 46800, clicks: 1910 },
];

export const PLATFORM_DISTRIBUTION = [
  { name: "Instagram", value: 38, color: "#E1306C" },
  { name: "LinkedIn", value: 26, color: "#0A66C2" },
  { name: "TikTok", value: 18, color: "#111827" },
  { name: "YouTube", value: 10, color: "#EF4444" },
  { name: "Threads", value: 5, color: "#8B5CF6" },
  { name: "Facebook", value: 3, color: "#1877F2" },
];
