import { Queue, type JobsOptions } from 'bullmq';
import type { Redis } from 'ioredis';
import type { Platform } from '@scope/db';
import { redisConnection } from '../redis.js';

export const PUBLISH_QUEUE_NAME = 'publish-queue';

export interface PublishJobData {
  publishJobId: string;
  platformPostId: string;
  workspaceId: string;
  platform: Platform;
  connectedAccountId: string;
  idempotencyKey: string;
}

export const defaultPublishJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 60000, // 1 min, 2 min, 4 min
  },
  removeOnComplete: false,
  removeOnFail: false,
};

export function createPublishQueue(connection: Redis = redisConnection): Queue<PublishJobData> {
  return new Queue<PublishJobData>(PUBLISH_QUEUE_NAME, {
    connection,
    defaultJobOptions: defaultPublishJobOptions,
  });
}

export const publishQueue = createPublishQueue();
