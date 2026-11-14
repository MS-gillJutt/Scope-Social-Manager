import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

/**
 * Creates and configures an AWS S3Client instance targeting Cloudflare R2.
 */
export function createR2Client(overrides?: Partial<S3ClientConfig>): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID || '';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

  const endpoint = accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : undefined;

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    ...overrides,
  });
}

/**
 * Shared singleton S3Client instance for Cloudflare R2 operations.
 */
let _r2ClientInstance: S3Client | null = null;

export const r2Client: S3Client = new Proxy({} as S3Client, {
  get(_target, prop, receiver) {
    if (!_r2ClientInstance) {
      _r2ClientInstance = createR2Client();
    }
    const value = Reflect.get(_r2ClientInstance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(_r2ClientInstance);
    }
    return value;
  },
});
