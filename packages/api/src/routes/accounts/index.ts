// =============================================================================
// Account routes — connect / list / disconnect platform accounts (OAuth)
// =============================================================================
//
// POST /workspaces/:workspaceId/accounts/:platform/connect
//   Returns the platform's OAuth authorization URL. The browser goes there,
//   MS approves, and the platform redirects back to the API callback below.
//   The redirect URI is computed server-side (API_PUBLIC_URL) — it must be
//   registered in each platform's developer app. The `state` param is an
//   HMAC-signed payload (workspace + user + platform + expiry) so the
//   callback can trust it without a login session.
// GET  /accounts/:platform/callback?code=...&state=...
//   Platform redirect target. Verifies state, exchanges the code for tokens,
//   fetches the account profile, encrypts the tokens (ENCRYPTION_KEY, same
//   scheme the workers decrypt with) and upserts the ConnectedAccount, then
//   redirects the browser back to the composer.
// GET  /workspaces/:workspaceId/accounts — list (tokens NEVER returned)
// DELETE /workspaces/:workspaceId/accounts/:accountId — disconnect. Note:
//   this removes the stored tokens here; the grant itself stays live in the
//   platform's settings until MS revokes it there.
// WhatsApp has no OAuth (manual Status flow) — connect returns 422.
// =============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { Platform, type Prisma } from '@scope/db';
import { encrypt } from '@scope/shared';
import {
  getIntegration,
  isPlatformSupported,
  type Platform as IntegrationPlatform,
} from '@scope/integrations';
import { authenticate } from '../../middleware/authenticate.js';
import { validateWorkspace } from '../../middleware/validate-workspace.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const STATE_TTL_MS = 10 * 60 * 1000;

interface ConnectState {
  workspaceId: string;
  userId: string;
  platform: string;
  nonce: string;
  exp: number;
}

function getStateSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error('COOKIE_SECRET environment variable is not set');
  return secret;
}

function signState(state: ConnectState): string {
  const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
  const sig = createHmac('sha256', getStateSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyState(raw: string): ConnectState | null {
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', getStateSecret()).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const state = parsed as ConnectState;
    if (typeof state.workspaceId !== 'string' || typeof state.userId !== 'string') return null;
    if (typeof state.platform !== 'string' || typeof state.exp !== 'number') return null;
    if (state.exp < Date.now()) return null;
    return state;
  } catch {
    return null;
  }
}

function getPublicApiUrl(): string {
  return (process.env.API_PUBLIC_URL ?? 'http://localhost:4000').replace(/\/$/, '');
}

function getComposerUrl(): string {
  return (process.env.COMPOSER_URL ?? 'http://localhost:5173').replace(/\/$/, '');
}

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set');
  return key;
}

const platformParamSchema = z.object({
  platform: z.nativeEnum(Platform),
});

