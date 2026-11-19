import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticate } from '../../middleware/authenticate.js';
import { AuthService } from '../../services/auth.service.js';
import { TokenService } from '../../services/token.service.js';
import { AuditService } from '../../services/audit.service.js';
import {
  successResponse,
  messageResponse,
  errorResponse,
} from '../../utils/response.js';
import { AuthError, NotFoundError } from '../../utils/errors.js';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const confirm2FASchema = z.object({
  code: z.string().min(6).max(8),
});

const disable2FASchema = z.object({
  password: z.string().min(1, 'Password is required to disable 2FA'),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
});

export const accountRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma, fastify);
  const tokenService = new TokenService(fastify.prisma, fastify);
  const auditService = new AuditService(fastify.prisma);

  // All account routes require authentication
  fastify.addHook('preHandler', authenticate);

  /**
   * GET /account/profile
   */
  fastify.get('/profile', async (request, reply) => {
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
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) throw new NotFoundError('User');
    return successResponse(reply, user);
  });

  /**
   * PATCH /account/profile
   */
  fastify.patch('/profile', async (request, reply) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return errorResponse(
        reply,
        422,
        'VALIDATION_ERROR',
        'Invalid profile data',
        parsed.error.flatten().fieldErrors
      );
    }

    const updated = await fastify.prisma.user.update({
      where: { id: request.user.id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name.trim() }),
        ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        twoFactorEnabled: true,
        updatedAt: true,
      },
    });

    await auditService.log({
      userId: request.user.id,
      action: 'account.profile_updated',
      resource: 'user',
      resourceId: request.user.id,
    });

    return successResponse(reply, updated, 200, 'Profile updated successfully');
  });

  /**
   * POST /account/change-password
   */
  fastify.post('/change-password', async (request, reply) => {
    const parsed = changePasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return errorResponse(
        reply,
        422,
        'VALIDATION_ERROR',
        'Invalid password data',
        parsed.error.flatten().fieldErrors
      );
    }

    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
    });

    if (!user) throw new NotFoundError('User');

    const isValid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash
    );

    if (!isValid) {
      throw new AuthError('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);

    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Revoke all existing refresh tokens
    await tokenService.revokeAllUserTokens(user.id);
    reply.clearCookie('refreshToken', { path: '/' });

    await auditService.log({
      userId: user.id,
      action: 'account.password_changed',
      resource: 'user',
      resourceId: user.id,
    });

    return messageResponse(
      reply,
      'Password updated successfully. Please log in again.'
    );
  });

  /**
   * POST /account/enable-2fa
   */
  fastify.post('/enable-2fa', async (request, reply) => {
    const result = await authService.enable2FAPrepare(request.user.id);
    return successResponse(reply, result);
  });

  /**
   * POST /account/confirm-2fa
   */
  fastify.post('/confirm-2fa', async (request, reply) => {
    const parsed = confirm2FASchema.safeParse(request.body);
    if (!parsed.success) {
      return errorResponse(
        reply,
        422,
        'VALIDATION_ERROR',
        'Invalid verification code',
        parsed.error.flatten().fieldErrors
      );
    }

    await authService.confirm2FA(request.user.id, parsed.data.code);
    return messageResponse(reply, 'Two-factor authentication successfully enabled');
  });

  /**
   * DELETE /account/disable-2fa
   */
  fastify.delete('/disable-2fa', async (request, reply) => {
    const parsed = disable2FASchema.safeParse(request.body);
    if (!parsed.success) {
      return errorResponse(reply, 422, 'VALIDATION_ERROR', 'Password is required');
    }

    await authService.disable2FA(request.user.id, parsed.data.password);
    return messageResponse(reply, 'Two-factor authentication disabled');
  });

  /**
   * DELETE /account
   */
  fastify.delete('/', async (request, reply) => {
    const parsed = deleteAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return errorResponse(reply, 422, 'VALIDATION_ERROR', 'Password is required');
    }

    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
    });

    if (!user) throw new NotFoundError('User');

    const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!isValid) {
      throw new AuthError('Incorrect password');
    }

    // Soft delete user
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    // Revoke all refresh tokens
    await tokenService.revokeAllUserTokens(user.id);
    reply.clearCookie('refreshToken', { path: '/' });

    await auditService.log({
      userId: user.id,
      action: 'account.deleted',
      resource: 'user',
      resourceId: user.id,
    });

    return messageResponse(reply, 'Account deleted successfully');
  });
};
