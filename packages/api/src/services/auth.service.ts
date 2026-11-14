import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { PrismaClient, User } from '@postlane/db';
import { FastifyInstance } from 'fastify';
import { TokenService, TokenPair } from './token.service.js';
import { EmailService } from './email.service.js';
import { AuditService } from './audit.service.js';
import {
  AuthError,
  ConflictError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from '../utils/errors.js';
import { encrypt, decrypt } from '../utils/token-encryption.js';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60; // 15 minutes

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginResult {
  requires2FA: boolean;
  tempToken?: string;
  tokens?: TokenPair;
  user?: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
  };
}

export class AuthService {
  private tokenService: TokenService;
  private emailService: EmailService;
  private auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly fastify: FastifyInstance
  ) {
    this.tokenService = new TokenService(prisma, fastify);
    this.emailService = new EmailService();
    this.auditService = new AuditService(prisma);
  }

  /**
   * Register a new user account
   */
  async register(input: RegisterInput): Promise<{ message: string }> {
    const email = input.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        emailVerifyToken,
        emailVerifyExpiresAt,
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      emailVerifyToken
    );

    // Audit log
    await this.auditService.log({
      userId: user.id,
      action: 'user.registered',
      resource: 'user',
      resourceId: user.id,
      metadata: { email: user.email },
    });

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Verify email address with token
   */
  async verifyEmail(
    token: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<TokenPair> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new AuthError('Invalid or expired verification link');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: 'user.email_verified',
      resource: 'user',
      resourceId: user.id,
    });

    return this.tokenService.generateTokenPair(updatedUser, deviceInfo, ipAddress);
  }

  /**
   * User login with failed attempt rate-limiting in Redis
   */
  async login(
    emailRaw: string,
    passwordPlain: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    const email = emailRaw.toLowerCase().trim();
    const redisKey = `auth:fail:${email}`;

    // Check failed attempts lockout
    const failedAttemptsStr = await this.fastify.redis.get(redisKey);
    const failedAttempts = parseInt(failedAttemptsStr || '0', 10);

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const ttl = await this.fastify.redis.ttl(redisKey);
      throw new RateLimitError(
        `Too many failed attempts. Account temporarily locked. Please try again in ${Math.ceil(ttl / 60)} minutes.`
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      // Increment failed attempts even if user not found to prevent timing attacks
      await this.recordFailedAttempt(redisKey);
      throw new AuthError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);

    if (!isPasswordValid) {
      await this.recordFailedAttempt(redisKey);
      throw new AuthError('Invalid email or password');
    }

    // Login successful: reset failed attempts
    await this.fastify.redis.del(redisKey);

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Handle 2FA check
    if (user.twoFactorEnabled) {
      const tempToken = this.tokenService.generate2FATempToken(user.id);
      return {
        requires2FA: true,
        tempToken,
      };
    }

    // Issue tokens
    const tokens = await this.tokenService.generateTokenPair(
      user,
      userAgent,
      ipAddress
    );

    await this.auditService.log({
      userId: user.id,
      action: 'user.login',
      resource: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      requires2FA: false,
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  /**
   * Verify TOTP code during 2FA login
   */
  async login2FA(
    tempToken: string,
    code: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    const userId = this.tokenService.verify2FATempToken(tempToken);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AuthError('2FA is not configured for this account');
    }

    const secret = decrypt(user.twoFactorSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code.trim(),
      window: 1, // allow +/- 30s
    });

    if (!verified) {
      throw new AuthError('Invalid two-factor authentication code');
    }

    const tokens = await this.tokenService.generateTokenPair(
      user,
      userAgent,
      ipAddress
    );

    await this.auditService.log({
      userId: user.id,
      action: 'user.login_2fa',
      resource: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return tokens;
  }

  /**
   * Request password reset link (always returns generic success)
   */
  async forgotPassword(emailRaw: string): Promise<void> {
    const email = emailRaw.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordReset.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      await this.emailService.sendPasswordResetEmail(user.email, user.name, token);

      await this.auditService.log({
        userId: user.id,
        action: 'user.forgot_password_requested',
        resource: 'user',
        resourceId: user.id,
      });
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPasswordPlain: string): Promise<void> {
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.user.deletedAt) {
      throw new AuthError('Invalid or expired password reset link');
    }

    const passwordHash = await bcrypt.hash(newPasswordPlain, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditService.log({
      userId: resetRecord.userId,
      action: 'user.password_reset',
      resource: 'user',
      resourceId: resetRecord.userId,
    });
  }

  /**
   * Start 2FA setup: generate secret & QR code
   */
  async enable2FAPrepare(
    userId: string
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) throw new NotFoundError('User');

    const secretObj = speakeasy.generateSecret({
      name: `Postlane (${user.email})`,
      issuer: 'Postlane',
    });

    const qrCodeUrl = await QRCode.toDataURL(secretObj.otpauth_url ?? '');

    // Store encrypted temporary secret in Redis for 10 minutes
    const tempRedisKey = `2fa:setup:${userId}`;
    await this.fastify.redis.set(
      tempRedisKey,
      encrypt(secretObj.base32),
      'EX',
      10 * 60
    );

    return {
      secret: secretObj.base32,
      qrCodeUrl,
    };
  }

  /**
   * Confirm 2FA setup by verifying code
   */
  async confirm2FA(userId: string, code: string): Promise<void> {
    const tempRedisKey = `2fa:setup:${userId}`;
    const encryptedSecret = await this.fastify.redis.get(tempRedisKey);

    if (!encryptedSecret) {
      throw new ValidationError(
        '2FA setup session expired. Please start the setup process again.'
      );
    }

    const secret = decrypt(encryptedSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code.trim(),
      window: 1,
    });

    if (!verified) {
      throw new ValidationError('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encrypt(secret),
      },
    });

    await this.fastify.redis.del(tempRedisKey);

    await this.auditService.log({
      userId,
      action: 'user.2fa_enabled',
      resource: 'user',
      resourceId: userId,
    });
  }

  /**
   * Disable 2FA with password confirmation
   */
  async disable2FA(userId: string, passwordPlain: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) throw new NotFoundError('User');

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError('Incorrect password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    await this.auditService.log({
      userId,
      action: 'user.2fa_disabled',
      resource: 'user',
      resourceId: userId,
    });
  }

  /**
   * Helper to increment failed login attempts in Redis
   */
  private async recordFailedAttempt(redisKey: string): Promise<void> {
    const current = await this.fastify.redis.incr(redisKey);
    if (current === 1) {
      await this.fastify.redis.expire(redisKey, LOCKOUT_SECONDS);
    }
  }
}
