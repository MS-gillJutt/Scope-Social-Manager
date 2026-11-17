// =============================================================================
// API client — talks to the Scope Social Manager Fastify API
// =============================================================================
//
// In dev the Vite proxy maps /api/* to http://localhost:4000/* (see
// vite.config.ts). VITE_API_URL, when set, is used as a prefix instead —
// point it at an origin that serves the API under /api/* (e.g. a reverse
// proxy), or leave it empty for the dev proxy.
//
// The API wraps every response in { success: true, data } — this client
// unwraps it and throws ApiError with the server's message on failure.
// Auth: JWT access token in localStorage (same key as apps/app:
// "scope_access_token"). Login is email + password against /auth/login.
// =============================================================================

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const TOKEN_KEY = 'scope_access_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore (private mode etc.)
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...((init.headers as Record<string, string> | undefined) ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(apiUrl(path), { ...init, headers });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!res.ok) {
    const message =
      (parsed as { message?: string } | null)?.message ??
      (parsed as { error?: string } | null)?.error ??
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  const envelope = parsed as ApiEnvelope<T> | null;
  if (envelope && typeof envelope === 'object' && 'data' in envelope) return envelope.data as T;
  return parsed as T;
}

// ---------------------------------------------------------------------------
// Auth + workspaces
// ---------------------------------------------------------------------------

export interface LoginResult {
  requires2FA: boolean;
  accessToken?: string;
  expiresIn?: number;
  tempToken?: string;
  user?: { id: string; email: string; name: string };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const result = await apiFetch<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (result.accessToken) setToken(result.accessToken);
  return result;
}

export async function login2FA(tempToken: string, code: string): Promise<LoginResult> {
  const result = await apiFetch<LoginResult>('/api/auth/login/2fa', {
    method: 'POST',
    body: JSON.stringify({ tempToken, code }),
  });
  if (result.accessToken) setToken(result.accessToken);
  return result;
}

export async function createWorkspace(name: string): Promise<Workspace> {
  return apiFetch<Workspace>('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export interface Workspace {
  id: string;
  name: string;
  plan?: string;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  return apiFetch<Workspace[]>('/api/workspaces');
}

// ---------------------------------------------------------------------------
// Connected accounts
// ---------------------------------------------------------------------------

export interface ConnectedAccount {
  id: string;
  platform: string;
  platformAccountId: string;
  accountName: string;
  accountUsername: string | null;
  accountImageUrl: string | null;
  accountType: string | null;
  status: string;
}

export async function listAccounts(workspaceId: string): Promise<ConnectedAccount[]> {
  return apiFetch<ConnectedAccount[]>(`/api/workspaces/${workspaceId}/accounts`);
}

export async function connectAccount(
  workspaceId: string,
  platform: string
): Promise<{ authUrl: string; platform: string }> {
  return apiFetch<{ authUrl: string; platform: string }>(
    `/api/workspaces/${workspaceId}/accounts/${platform}/connect`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}

export async function disconnectAccount(workspaceId: string, accountId: string): Promise<void> {
  await apiFetch(`/api/workspaces/${workspaceId}/accounts/${accountId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Content (posts) + media
// ---------------------------------------------------------------------------

export type ApiPlatformPostStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'NEEDS_MANUAL_ACTION'
  | 'CANCELLED';

export interface ApiPlatformPost {
  id: string;
  platform: string;
  status: ApiPlatformPostStatus;
  caption: string | null;
  hashtags: string[];
  title: string | null;
  linkUrl: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  platformPostUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  /** Latest publish job's apiResponse — carries the manual-action note + media URLs. */
  manualAction: unknown;
}

export interface ApiContentMedia {
  id: string;
  storageKey: string;
  url: string;
  mimeType: string;
  mediaType: string;
}

export interface ApiContentItem {
  id: string;
  title: string | null;
  caption: string | null;
  tags: string[];
  contentType: string;
  status: string;
  publishAt: string | null;
  createdAt: string;
  media: ApiContentMedia[];
  platformPosts: ApiPlatformPost[];
}

export interface CreateContentResult {
  contentItemId: string;
  status: string;
  posts: Array<{ id: string; platform: string; status: string }>;
  skipped: Array<{ platform: string; reason: string }>;
}

export interface CreateContentInput {
  title?: string;
  caption: string;
  hashtags: string[];
  contentType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REEL' | 'STORY';
  mediaAssetIds: string[];
  platforms: string[];
  platformOptions?: Record<string, unknown>;
  publishAt?: string;
  publishNow?: boolean;
}

export async function createContent(
  workspaceId: string,
  input: CreateContentInput
): Promise<CreateContentResult> {
  return apiFetch<CreateContentResult>(`/api/workspaces/${workspaceId}/content`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listContent(workspaceId: string): Promise<ApiContentItem[]> {
  return apiFetch<ApiContentItem[]>(`/api/workspaces/${workspaceId}/content?limit=50`);
}

export async function getContent(workspaceId: string, contentId: string): Promise<ApiContentItem> {
  return apiFetch<ApiContentItem>(`/api/workspaces/${workspaceId}/content/${contentId}`);
}

export async function deleteContent(workspaceId: string, contentId: string): Promise<void> {
  await apiFetch(`/api/workspaces/${workspaceId}/content/${contentId}`, { method: 'DELETE' });
}

export async function completeManualPost(
  workspaceId: string,
  contentId: string,
  platformPostId: string,
  platformPostUrl?: string
): Promise<void> {
  await apiFetch(
    `/api/workspaces/${workspaceId}/content/${contentId}/platforms/${platformPostId}/complete`,
    { method: 'PATCH', body: JSON.stringify({ platformPostUrl }) }
  );
}

export interface UploadMediaResult {
  mediaAssetId: string;
  storageKey: string;
  url: string;
  mimeType: string;
  mediaType: string;
  size: number;
}

export async function uploadMedia(workspaceId: string, file: File): Promise<UploadMediaResult> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<UploadMediaResult>(`/api/workspaces/${workspaceId}/content/media`, {
    method: 'POST',
    body: form,
  });
}

// ---------------------------------------------------------------------------
// AI (Gemini, with server-side fallbacks)
// ---------------------------------------------------------------------------

export async function generateHashtags(input: {
  content: string;
  platforms: string[];
  count?: number;
  language?: string;
}): Promise<{ hashtags: string[]; source: 'gemini' | 'fallback' }> {
  return apiFetch<{ hashtags: string[]; source: 'gemini' | 'fallback' }>('/api/ai/generate-hashtags', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function optimizeCaption(input: {
  content: string;
  mediaType?: string;
  tone?: string;
  language?: string;
}): Promise<Record<string, string> & { source: 'gemini' | 'fallback' }> {
  return apiFetch<Record<string, string> & { source: 'gemini' | 'fallback' }>(
    '/api/ai/optimize-caption',
    { method: 'POST', body: JSON.stringify(input) }
  );
}
