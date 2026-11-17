// =============================================================================
// AI routes — hashtag generation + caption optimization (Gemini)
// =============================================================================
//
// Same request/response shapes as the MultiPost Hub server.ts endpoints, so
// the composer UI calls them unchanged. A failed AI call NEVER fails the
// request: the route answers with the local fallback and source "fallback".
// Auth required (JWT). Rate-limited (moderate) — AI calls are the expensive
// ones.
// =============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { moderateRateLimit } from '../../plugins/rate-limit.plugin.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import {
  generateGeminiText,
  fallbackHashtags,
  fallbackCaptions,
} from '../../services/gemini.service.js';

const hashtagsSchema = z.object({
  content: z.string().max(5000).optional().default(''),
  topic: z.string().max(200).optional().default(''),
  platforms: z.array(z.string()).optional().default([]),
  count: z.number().int().min(1).max(30).optional().default(10),
  language: z.enum(['en', 'ur']).optional().default('en'),
});

const optimizeSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaType: z.string().max(50).optional().default('none'),
  tone: z.string().max(50).optional().default('engaging'),
  language: z.enum(['en', 'ur']).optional().default('en'),
});

function parseJsonArray(text: string): string[] {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  /**
   * POST /ai/generate-hashtags
   * Body: { content?, topic?, platforms?, count?, language? }
   * Returns: { hashtags: string[], source: 'gemini' | 'fallback' }
   */
  fastify.post(
    '/generate-hashtags',
    { config: { rateLimit: moderateRateLimit } },
    async (request, reply) => {
      const parsed = hashtagsSchema.safeParse(request.body);
      if (!parsed.success) {
        return errorResponse(reply, 422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten().fieldErrors);
      }
      const { content, topic, platforms, count, language } = parsed.data;

      try {
        const targetPlatforms =
          platforms.length > 0 ? platforms.join(', ') : 'LinkedIn, TikTok, Instagram, Twitter/X, Facebook, WhatsApp';
        const prompt =
          `You are a viral social media strategist. Analyze this post content and generate ${count} high-performing, high-engagement hashtags tailored for these platforms: ${targetPlatforms}.\n` +
          `Post Content: "${content || topic || 'Social media announcement'}"\n` +
          `Target Language: ${language === 'ur' ? 'Urdu and English mix (suitable for Pakistani/Urdu audience)' : 'English'}\n\n` +
          'Return a clean JSON array of strings, where each item starts with "#". Only return the JSON array.';
        const text = await generateGeminiText(prompt, { jsonMode: true });
        const hashtags = parseJsonArray(text);
        if (hashtags.length === 0) throw new Error('Gemini returned no hashtags');
        return successResponse(reply, { hashtags, source: 'gemini' });
      } catch (error) {
        // Never block the composer on AI: fall back to smart local tags.
        fastify.log.warn({ err: error }, 'Hashtag generation fell back to local tags');
        return successResponse(reply, {
          hashtags: fallbackHashtags(content, topic, count),
          source: 'fallback',
        });
      }
    }
  );

  /**
   * POST /ai/optimize-caption
   * Body: { content, mediaType?, tone?, language? }
   * Returns: { linkedin, twitter, instagram, tiktok, facebook, whatsapp, source }
   */
  fastify.post(
    '/optimize-caption',
    { config: { rateLimit: moderateRateLimit } },
    async (request, reply) => {
      const parsed = optimizeSchema.safeParse(request.body);
      if (!parsed.success) {
        return errorResponse(reply, 422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten().fieldErrors);
      }
      const { content, mediaType, tone, language } = parsed.data;

      try {
        const prompt =
          'You are an expert social media manager. Adapt the following original post draft into platform-optimized versions:\n' +
          `Original Content: "${content}"\n` +
          `Media Attached: ${mediaType || 'none'}\n` +
          `Tone: ${tone}\n` +
          `Preferred Language: ${language === 'ur' ? 'Urdu with relevant English terms where natural' : 'English'}\n\n` +
          'Guidelines:\n' +
          '1. LinkedIn: Professional thought-leadership, strong hook, paragraph line breaks, professional call-to-action, 3-5 industry hashtags.\n' +
          '2. Twitter/X: Punchy, maximum 260 characters, high-curiosity hook, 2 hashtags.\n' +
          '3. Instagram: Engaging visual storytelling, aesthetic formatting, call-to-action to save/comment, and hashtag block.\n' +
          '4. TikTok: Catchy hook in first sentence, trendy short wording, asks a question, viral tags like #fyp.\n' +
          '5. Facebook: Friendly community tone, conversational, encourages shares and comments.\n' +
          '6. WhatsApp: Short and warm, one line, no hashtags — it is a Status caption for friends and contacts.\n\n' +
          'Return ONLY a JSON object with keys: linkedin, twitter, instagram, tiktok, facebook, whatsapp.';
        const text = await generateGeminiText(prompt, { jsonMode: true });
        const parsedJson: unknown = JSON.parse(text);
        if (typeof parsedJson !== 'object' || parsedJson === null) {
          throw new Error('Gemini returned non-object JSON');
        }
        const record = parsedJson as Record<string, unknown>;
        const pick = (key: string): string => {
          const v = record[key];
          return typeof v === 'string' ? v : '';
        };
        const captions = {
          linkedin: pick('linkedin'),
          twitter: pick('twitter'),
          instagram: pick('instagram'),
          tiktok: pick('tiktok'),
          facebook: pick('facebook'),
          whatsapp: pick('whatsapp'),
        };
        if (!captions.linkedin && !captions.instagram && !captions.tiktok) {
          throw new Error('Gemini returned empty captions');
        }
        return successResponse(reply, { ...captions, source: 'gemini' });
      } catch (error) {
        fastify.log.warn({ err: error }, 'Caption optimization fell back to local captions');
        return successResponse(reply, { ...fallbackCaptions(content), source: 'fallback' });
      }
    }
  );
};
