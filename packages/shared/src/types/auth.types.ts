// =============================================================================
// Auth Types
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string; // user id
  tokenId: string; // unique refresh token id (for revocation)
  iat: number;
  exp: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  token: string;
}
