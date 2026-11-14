// =============================================================================
// Token handling for connected accounts (decrypt, auto-refresh, re-encrypt)
// =============================================================================

import { prisma, AccountStatus, type ConnectedAccount } from '@scope/db';
import { decrypt, encrypt } from '@scope/shared';
import {
  getIntegration,
  type OAuthTokens,
  type Platform as IntegrationPlatform,
} from '@scope/integrations';
import { logger } from '../utils/logger.js';

/** Refresh when the access token expires within this many seconds */
const REFRESH_WINDOW_SECONDS = 300;

function getKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set');
  return key;
}

/**
 * Returns usable (decrypted) tokens for a connected account.
 * If the token is about to expire and a refresh token exists, refreshes it
 * and persists the new encrypted tokens.
 */
export async function getValidTokens(account: ConnectedAccount): Promise<OAuthTokens> {
  const key = getKey();

  const tokens: OAuthTokens = {
    accessToken: decrypt(account.accessToken, key),
    refreshToken: account.refreshToken ? decrypt(account.refreshToken, key) : undefined,
    expiresAt: account.tokenExpiresAt
      ? Math.floor(account.tokenExpiresAt.getTime() / 1000)
      : undefined,
    scope: account.tokenScopes.join(' ') || undefined,
    extra: {
      platformAccountId: account.platformAccountId,
      ...((account.metadata as Record<string, unknown> | null) ?? {}),
    },
  };

  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = tokens.expiresAt !== undefined && tokens.expiresAt - now < REFRESH_WINDOW_SECONDS;

  if (!needsRefresh) return tokens;
  if (!tokens.refreshToken) {
    // Nothing to refresh with — let the publish attempt fail with TOKEN_EXPIRED
    return tokens;
  }

  logger.info({ accountId: account.id, platform: account.platform }, 'Refreshing access token');
  const integration = getIntegration(account.platform as IntegrationPlatform);
  const fresh = await integration.refreshTokens(tokens.refreshToken);

  await prisma.connectedAccount.update({
    where: { id: account.id },
    data: {
      accessToken: encrypt(fresh.accessToken, key),
      refreshToken: fresh.refreshToken ? encrypt(fresh.refreshToken, key) : account.refreshToken,
      tokenExpiresAt: fresh.expiresAt ? new Date(fresh.expiresAt * 1000) : null,
      status: AccountStatus.ACTIVE,
    },
  });

  return { ...tokens, ...fresh, extra: tokens.extra };
}

/** Mark an account as needing re-authorization */
export async function markAccountExpired(accountId: string): Promise<void> {
  await prisma.connectedAccount.update({
    where: { id: accountId },
    data: { status: AccountStatus.EXPIRED },
  });
}
