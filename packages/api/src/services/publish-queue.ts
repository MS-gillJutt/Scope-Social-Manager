// =============================================================================
// Publish queue helper (API side) — enqueue jobs the workers pick up
// =============================================================================
//
// The BullMQ queue itself lives in @scope/workers, but the API must not
// depend on the workers package (it would pull the processor + integrations
// into the API process). Instead the API creates its own Queue against the
// same queue name with the same Redis connection (fastify.redis). The worker
// process consumes from the same queue. One memoized Queue per Redis client.
// =============================================================================

import { Queue } from 'bullmq';
import type Redis from 'ioredis';

export const PUBLISH_QUEUE_NAME = 'publish-queue';

export interface PublishJobData {
  publishJobId: string;
  platformPostId: string;
  workspaceId: string;
  platform: string;
  connectedAccountId: string | null;
  idempotencyKey: string;
}

const queues = new WeakMap<Redis, Queue<PublishJobData>>();

export function getPublishQueue(connection: Redis): Queue<PublishJobData> {
  const existing = queues.get(connection);
  if (existing) return existing;
  const queue = new Queue<PublishJobData>(PUBLISH_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 },
      removeOnComplete: false,
      removeOnFail: false,
    },
  });
  queues.set(connection, queue);
  return queue;
}
