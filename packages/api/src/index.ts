import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';

// Plugins
import prismaPlugin from './plugins/prisma.plugin.js';
import redisPlugin from './plugins/redis.plugin.js';
import authPlugin from './plugins/auth.plugin.js';
import rateLimitPlugin from './plugins/rate-limit.plugin.js';
import multipartPlugin from './plugins/multipart.plugin.js';

// Routes
import { authRoutes } from './routes/auth/index.js';
import { accountRoutes } from './routes/account/index.js';
import { workspaceRoutes } from './routes/workspaces/index.js';

// Utils
import { AppError } from './utils/errors.js';
import { errorResponse } from './utils/response.js';

export async function buildApp() {
  const isDev = process.env.NODE_ENV === 'development';

  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              ignore: 'pid,hostname',
              translateTime: 'HH:MM:ss Z',
            },
          }
        : undefined,
    },
    trustProxy: true,
    disableRequestLogging: false,
  });

  // Global Core Plugins
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isDev ? false : undefined,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  await app.register(cors, {
    origin: [appUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'cookie-fallback-secret-32-chars-long!',
    parseOptions: {},
  });

  // Database & Cache Infrastructure Plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);

  // Rate Limiting Plugin
  await app.register(rateLimitPlugin);

  // Multipart File Upload Plugin
  await app.register(multipartPlugin);

  // JWT & Authentication Plugin
  await app.register(authPlugin);

  // Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    // Log unexpected errors
    if (!(error instanceof AppError) && error.statusCode !== 429) {
      request.log.error(
        {
          err: error,
          url: request.raw.url,
          method: request.raw.method,
          params: request.params,
        },
        'Unhandled request error'
      );
    }

    // Custom App Errors
    if (error instanceof AppError) {
      return errorResponse(
        reply,
        error.statusCode,
        error.code,
        error.message,
        (error as any).details
      );
    }

    // Fastify Validation Errors
    if ((error as any).validation) {
      return errorResponse(
        reply,
        400,
        'VALIDATION_ERROR',
        error.message,
        (error as any).validation
      );
    }

    // Rate Limit Errors
    if (error.statusCode === 429) {
      return errorResponse(
        reply,
        429,
        'RATE_LIMIT_EXCEEDED',
        error.message || 'Too many requests, please try again later.'
      );
    }

    // Default 500
    const statusCode = error.statusCode || 500;
    const message =
      process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : error.message;

    return errorResponse(reply, statusCode, 'INTERNAL_SERVER_ERROR', message);
  });

  // Health check route
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: '@scope/api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Register API Routes
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(accountRoutes, { prefix: '/account' });
  await app.register(workspaceRoutes, { prefix: '/workspaces' });

  return app;
}

// Start server if executed directly
async function start() {
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    const app = await buildApp();

    await app.listen({ port, host });
    app.log.info(`🚀 Scope Social Manager API Server running at http://${host}:${port}`);

    // Graceful Shutdown Handlers
    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}, initiating graceful shutdown...`);
        try {
          await app.close();
          app.log.info('Fastify server closed gracefully');
          process.exit(0);
        } catch (err) {
          app.log.error({ err }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });
    }
  } catch (err) {
    console.error('Fatal error starting Scope Social Manager API server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
