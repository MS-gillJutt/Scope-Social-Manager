// =============================================================================
// Content routes — the composer's backend: create posts, enqueue real publishes
// =============================================================================
//
// POST /workspaces/:workspaceId/content
//   Creates a ContentItem + one PlatformPost per selected platform + one
//   PublishJob per post, and enqueues each job on the BullMQ publish queue.
//   The workers pick the jobs up and call the real platform APIs.
//   Platforms without a connected account are SKIPPED (reported back), except
//   WHATSAPP, which needs no account (manual Status flow).
//   Body: { title?, caption, hashtags?, contentType, mediaAssetIds?,
//           platforms[], platformOptions?, publishAt?, publishNow? }
//   - publishNow=false → draft only (no jobs, posts stay DRAFT).
//   - publishAt in the future → jobs delayed until then, posts SCHEDULED.
//   - otherwise → jobs enqueued immediately, posts QUEUED.
// GET  /workspaces/:workspaceId/content — list (newest first, with posts + jobs)
// GET  /workspaces/:workspaceId/content/:contentId — one post with its platform posts
// DELETE /workspaces/:workspaceId/content/:contentId — cancel queued jobs
// PATCH /workspaces/:workspaceId/content/:contentId/platforms/:platformPostId/complete
//   Marks a NEEDS_MANUAL_ACTION post (WhatsApp Status) as PUBLISHED after the
//   user posted it by hand. Body: { platformPostUrl? }
// POST /workspaces/:workspaceId/content/media — multipart upload to R2,
//   creates a MediaAsset. Field name: "file". Images + video only, 50 MB max.
// =============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  Platform,
  ContentType,
  ContentStatus,
  PostStatus,
  MediaType,
  MediaStatus,
  type Prisma,
} from '@scope/db';
import { uploadFile, generateStorageKey, getPublicUrl } from '@scope/media/storage';
import { isPlatformSupported, type Platform as IntegrationPlatform } from '@scope/integrations';
import { authenticate } from '../../middleware/authenticate.js';
import { validateWorkspace } from '../../middleware/validate-workspace.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { getPublishQueue } from '../../services/publish-queue.js';

const createContentSchema = z.object({
  title: z.string().max(300).optional(),
  caption: z.string().max(10000).optional().default(''),
  hashtags: z.array(z.string().max(100)).max(50).optional().default([]),
  contentType: z.nativeEnum(ContentType),
  mediaAssetIds: z.array(z.string()).max(10).optional().default([]),
  platforms: z.array(z.nativeEnum(Platform)).min(1).max(10),
  platformOptions: z.record(z.unknown()).optional().default({}),
  publishAt: z.string().datetime().optional(),
  publishNow: z.boolean().optional().default(true),
});

const completeSchema = z.object({
  platformPostUrl: z.string().url().optional(),
});

function mapPlatformPost(post: {
  id: string;
  platform: string;
  status: string;
  caption: string | null;
  hashtags: string[];
  title: string | null;
  linkUrl: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  platformPostId: string | null;
  platformPostUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  publishJobs: Array<{
    id: string;
    status: string;
    apiResponse: unknown;
  }>;
}) {
  const latestJob = post.publishJobs[0];
  return {
    id: post.id,
    platform: post.platform,
    status: post.status,
    caption: post.caption,
    hashtags: post.hashtags,
    title: post.title,
    linkUrl: post.linkUrl,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    platformPostId: post.platformPostId,
    platformPostUrl: post.platformPostUrl,
    errorCode: post.errorCode,
    errorMessage: post.errorMessage,
    // For manual-action posts the worker stores the note + media URLs here.
    manualAction: latestJob?.apiResponse ?? null,
  };
}

