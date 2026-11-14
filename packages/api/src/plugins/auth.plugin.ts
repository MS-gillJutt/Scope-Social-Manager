import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fjwt from '@fastify/jwt';
import { AuthError } from '../utils/errors.js';

export default fp(async function authPlugin(fastify: FastifyInstance) {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set');
  }

  await fastify.register(fjwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: '15m',
    },
  });

  // Decorate the authenticate handler on the fastify instance
  fastify.decorate(
    'authenticate',
    async function authenticate(request: any, reply: any) {
      try {
        await request.jwtVerify();
        const payload = request.user as {
          id: string;
          email: string;
          name: string;
          emailVerified: boolean;
          twoFactorEnabled: boolean;
        };

        // Fetch fresh user from DB to ensure it still exists and isn't deleted
        const user = await fastify.prisma.user.findUnique({
          where: { id: payload.id, deletedAt: null },
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            twoFactorEnabled: true,
          },
        });

        if (!user) {
          throw new AuthError('User no longer exists');
        }

        request.user = user;
      } catch (err: any) {
        if (err instanceof AuthError) throw err;
        throw new AuthError('Invalid or expired token');
      }
    }
  );
});
