export * from './base/integration.types.js';
export type { SocialPlatformIntegration } from './base/integration.interface.js';
export { BaseSocialPlatformIntegration } from './base/base-integration.js';

export { FacebookIntegration } from './facebook/facebook.integration.js';
export { InstagramIntegration } from './instagram/instagram.integration.js';
export { ThreadsIntegration } from './threads/threads.integration.js';
export { TikTokIntegration } from './tiktok/tiktok.integration.js';
export { LinkedInIntegration } from './linkedin/linkedin.integration.js';
export { YouTubeIntegration } from './youtube/youtube.integration.js';
export { RedditIntegration } from './reddit/reddit.integration.js';

export { getIntegration, getSupportedPlatforms, isPlatformSupported } from './registry.js';
