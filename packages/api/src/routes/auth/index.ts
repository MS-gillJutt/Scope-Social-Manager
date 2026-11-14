import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../../services/auth.service.js';
import { TokenService } from '../../services/token.service.js';
import {
  successResponse,
  messageResponse,
  errorResponse,
} from '../../utils/response.js';
import { strictRateLimit } from '../../plugins/rate-limit.plugin.js';
import { authenticate } from '../../middleware/authenticate.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const login2FASchema = z.object({
  tempToken: z.string().min(1, 'tempToken is required'),
  code: z.string().min(6, 'Verification code must be 6 digits').max(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma, fastify);
  const tokenService = new TokenService(fastify.prisma, fastify);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };

  /**
   * POST /auth/register
   */
  fastify.post(
    '/register',
    { config: { rateLimit: strictRateLimit } },
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return errorResponse(
          reply,
          422,
          'VALIDATION_ERROR',
          'Invalid input',
          parsed.error.flatten().fieldErrors
        );
      }

      const result = await authService.register(parsed.data);
      return successResponse(reply, result, 201, result.message);
    }
  );

  /**
   * POST /auth/verify-email
   */
  fastify.post('/verify-email', async (request, reply) => {
    const parsed = verifyEmailSchema.safeParse(request.body);
    if (!parsed.success) {
      return errorResponse(reply, 422, 'VALIDATION_ERROR', 'Token is required');
    }

    const tokens = await authService.verifyEmail(
      parsed.data.token,
      request.headers['user-agent'],
      request.ip
    );

    reply.setCookie('refreshToken', tokens.refreshToken, cookieOptions);

    return successResponse(
      reply,
      {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      200,
      'Email successfully verified'
    );
  });

  /**
   * POST /auth/login
   */
  fastify.post(
    '/login',
    { config: { rateLimit: strictRateLimit } },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return errorResponse(
          reply,
          422,
          'VALIDATION_ERROR',
          'Invalid credentials',
          parsed.error.flatten().fieldErrors
        );
      }

      const result = await authService.login(
        parsed.data.email,
        parsed.data.password,
        request.ip,
        request.headers['user-agent']
      );

      if (result.requires2FA) {
        return successResponse(reply, {
          requires2FA: true,
          tempToken: result.tempToken,
        });
      }

      if (result.tokens) {
        reply.setCookie('refreshToken', result.tokens.refreshToken, cookieOptions);
        return successResponse(reply, {
          requires2FA: false,
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
          user: result.user,
        });
      }
    }
  );

  /**
   * POST /auth/login/2fa
   */
  fastify.post(
    '/login/2fa',
    { config: { rateLimit: strictRateLimit } },
    async (request, reply) => {
      const parsed = login2FASchema.safeParse(request.body);
      if (!parsed.success) {
        return errorResponse(
          reply,
          422,
          'VALIDATION_ERROR',
          'Invalid verification code',
          parsed.error.flatten().fieldErrors
        );
      }

      const tokens = await authService.login2FA(
        parsed.data.tempToken,
        parsed.data.code,
        request.ip,
        request.headers['user-agent']
      );

      reply.setCookie('refreshToken', tokens.refreshToken, cookieOptions);

      return successResponse(reply, {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      });
    }
  );

  /**
   * POST /auth/refresh
   */
  fastify.post('/refresh', async (request, reply) => {
    // Read from httpOnly cookie or fallback to body
    const tokenFromCookie = (request as any).cookies?.refreshToken;
    const tokenFromBody = (request.body as any)?.refreshToken;
    const token = tokenFromCookie || tokenFromBody;

    if (!token) {
      return errorResponse(reply, 401, 'UNAUTHORIZED', 'Refresh token is required');
    }

    const tokens = await tokenService.rotateRefreshToken(
      token,
      request.headers['user-agent'],
      request.ip
    );

    reply.setCookie('refreshToken', tokens.refreshToken, cookieOptions);

    return successResponse(reply, {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    });
  });

  /**
   * POST /auth/logout
   */
  fastify.post('/logout', async (request, reply) => {
    const token =
      (request as any).cookies?.refreshToken || (request.body as any)?.refreshToken;

    if (token) {
      await tokenService.revokeRefreshToken(token);
    }

    reply.clearCookie('refreshToken', { path: '/' });
    return messageResponse(reply, 'Successfully logged out');
  });

  /**
   * POST /auth/forgot-password
   */
  fastify.post(
    '/forgot-password',
    { config: { rateLimit: strictRateLimit } },
    async (request, reply) => {
      const parsed = forgotPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        // Return 200 anyway to prevent user enumeration
        return messageResponse(
          reply,
          'If an account exists with that email, a password reset link has been sent.'
        );
      }

      await authService.forgotPassword(parsed.data.email);

      return messageResponse(
        reply,
        'If an account exists with that email, a password reset link has been sent.'
      );
    }
  );

  /**
   * POST /auth/reset-password
   */
  fastify.post(
    '/reset-password',
    { config: { rateLimit: strictRateLimit } },
    async (request, reply) => {
      const parsed = resetPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return errorResponse(
          reply,
          422,
          'VALIDATION_ERROR',
          'Invalid password reset data',
          parsed.error.flatten().fieldErrors
        );
      }

      await authService.resetPassword(parsed.data.token, parsed.data.password);
      reply.clearCookie('refreshToken', { path: '/' });

      return messageResponse(
        reply,
        'Password has been reset successfully. Please log in with your new password.'
      );
    }
  );

  /**
   * GET /auth/me
   */
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return successResponse(reply, user);
  });
};
