import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { r2Client } from './r2.client.js';

export class R2Service {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(client: S3Client = r2Client, bucketName?: string, publicUrl?: string) {
    this.client = client;
    this.bucketName = bucketName || process.env.R2_BUCKET_NAME || 'scope-media';
    this.publicUrl = publicUrl || process.env.R2_PUBLIC_URL || '';
  }

  /**
   * Upload a file (Buffer, Uint8Array, or Readable stream) to Cloudflare R2.
   * Uses @aws-sdk/lib-storage Upload for streaming data directly without buffering entire payload in memory.
   */
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | Readable,
    contentType: string,
    contentLength?: number
  ): Promise<void> {
    if (body instanceof Buffer || body instanceof Uint8Array) {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: contentLength ?? body.byteLength,
      });
      await this.client.send(command);
    } else {
      // Readable stream — stream directly to R2 using multipart upload
      const parallelUpload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        },
        queueSize: 4,
        partSize: 5 * 1024 * 1024, // 5MB part size
        leavePartsOnError: false,
      });

      await parallelUpload.done();
    }
  }

  /**
   * Delete a file from Cloudflare R2 by key.
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.client.send(command);
  }

  /**
   * Generate a presigned private GET URL for secure media access.
   * @param key Storage key of the object
   * @param expiresIn Expiration time in seconds (default: 3600 / 1 hour)
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await awsGetSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Return the public CDN URL for media needing public access (e.g. during platform publishing).
   */
  getPublicUrl(key: string): string {
    const base = this.publicUrl.replace(/\/$/, '');
    const cleanKey = key.replace(/^\//, '');
    return `${base}/${cleanKey}`;
  }

  /**
   * Generate standard storage key:
   * workspace/{workspaceId}/media/{uuid}/{filename}
   */
  generateStorageKey(workspaceId: string, filename: string): string {
    const safeFilename = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_');
    const id = uuidv4();
    return `workspace/${workspaceId}/media/${id}/${safeFilename}`;
  }

  /**
   * Generate thumbnail storage key derived from the original storage key.
   */
  generateThumbnailKey(storageKey: string): string {
    const lastSlashIndex = storageKey.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      return `thumbnails/thumb_${storageKey}.webp`;
    }

    const dir = storageKey.substring(0, lastSlashIndex);
    const file = storageKey.substring(lastSlashIndex + 1);
    const nameWithoutExt = file.replace(/\.[^/.]+$/, '');
    return `${dir}/thumb_${nameWithoutExt}.webp`;
  }

  /**
   * Check if a file exists in the R2 bucket.
   */
  async doesFileExist(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404 ||
        error.name === 'NoSuchKey'
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Fetch a file as a readable stream.
   */
  async getFileStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`File at ${key} has no body`);
    }
    return response.Body as Readable;
  }

  /**
   * Fetch a file completely into a Buffer.
   */
  async getFileBuffer(key: string): Promise<Buffer> {
    const stream = await this.getFileStream(key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}

export const r2Service = new R2Service();

// Standalone exported helpers
export const uploadFile = (
  key: string,
  body: Buffer | Uint8Array | Readable,
  contentType: string,
  contentLength?: number
) => r2Service.uploadFile(key, body, contentType, contentLength);

export const deleteFile = (key: string) => r2Service.deleteFile(key);

export const getSignedUrl = (key: string, expiresIn?: number) =>
  r2Service.getSignedUrl(key, expiresIn);

export const getPublicUrl = (key: string) => r2Service.getPublicUrl(key);

export const generateStorageKey = (workspaceId: string, filename: string) =>
  r2Service.generateStorageKey(workspaceId, filename);

export const generateThumbnailKey = (storageKey: string) =>
  r2Service.generateThumbnailKey(storageKey);

export const doesFileExist = (key: string) => r2Service.doesFileExist(key);