export const contentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', validateWorkspace);

  /**
   * POST /workspaces/:workspaceId/content
   */
  fastify.post('/', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const parsed = createContentSchema.safeParse(request.body);
    if (!parsed.success) {
      return errorResponse(reply, 422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten().fieldErrors);
    }
    const { title, caption, hashtags, contentType, mediaAssetIds, platforms, platformOptions, publishAt, publishNow } =
      parsed.data;

    const publishAtDate = publishAt ? new Date(publishAt) : null;
    const isScheduled = publishAtDate !== null && publishAtDate.getTime() > Date.now();
    const isDraft = !publishNow;

    // Media assets must belong to this workspace.
    const assets =
      mediaAssetIds.length > 0
        ? await fastify.prisma.mediaAsset.findMany({
            where: { id: { in: mediaAssetIds }, workspaceId, deletedAt: null },
            select: { id: true },
          })
        : [];
    if (assets.length !== mediaAssetIds.length) {
      return errorResponse(reply, 422, 'VALIDATION_ERROR', 'One or more media assets were not found in this workspace.');
    }

    // Connected accounts for the selected platforms (WhatsApp needs none).
    const accounts = await fastify.prisma.connectedAccount.findMany({
      where: { workspaceId, platform: { in: platforms }, status: 'ACTIVE' },
      select: { id: true, platform: true },
    });
    const accountByPlatform = new Map(accounts.map((a) => [a.platform, a.id]));
    const skipped: Array<{ platform: string; reason: string }> = [];
    const targetPlatforms = platforms.filter((platform) => {
      if (platform === Platform.WHATSAPP) return true;
      // The DB enum also has PINTEREST/X, which no integration implements —
      // never enqueue a job the worker cannot run.
      if (!isPlatformSupported(platform as unknown as IntegrationPlatform)) {
        skipped.push({ platform, reason: 'not-supported' });
        return false;
      }
      if (!accountByPlatform.has(platform)) {
        skipped.push({ platform, reason: 'not-connected' });
        return false;
      }
      return true;
    });
    if (targetPlatforms.length === 0) {
      return errorResponse(
        reply,
        422,
        'NO_CONNECTED_ACCOUNT',
        'None of the selected platforms has a connected account. Connect an account first, or pick WhatsApp Status (manual).',
        { skipped }
      );
    }

    const contentItem = await fastify.prisma.contentItem.create({
      data: {
        workspaceId,
        title: title ?? null,
        mainCaption: caption || null,
        status: isDraft
          ? ContentStatus.DRAFT
          : isScheduled
            ? ContentStatus.SCHEDULED
            : ContentStatus.PUBLISHING,
        contentType,
        tags: hashtags.map((h) => h.replace(/^#/, '')),
        createdBy: request.user.id,
        publishAt: publishAtDate,
        mediaAttachments: {
          create: mediaAssetIds.map((mediaAssetId, order) => ({ mediaAssetId, order })),
        },
      },
    });

    const queue = getPublishQueue(fastify.redis);
    const createdPosts = [];
    for (const platform of targetPlatforms) {
      const platformPost = await fastify.prisma.platformPost.create({
        data: {
          contentItemId: contentItem.id,
          workspaceId,
          platform,
          connectedAccountId: accountByPlatform.get(platform) ?? null,
          caption: caption || null,
          hashtags: hashtags.map((h) => h.replace(/^#/, '')),
          title: title ?? null,
          platformOptions: (platformOptions ?? {}) as Prisma.InputJsonValue,
          status: isDraft ? PostStatus.DRAFT : isScheduled ? PostStatus.SCHEDULED : PostStatus.QUEUED,
          scheduledAt: isScheduled ? publishAtDate : null,
        },
      });

      if (!isDraft) {
        const idempotencyKey = `${contentItem.id}:${platform}`;
        const publishJob = await fastify.prisma.publishJob.create({
          data: {
            platformPostId: platformPost.id,
            workspaceId,
            idempotencyKey,
            bullmqJobId: idempotencyKey,
            status: isScheduled ? PostStatus.SCHEDULED : PostStatus.QUEUED,
            scheduledAt: isScheduled && publishAtDate ? publishAtDate : new Date(),
          },
        });
        const delay =
          isScheduled && publishAtDate ? Math.max(0, publishAtDate.getTime() - Date.now()) : 0;
        await queue.add(
          'publish',
          {
            publishJobId: publishJob.id,
            platformPostId: platformPost.id,
            workspaceId,
            platform,
            connectedAccountId: accountByPlatform.get(platform) ?? null,
            idempotencyKey,
          },
          { jobId: idempotencyKey, delay }
        );
      }

      createdPosts.push({ id: platformPost.id, platform, status: platformPost.status });
    }

    return successResponse(
      reply,
      { contentItemId: contentItem.id, status: contentItem.status, posts: createdPosts, skipped },
      201
    );
  });

  /**
   * GET /workspaces/:workspaceId/content
   */
  fastify.get('/', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const query = request.query as { limit?: string };
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20) || 20));
    const items = await fastify.prisma.contentItem.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        mediaAttachments: {
          include: { mediaAsset: true },
          orderBy: { order: 'asc' },
        },
        platformPosts: {
          include: {
            publishJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return successResponse(
      reply,
      items.map((item) => ({
        id: item.id,
        title: item.title,
        caption: item.mainCaption,
        tags: item.tags,
        contentType: item.contentType,
        status: item.status,
        publishAt: item.publishAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        media: item.mediaAttachments.map(({ mediaAsset }) => ({
          id: mediaAsset.id,
          storageKey: mediaAsset.storageKey,
          url: getPublicUrl(mediaAsset.storageKey),
          mimeType: mediaAsset.mimeType,
          mediaType: mediaAsset.mediaType,
        })),
        platformPosts: item.platformPosts.map((p) => mapPlatformPost(p)),
      }))
    );
  });

  /**
   * GET /workspaces/:workspaceId/content/:contentId
   */
  fastify.get('/:contentId', async (request, reply) => {
    const { workspaceId, contentId } = request.params as { workspaceId: string; contentId: string };
    const item = await fastify.prisma.contentItem.findFirst({
      where: { id: contentId, workspaceId },
      include: {
        mediaAttachments: { include: { mediaAsset: true }, orderBy: { order: 'asc' } },
        platformPosts: {
          include: { publishJobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!item) return errorResponse(reply, 404, 'NOT_FOUND', 'Post not found.');
    return successResponse(reply, {
      id: item.id,
      title: item.title,
      caption: item.mainCaption,
      tags: item.tags,
      contentType: item.contentType,
      status: item.status,
      publishAt: item.publishAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      media: item.mediaAttachments.map(({ mediaAsset }) => ({
        id: mediaAsset.id,
        storageKey: mediaAsset.storageKey,
        url: getPublicUrl(mediaAsset.storageKey),
        mimeType: mediaAsset.mimeType,
        mediaType: mediaAsset.mediaType,
      })),
      platformPosts: item.platformPosts.map((p) => mapPlatformPost(p)),
    });
  });

  /**
   * DELETE /workspaces/:workspaceId/content/:contentId — cancel queued work
   */
  fastify.delete('/:contentId', async (request, reply) => {
    const { workspaceId, contentId } = request.params as { workspaceId: string; contentId: string };
    const item = await fastify.prisma.contentItem.findFirst({
      where: { id: contentId, workspaceId },
      include: { platformPosts: { include: { publishJobs: true } } },
    });
    if (!item) return errorResponse(reply, 404, 'NOT_FOUND', 'Post not found.');

    const queue = getPublishQueue(fastify.redis);
    for (const post of item.platformPosts) {
      if (post.status === PostStatus.QUEUED || post.status === PostStatus.SCHEDULED) {
        for (const job of post.publishJobs) {
          const bullJob = await queue.getJob(job.idempotencyKey);
          if (bullJob) await bullJob.remove();
        }
        await fastify.prisma.platformPost.update({
          where: { id: post.id },
          data: { status: PostStatus.CANCELLED },
        });
      }
    }
    await fastify.prisma.contentItem.update({
      where: { id: item.id },
      data: { status: ContentStatus.ARCHIVED },
    });
    return successResponse(reply, { contentItemId: item.id, status: ContentStatus.ARCHIVED });
  });

  /**
   * PATCH .../content/:contentId/platforms/:platformPostId/complete
   * Close the loop on a manual-action post (WhatsApp Status): MS posted it
   * by hand in the app, so mark it PUBLISHED here.
   */
  fastify.patch('/:contentId/platforms/:platformPostId/complete', async (request, reply) => {
    const { workspaceId, contentId, platformPostId } = request.params as {
      workspaceId: string;
      contentId: string;
      platformPostId: string;
    };
    const parsed = completeSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return errorResponse(reply, 422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten().fieldErrors);
    }
    const post = await fastify.prisma.platformPost.findFirst({
      where: { id: platformPostId, contentItemId: contentId, workspaceId },
    });
    if (!post) return errorResponse(reply, 404, 'NOT_FOUND', 'Platform post not found.');
    if (post.status !== PostStatus.NEEDS_MANUAL_ACTION) {
      return errorResponse(
        reply,
        422,
        'VALIDATION_ERROR',
        `Only a post waiting for manual action can be marked posted (current status: ${post.status}).`
      );
    }
    const updated = await fastify.prisma.platformPost.update({
      where: { id: post.id },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        platformPostUrl: parsed.data.platformPostUrl ?? null,
      },
    });
    return successResponse(reply, { id: updated.id, platform: updated.platform, status: updated.status });
  });

  /**
   * POST /workspaces/:workspaceId/content/media — upload one file to R2
   */
  fastify.post('/media', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const file = await request.file();
    if (!file) {
      return errorResponse(reply, 422, 'VALIDATION_ERROR', 'No file uploaded (field name "file").');
    }
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      return errorResponse(reply, 422, 'VALIDATION_ERROR', 'Only image and video files are supported.');
    }
    const buffer = await file.toBuffer();
    const mediaType = file.mimetype.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE;
    const storageKey = generateStorageKey(workspaceId, file.filename);
    await uploadFile(storageKey, buffer, file.mimetype, buffer.byteLength);
    const asset = await fastify.prisma.mediaAsset.create({
      data: {
        workspaceId,
        filename: storageKey.split('/').pop() ?? file.filename,
        originalName: file.filename,
        mimeType: file.mimetype,
        mediaType,
        size: BigInt(buffer.byteLength),
        status: MediaStatus.READY,
        storageKey,
        uploadedBy: request.user.id,
      },
    });
    return successResponse(
      reply,
      {
        mediaAssetId: asset.id,
        storageKey: asset.storageKey,
        url: getPublicUrl(asset.storageKey),
        mimeType: asset.mimeType,
        mediaType: asset.mediaType,
        size: buffer.byteLength,
      },
      201
    );
  });
};
