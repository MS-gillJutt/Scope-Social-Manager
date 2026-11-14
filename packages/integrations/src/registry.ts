// =============================================================================
// Integration registry — one place to get an integration for a platform
// =============================================================================

import type { Platform } from './base/integration.types.js';
import type { BaseSocialPlatformIntegration } from './base/base-integration.js';
import { FacebookIntegration } from './facebook/facebook.integration.js';
import { InstagramIntegration } from './instagram/instagram.integration.js';
import { ThreadsIntegration } from './threads/threads.integration.js';
import { TikTokIntegration } from './tiktok/tiktok.integration.js';
import { LinkedInIntegration } from './linkedin/linkedin.integration.js';
import { YouTubeIntegration } from './youtube/youtube.integration.js';

/**
 * Factories (not instances) so credentials are read from env lazily and
 * each caller gets a fresh client.
 * TODO: register REDDIT once reddit.integration.ts is implemented.
 */
const factories: Partial<Record<Platform, () => BaseSocialPlatformIntegration>> = {
  FACEBOOK: () => new FacebookIntegration(),
  INSTAGRAM: () => new InstagramIntegration(),
  THREADS: () => new ThreadsIntegration(),
  TIKTOK: () => new TikTokIntegration(),
  LINKEDIN: () => new LinkedInIntegration(),
  YOUTUBE: () => new YouTubeIntegration(),
};

export function isPlatformSupported(platform: Platform): boolean {
  return platform in factories;
}

export function getSupportedPlatforms(): Platform[] {
  return Object.keys(factories) as Platform[];
}

export function getIntegration(platform: Platform): BaseSocialPlatformIntegration {
  const factory = factories[platform];
  if (!factory) {
    throw new Error(`Integration for platform "${platform}" is not implemented yet`);
  }
  return factory();
}
