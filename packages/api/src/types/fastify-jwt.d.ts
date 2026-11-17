import '@fastify/jwt';

/**
 * Types for the JWT payloads this API issues and verifies.
 *
 * - Access token (the payload `request.user` carries after `jwtVerify()`):
 *   signed by TokenService.generateTokenPair().
 * - 2FA temp token: signed by TokenService.generate2FATempToken() and verified
 *   explicitly via `jwt.verify<TwoFactorTempPayload>()`, never via middleware.
 */
export interface AccessTokenPayload {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface TwoFactorTempPayload {
  userId: string;
  is2FATempToken: true;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload | TwoFactorTempPayload;
    user: AccessTokenPayload;
  }
}
