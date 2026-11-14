// =============================================================================
// Publish processor — takes one PublishJob and posts it to the platform
// =============================================================================

import { UnrecoverableError, type Job } from 'bullmq';
import { prisma, PostStatus, type Prisma } from '@scope/db';
import {
  getIntegration,
  IntegrationError,
  type ContentType as IntegrationContentType,
  type PlatformPostPayload,
  type Platform as IntegrationPlatform,
} from '@scope/integrations';
import type { PublishJobData } from '../queues/publish.queue.js';
import { getValidTokens, markAccountExpired } from '../services/account-tokens.js';
import { classifyError } from '../utils/errors.js';
import { sanitizeApiResponse } from '../utils/sanitizer.js';
import { logger } from '../utils/logger.js';

const toJson = (v: unknown) => v as Prisma.InputJsonValue;

export async function processPublishJob(job: Job<PublishJobData>): Promise<void> {
  const { publishJobId, platformPostId } = job.data;
  const log = logger.child({ jobId: job.id, publishJobId, platformPostId });

  const publishJob = await prisma.publishJob.findUnique({ where: { id: publishJobId } });
  if (!publishJob) throw new UnrecoverableError(`PublishJob ${publishJobId} not found`);

  const post = await prisma.platformPost.findUnique({
    where: { id: platformPostId },
    include: {
      connectedAccount: true,
      contentItem: {
        include: {
          mediaAttachments: { include: { mediaAsset: true }, orderBy: { order: 'asc' } },
        },
      },
    },
  });
  if (!post) throw new UnrecoverableError(`PlatformPost ${platformPostId} not found`);

  // Idempotency: never publish twice (retries, duplicate enqueues)
  if (post.status === PostStatus.PUBLISHED) {
    log.warn('Post already published — skipping');
    return;
  }
  if (post.status === PostStatus.CANCELLED) {
    log.info('Post was cancelled — skipping');
    await prisma.publishJob.update({
      where: { id: publishJobId },
      data: { status: PostStatus.CANCELLED, completedAt: new Date() },
    });
    return;
  }

  const attempt = job.attemptsMade + 1;
  await prisma.$transaction([
    prisma.publishJob.update({
      where: { id: publishJobId },
      data: { status: PostStatus.PUBLISHING, startedAt: new Date(), attemptNumber: attempt },
    }),
    prisma.platformPost.update({
      where: { id: platformPostId },
      data: { status: PostStatus.PUBLISHING, lastAttemptAt: new Date(), retryCount: attempt - 1 },
    }),
  ]);

  try {
    const integration = getIntegration(post.platform as IntegrationPlatform);
    const tokens = await getValidTokens(post.connectedAccount);

    const publicBase = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
    const payload: PlatformPostPayload = {
      contentType: post.contentItem.contentType as IntegrationContentType,
      caption: post.caption ?? post.contentItem.mainCaption ?? undefined,
      title: post.title ?? post.contentItem.title ?? undefined,
      linkUrl: post.linkUrl ?? undefined,
      hashtags: post.hashtags,
      platformOptions: (post.platformOptions as Record<string, unknown> | null) ?? undefined,
      media: post.contentItem.mediaAttachments.map(({ mediaAsset }) => ({
        url: `${publicBase}/${mediaAsset.storageKey}`,
        mimeType: mediaAsset.mimeType,
      })),
    };

    const problems = integration.validateContent(payload).filter((r) => r.severity === 'error');
    if (problems.length > 0) {
      throw new IntegrationError(
        `Content invalid for ${post.platform}: ${problems.map((p) => p.message).join('; ')}`,
        'CONTENT_REJECTED',
      );
    }

    const result = await integration.publishPost(tokens, payload);

    await prisma.$transaction([
      prisma.platformPost.update({
        where: { id: platformPostId },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
          platformPostId: result.platformPostId,
          platformPostUrl: result.platformPostUrl,
          errorCode: null,
          errorMessage: null,
        },
      }),
      prisma.publishJob.update({
        where: { id: publishJobId },
        data: {
          status: PostStatus.PUBLISHED,
          completedAt: new Date(),
          errorDetails: undefined,
          apiResponse: toJson(sanitizeApiResponse(result.rawResponse ?? {})),
        },
      }),
    ]);

    log.info({ platform: post.platform, platformPostId: result.platformPostId }, 'Post published');
  } catch (error) {
    const classified = classifyError(error);
    const maxAttempts = job.opts.attempts ?? 1;
    const isFinal = classified.classification === 'PERMANENT' || attempt >= maxAttempts;
    const code = error instanceof IntegrationError ? error.code : 'UNKNOWN';

    log.error({ code, attempt, isFinal, message: classified.message }, 'Publish attempt failed');

    if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID') {
      await markAccountExpired(post.connectedAccountId);
    }

    await prisma.$transaction([
      prisma.platformPost.update({
        where: { id: platformPostId },
        data: {
          status: isFinal
            ? code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID'
              ? PostStatus.NEEDS_MANUAL_ACTION
              : PostStatus.FAILED
            : PostStatus.QUEUED,
          errorCode: code,
          errorMessage: classified.message.slice(0, 500),
        },
      }),
      prisma.publishJob.update({
        where: { id: publishJobId },
        data: {
          status: isFinal ? PostStatus.FAILED : PostStatus.QUEUED,
          completedAt: isFinal ? new Date() : undefined,
          errorDetails: toJson(sanitizeApiResponse({ ...classified, attempt })),
        },
      }),
    ]);

    // Permanent errors must not be retried by BullMQ
    if (classified.classification === 'PERMANENT') {
      throw new UnrecoverableError(classified.message);
    }
    throw error; // temporary → BullMQ retries with exponential backoff
  }
}
