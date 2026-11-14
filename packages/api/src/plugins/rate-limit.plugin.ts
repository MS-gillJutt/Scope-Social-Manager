import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

export default fp(async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyRateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    redis: fastify.redis,
    keyGenerator: (request) =>
      request.headers['x-forwarded-for']?.toString() ?? request.ip,
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        retryAfter: Math.ceil(context.ttl / 1000),
      },
    }),
  });
});

/**
 * Strict rate limit config for auth endpoints — attach per-route.
 */
export const strictRateLimit = {
  max: 10,
  timeWindow: '15 minutes',
};

/**
 * Moderate rate limit for general API calls.
 */
export const moderateRateLimit = {
  max: 60,
  timeWindow: '1 minute',
};
