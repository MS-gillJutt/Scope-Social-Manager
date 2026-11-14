// =============================================================================
// Workers entry point — run with `pnpm --filter @scope/workers dev`
// =============================================================================

import { Worker } from 'bullmq';
import { prisma } from '@scope/db';
import { PUBLISH_QUEUE_NAME, type PublishJobData } from './queues/publish.queue.js';
import { processPublishJob } from './processors/publish.processor.js';
import { createRedisConnection } from './redis.js';
import { logger } from './utils/logger.js';

const CONCURRENCY = Number(process.env.PUBLISH_WORKER_CONCURRENCY ?? 5);

export function startWorkers() {
  // BullMQ workers need their own blocking connection
  const publishWorker = new Worker<PublishJobData>(PUBLISH_QUEUE_NAME, processPublishJob, {
    connection: createRedisConnection(),
    concurrency: CONCURRENCY,
    // Keep idle Redis traffic low (matters on metered free tiers like Upstash)
    drainDelay: 30,
    stalledInterval: 60_000,
  });

  publishWorker.on('completed', (job) => logger.info({ jobId: job.id }, 'Publish job completed'));
  publishWorker.on('failed', (job, err) =>
    logger.warn({ jobId: job?.id, err: err.message }, 'Publish job failed'),
  );
  publishWorker.on('error', (err) => logger.error({ err: err.message }, 'Publish worker error'));

  logger.info({ queue: PUBLISH_QUEUE_NAME, concurrency: CONCURRENCY }, 'Workers started');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down workers');
    await publishWorker.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  return { publishWorker };
}

startWorkers();
