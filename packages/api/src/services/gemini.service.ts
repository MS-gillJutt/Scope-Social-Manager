// =============================================================================
// Gemini AI service — hashtag generation + caption optimization
// =============================================================================
//
// Model: gemini-3.5-flash-lite (verified working Nov 17, 2026 — the free key
// answers it). gemini-3.8-flash is quota-limited on the free key (20 free
// requests, then 429 for ~12h) and gemini-2.5-flash is dead for this key
// (404, removed for new users). Do NOT switch models without re-testing.
//
// Key resolution (in order):
// 1. GEMINI_API_KEY env var — the normal route on any real machine.
// 2. The Google AI Studio connector surrogate (this sandbox only): a short
//    python3 call to the dynamic_credentials helper returns an `hsurr:`
//    surrogate, which the egress swaps for the real key on requests to
//    generativelanguage.googleapis.com. The surrogate is cached in memory.
//    The key/surrogate is NEVER logged, never put in a response, never
//    written to a file.
// 3. No key at all → every call throws GeminiUnavailableError and the AI
//    routes answer with the local fallbacks (same behaviour as the
//    MultiPost Hub server.ts fallbacks), so a failed AI call NEVER blocks
//    posting.
// =============================================================================

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const GEMINI_HOST = 'generativelanguage.googleapis.com';
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const CONNECTOR_NAME = 'custom.google-ai-studio';

export class GeminiUnavailableError extends Error {
  constructor(message = 'Gemini is not configured') {
    super(message);
    this.name = 'GeminiUnavailableError';
  }
}

let cachedSurrogate: string | null = null;
let surrogateAttempted = false;

async function fetchSurrogateFromConnector(): Promise<string | null> {
  if (surrogateAttempted) return cachedSurrogate;
  surrogateAttempted = true;
  const oneLiner = [
    'import sys',
    `sys.path.insert(0, '/opt/muse/skills/custom-connector-setup/bin')`,
    'from dynamic_credentials import dynamic_credential_entry',
    `print(dynamic_credential_entry('${CONNECTOR_NAME}')['surrogate'])`,
  ].join('; ');
  try {
    const { stdout } = await execFileAsync('python3', ['-c', oneLiner], { timeout: 15000 });
    const surrogate = stdout.trim();
    if (surrogate.startsWith('hsurr:')) {
      cachedSurrogate = surrogate;
      return surrogate;
    }
    return null;
  } catch {
    return null;
  }
}

/** Resolve the Gemini API key (env first, connector surrogate second). */
export async function getGeminiKey(): Promise<string | null> {
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey) return envKey;
  return fetchSurrogateFromConnector();
}

interface GeminiGenerateOptions {
  jsonMode?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * One generateContent call. Returns the model's text. Throws
 * GeminiUnavailableError when no key exists, and Error with the provider's
 * status on any non-OK response (callers decide fallback vs failure).
 */
export async function generateGeminiText(
  prompt: string,
  options: GeminiGenerateOptions = {}
): Promise<string> {
  const key = await getGeminiKey();
  if (!key) throw new GeminiUnavailableError();

  const url = `https://${GEMINI_HOST}/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? '').join('');
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}

// ---------------------------------------------------------------------------
// Local fallbacks (ported from the MultiPost Hub server.ts — same behaviour)
// ---------------------------------------------------------------------------

export function fallbackHashtags(content: string, topic: string, count: number): string[] {
  const words = (content || topic || 'social media content creation')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const defaultTags = [
    'viral',
    'trending',
    'socialmedia',
    'contentcreator',
    'growth',
    'marketing',
    'explorepage',
    'fyp',
    'community',
    'business',
  ];
  return Array.from(new Set([...words, ...defaultTags]))
    .slice(0, count)
    .map((t) => `#${t}`);
}

export function fallbackCaptions(content: string): Record<string, string> {
  const base = content || 'Excited to share our latest update!';
  return {
    linkedin: `🚀 ${base}\n\nWhat are your thoughts on this? Connect with us in the comments! #leadership #growth #innovation`,
    twitter: `${base.slice(0, 240)} #TrendingNow`,
    instagram: `✨ ${base}\n.\n.\n#content #viral #explore #instadaily`,
    tiktok: `Check this out! 👀 ${base.slice(0, 150)} #fyp #viral #trending`,
    facebook: `${base}\n\nLike and share if you agree!`,
    whatsapp: `${base}`,
  };
}
