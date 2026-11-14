// =============================================================================
// Media / Asset Types
// =============================================================================

export type MediaType = "image" | "video" | "gif";

export interface MediaAsset {
  id: string;
  workspaceId: string;
  uploadedById: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  mediaType: MediaType;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  /** Public CDN URL */
  url: string;
  /** Thumbnail URL (auto-generated for videos) */
  thumbnailUrl: string | null;
  /** R2 storage key */
  storageKey: string;
  altText: string | null;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadUrlRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadUrlResponse {
  uploadUrl: string; // presigned PUT URL
  mediaId: string; // provisional ID, confirmed after upload completes
  storageKey: string;
  expiresAt: Date;
}

export interface ConfirmUploadInput {
  mediaId: string;
  storageKey: string;
  altText?: string;
}

export interface MediaFilter {
  mediaType?: MediaType;
  labels?: string[];
  search?: string;
  from?: Date;
  to?: Date;
}
