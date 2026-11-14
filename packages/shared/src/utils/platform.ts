import { PLATFORMS, PLATFORM_META, type Platform } from "@scope/config";

/**
 * Validates whether a string is a supported social platform.
 */
export function isSupportedPlatform(platform: string): platform is Platform {
  return PLATFORMS.includes(platform as Platform);
}

/**
 * Returns metadata for a platform.
 */
export function getPlatformMeta(platform: Platform) {
  return PLATFORM_META[platform];
}

/**
 * Validates caption length and hashtag count against platform limits.
 */
export function validatePlatformContent(
  platform: Platform,
  caption: string,
  hashtags: string[] = []
): { valid: boolean; errors: string[] } {
  const meta = PLATFORM_META[platform];
  const errors: string[] = [];

  if (caption.length > meta.maxCaptionLength) {
    errors.push(
      `Caption for ${meta.label} exceeds maximum allowed length of ${meta.maxCaptionLength} characters (current: ${caption.length}).`
    );
  }

  if (meta.maxHashtags > 0 && hashtags.length > meta.maxHashtags) {
    errors.push(
      `Hashtags for ${meta.label} exceed maximum allowed count of ${meta.maxHashtags} (current: ${hashtags.length}).`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
