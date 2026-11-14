import type { Platform } from '@scope/config';

export type { Platform };

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

export interface ImageProcessOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  rotate?: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ImageValidation {
  valid: boolean;
  format?: string;
  width?: number;
  height?: number;
  error?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  aspectRatio: number;
  hasAlpha?: boolean;
  space?: string;
  channels?: number;
  density?: number;
}

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  codec: string;
  audioCodec?: string;
  bitrate: number;
  fps: number;
  sizeBytes: number;
  format: string;
  aspectRatio: number;
}

export interface TranscodeOptions {
  maxWidth?: number;
  maxHeight?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  fps?: number;
  format?: string;
  videoCodec?: string;
  audioCodec?: string;
  preset?: string;
  crf?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface MediaAssetValidationInput {
  filename: string;
  mimeType: string;
  mediaType: MediaType | string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface PlatformMediaRequirements {
  platform: Platform;
  maxImageBytes: number;
  allowedImageFormats: string[];
  maxVideoBytes: number;
  minVideoDurationSeconds: number;
  maxVideoDurationSeconds: number;
  allowedVideoFormats: string[];
  recommendedImageAspectRatios?: string[];
  notes?: string;
}