export const accountConnectionRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /workspaces/:workspaceId/accounts/:platform/connect
   */
  fastify.post(
    '/workspaces/:workspaceId/accounts/:platform/connect',
    { preHandler: [authenticate, validateWorkspace] },
    async (request, reply) => {
      const { workspaceId, platform } = request.params as { workspaceId: string; platform: Platform };
      const parsed = platformParamSchema.safeParse({ platform });
      if (!parsed.success) {
        return errorResponse(reply, 422, 'VALIDATION_ERROR', 'Unknown platform.');
      }
      if (platform === Platform.WHATSAPP) {
        return errorResponse(
          reply,
          422,
          'NOT_SUPPORTED',
          'WhatsApp Status has no login — it is posted by hand from the WhatsApp app. Nothing to connect.'
        );
      }
      // Prisma's Platform enum also has PINTEREST/X, which the integrations
      // registry does not implement — guard at runtime, then narrow the type.
      const integrationPlatform = platform as unknown as IntegrationPlatform;
      if (!isPlatformSupported(integrationPlatform)) {
        return errorResponse(reply, 422, 'NOT_SUPPORTED', `No integration for platform "${platform}".`);
      }
      const integration = getIntegration(integrationPlatform);
      const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const state = signState({
        workspaceId,
        userId: request.user.id,
        platform,
        nonce,
        exp: Date.now() + STATE_TTL_MS,
      });
      const redirectUri = `${getPublicApiUrl()}/accounts/${platform.toLowerCase()}/callback`;
      const authUrl = integration.getAuthorizationUrl(state, redirectUri);
      return successResponse(reply, { authUrl, platform });
    }
  );

  /**
   * GET /accounts/:platform/callback — platform redirect target (no JWT here;
   * the signed `state` is the trust).
   */
  fastify.get('/accounts/:platform/callback', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const query = request.query as { code?: string; state?: string; error?: string };
    const composer = getComposerUrl();
    const fail = (reason: string) =>
      reply.redirect(`${composer}/?connect_error=${encodeURIComponent(reason)}`);

    if (query.error) return fail(`Platform refused: ${query.error}`);
    if (!query.code || !query.state) return fail('Missing code or state from platform.');
    const state = verifyState(query.state);
    if (!state) return fail('Invalid or expired connect session. Try connecting again.');
    if (state.platform.toLowerCase() !== platform.toLowerCase()) {
      return fail('Platform mismatch in connect session.');
    }

    let integration;
    const integrationPlatform = state.platform as unknown as IntegrationPlatform;
    if (!isPlatformSupported(integrationPlatform)) {
      return fail(`No integration for platform "${state.platform}".`);
    }
    integration = getIntegration(integrationPlatform);
    const redirectUri = `${getPublicApiUrl()}/accounts/${platform.toLowerCase()}/callback`;
    try {
      const tokens = await integration.exchangeCodeForTokens(query.code, redirectUri);
      const info = await integration.getAccountInfo(tokens);
      const key = getEncryptionKey();
      const account = await fastify.prisma.connectedAccount.upsert({
        where: {
          workspaceId_platform_platformAccountId: {
            workspaceId: state.workspaceId,
            platform: state.platform as Platform,
            platformAccountId: info.platformAccountId,
          },
        },
        update: {
          accessToken: encrypt(tokens.accessToken, key),
          refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken, key) : undefined,
          tokenExpiresAt: tokens.expiresAt ? new Date(tokens.expiresAt * 1000) : null,
          tokenScopes: tokens.scope ? tokens.scope.split(' ') : [],
          accountName: info.accountName,
          accountUsername: info.accountUsername ?? null,
          accountImageUrl: info.accountImageUrl ?? null,
          accountType: info.accountType ?? null,
          metadata: (tokens.extra ?? {}) as Prisma.InputJsonValue,
          status: 'ACTIVE',
          lastSyncedAt: new Date(),
        },
        create: {
          workspaceId: state.workspaceId,
          platform: state.platform as Platform,
          platformAccountId: info.platformAccountId,
          accountName: info.accountName,
          accountUsername: info.accountUsername ?? null,
          accountImageUrl: info.accountImageUrl ?? null,
          accountType: info.accountType ?? null,
          accessToken: encrypt(tokens.accessToken, key),
          refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken, key) : null,
          tokenExpiresAt: tokens.expiresAt ? new Date(tokens.expiresAt * 1000) : null,
          tokenScopes: tokens.scope ? tokens.scope.split(' ') : [],
          metadata: (tokens.extra ?? {}) as Prisma.InputJsonValue,
          status: 'ACTIVE',
          lastSyncedAt: new Date(),
        },
      });
      return reply.redirect(
        `${composer}/?connected=${encodeURIComponent(account.platform)}&account=${encodeURIComponent(account.accountName)}`
      );
    } catch (error) {
      fastify.log.error({ err: error, platform }, 'OAuth callback failed');
      return fail('Could not finish connecting. The platform refused the login — try again.');
    }
  });

  /**
   * GET /workspaces/:workspaceId/accounts — list (tokens never returned)
   */
  fastify.get(
    '/workspaces/:workspaceId/accounts',
    { preHandler: [authenticate, validateWorkspace] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const accounts = await fastify.prisma.connectedAccount.findMany({
        where: { workspaceId },
        orderBy: { platform: 'asc' },
        select: {
          id: true,
          platform: true,
          platformAccountId: true,
          accountName: true,
          accountUsername: true,
          accountImageUrl: true,
          accountType: true,
          status: true,
          lastSyncedAt: true,
          createdAt: true,
        },
      });
      return successResponse(reply, accounts);
    }
  );

  /**
   * DELETE /workspaces/:workspaceId/accounts/:accountId — disconnect
   */
  fastify.delete(
    '/workspaces/:workspaceId/accounts/:accountId',
    { preHandler: [authenticate, validateWorkspace] },
    async (request, reply) => {
      const { workspaceId, accountId } = request.params as { workspaceId: string; accountId: string };
      const account = await fastify.prisma.connectedAccount.findFirst({
        where: { id: accountId, workspaceId },
      });
      if (!account) return errorResponse(reply, 404, 'NOT_FOUND', 'Account not found.');
      await fastify.prisma.connectedAccount.delete({ where: { id: account.id } });
      return successResponse(reply, { id: account.id, platform: account.platform, disconnected: true });
    }
  );
};
