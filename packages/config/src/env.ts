import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse and validate the process environment. Throws a descriptive error
 * when any required variable is missing or malformed.
 */
function createEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `\n❌ Invalid environment variables:\n${formatted}\n\nSee .env.example for documentation.`,
    );
  }
  return result.data as z.infer<T>;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // ── Core ────────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),

  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // ── Redis ────────────────────────────────────────────────────────────────
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL"),

  // ── Auth ─────────────────────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  /** 32-byte hex string (64 hex chars) for AES-256-GCM token encryption */
  ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)",
    ),

  // ── Cloudflare R2 ────────────────────────────────────────────────────────
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url("R2_PUBLIC_URL must be a valid URL"),

  // ── Stripe ───────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),
  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_", "STRIPE_PUBLISHABLE_KEY must start with pk_"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),

  // ── Email / SMTP ─────────────────────────────────────────────────────────
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM: z.string().min(1),

  // ── App URLs ──────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NEXT_PUBLIC_API_URL: z
    .string()
    .url("NEXT_PUBLIC_API_URL must be a valid URL"),

  // ── Platform OAuth — Facebook & Instagram ────────────────────────────────
  FACEBOOK_APP_ID: z.string().min(1),
  FACEBOOK_APP_SECRET: z.string().min(1),
  INSTAGRAM_APP_ID: z.string().min(1),
  INSTAGRAM_APP_SECRET: z.string().min(1),

  // ── Platform OAuth — TikTok ──────────────────────────────────────────────
  TIKTOK_CLIENT_KEY: z.string().min(1),
  TIKTOK_CLIENT_SECRET: z.string().min(1),

  // ── Platform OAuth — LinkedIn ────────────────────────────────────────────
  LINKEDIN_CLIENT_ID: z.string().min(1),
  LINKEDIN_CLIENT_SECRET: z.string().min(1),

  // ── Platform OAuth — Google / YouTube ───────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // ── Platform OAuth — Reddit ──────────────────────────────────────────────
  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),

  // ── Platform OAuth — Threads ─────────────────────────────────────────────
  THREADS_APP_ID: z.string().min(1),
  THREADS_APP_SECRET: z.string().min(1),

  // ── AI (optional) ────────────────────────────────────────────────────────
  OPENAI_API_KEY: z.string().startsWith("sk-").optional(),
});

export type Env = z.infer<typeof envSchema>;

// ---------------------------------------------------------------------------
// Export validated env — import this instead of process.env directly
// ---------------------------------------------------------------------------
export const env = createEnv(envSchema);
