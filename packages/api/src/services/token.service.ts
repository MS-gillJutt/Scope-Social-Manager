import { PrismaClient, User } from '@postlane/db';
import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { AuthError } from '../utils/errors.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds (e.g. 900 for 15m)
}

export class TokenService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly fastify: FastifyInstance
  ) {}

  /**
   * Generates a 15-minute access token and a 7-day refresh token recorded in DB.
   */
  async generateTokenPair(
    user: Pick<User, 'id' | 'email' | 'name' | 'emailVerified' | 'twoFactorEnabled'>,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<TokenPair> {
    const accessToken = this.fastify.jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      { expiresIn: '15m' }
    );

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
        deviceInfo: deviceInfo ?? undefined,
        ipAddress: ipAddress ?? undefined,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: 15 * 60,
    };
  }

  /**
   * Rotates a refresh token: revokes the old one, creates a new one, generates a new access token.
   */
  async rotateRefreshToken(
    oldToken: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<TokenPair> {
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { token: oldToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            twoFactorEnabled: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!existingToken) {
      throw new AuthError('Invalid refresh token');
    }

    if (existingToken.revokedAt) {
      // Possible reuse attack! Revoke all refresh tokens for this user for safety
      await this.prisma.refreshToken.updateMany({
        where: { userId: existingToken.userId },
        data: { revokedAt: new Date() },
      });
      throw new AuthError('Refresh token has been revoked');
    }

    if (existingToken.expiresAt < new Date()) {
      throw new AuthError('Refresh token expired');
    }

    if (existingToken.user.deletedAt) {
      throw new AuthError('Account no longer exists');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });

    // Create new token pair
    return this.generateTokenPair(existingToken.user, deviceInfo, ipAddress);
  }

  /**
   * Revokes a specific refresh token (for logout)
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes all refresh tokens for a user (password change/reset, security events)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Generates a 5-minute temporary token for 2FA challenge completion
   */
  generate2FATempToken(userId: string): string {
    return this.fastify.jwt.sign(
      {
        userId,
        is2FATempToken: true,
      },
      { expiresIn: '5m' }
    );
  }

  /**
   * Validates a 2FA temporary token and extracts userId
   */
  verify2FATempToken(token: string): string {
    try {
      const decoded = this.fastify.jwt.verify<{
        userId: string;
        is2FATempToken?: boolean;
      }>(token);

      if (!decoded.is2FATempToken || !decoded.userId) {
        throw new AuthError('Invalid 2FA session token');
      }

      return decoded.userId;
    } catch {
      throw new AuthError('2FA session expired or invalid');
    }
  }
}
