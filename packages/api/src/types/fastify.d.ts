import { PrismaClient, User, WorkspaceMember } from '@postlane/db';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
      twoFactorEnabled: boolean;
    };
    workspaceMember: WorkspaceMember & {
      workspace: {
        id: string;
        name: string;
        slug: string;
        plan: string;
      };
    };
  }
}
