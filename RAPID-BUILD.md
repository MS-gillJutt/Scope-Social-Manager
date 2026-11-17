# Scope Social Manager — RAPID PERSONAL BUILD

**Date:** Nov 17, 2026. **Status:** built and green, local-only. **NOT pushed, committed, or deployed** — repo HEAD is still `a80a2a0`; all work is in `~/workspace/scope-social-manager/` only. Site trees untouched.

**The job:** MS posts the SAME promo video/post to TikTok, Instagram, Facebook + WhatsApp Status, one by one. This version: **post ONCE from one place → all four.**

## Where the composer lives and why

**`apps/composer/`** — the MultiPost Hub UI (React 19 + Vite 6 + Tailwind 4), moved in as a standalone Vite app and rewired to the real backend. Its UI is kept as-is (MS approved it for the personal version).

Why a standalone Vite app instead of a Next.js app in the monorepo:

- The monorepo apps use **React 18 + Tailwind 3**; the MultiPost Hub UI needs **React 19 + Tailwind 4**. Forcing it into the workspace would break the UI MS approved.
- It shares **no code** with the monorepo packages — all it needs is the API (HTTP + JSON). Its own npm-installed `node_modules` (212 MB) and its own `package-lock.json` live in `apps/composer/`.
- It IS picked up by the `apps/*` workspace glob, so turbo runs its `typecheck` (`tsc --noEmit`) and `build` (`vite build`) — counts below include it.
- `server.ts` was NOT copied: its endpoints moved into the API. The Express server is gone.

## What posts for real vs what needs MS

| Destination | Posts for real? | How |
| --- | --- | --- |
| **Facebook** | YES (once connected) | Graph API: `/{pageId}/videos` (file_url), `/{pageId}/photos`, `/{pageId}/feed` |
| **Instagram** | YES (once connected) | Graph container flow: `/{igUserId}/media` → `/media_publish` |
| **TikTok** | YES (once connected) | Content Posting API: `/v2/post/publish/video/init/` (PULL_FROM_URL) + status polling, video-only |
| **WhatsApp Status** | MANUAL (by design — no API exists) | See below |
| LinkedIn | Backend integration exists; NOT in the composer UI yet (SaaS version) | — |
| Reddit | Text posts only; media upload NOT implemented in the backend | — |
| Twitter/X, Threads, SnackVideo | NOT implemented | — |

**The publish path (real, no pretending):** composer → `POST /workspaces/:workspaceId/content` → ContentItem + ContentMedia + one PlatformPost per platform + PublishJob (BullMQ, idempotency key `${contentItemId}:${platform}`) → publish worker → `integration.publishPost` → platform API. The worker records the platform post ID/URL, is idempotent (skips already-PUBLISHED), and BullMQ retries 3× with exponential backoff. Scheduling = the same endpoint with `publishAt` (delayed job). Deleting a post cancels its queued jobs and archives the item.

**What the old UI did that is now GONE:** clipboard auto-copy on "Publish", the webhook fetch to Make/n8n/Zapier, opening each platform's composer in a new tab, the fake 500 ms stepping. The publish window now polls the real job status every 2.5 s (up to ~30 s) and shows per-platform results: PUBLISHED with a link, NEEDS_MANUAL_ACTION with the WhatsApp card, FAILED with the error.

**Platforms with no connected account are SKIPPED and reported** (reason `not-connected`). PINTEREST/X are skipped (`not-supported` — no integration implements them). TikTok + Instagram need a video or image — text-only posts are skipped for them; Facebook takes text-only.

## The WhatsApp Status answer (researched, honest)

**There is no Status-posting API.** Meta's official WhatsApp Business API (Cloud API) has no Status endpoint — multiple sources confirm posting stays manual. Unofficial services (Wawp, Pilot Status) drive a WhatsApp Web session: paid, against WhatsApp's terms, ban risk for MS's number. This build deliberately does NOT use them.

**The real flow:**

1. Composer prepares the media + caption and enqueues the post like any platform.
2. The worker's `WhatsappStatusIntegration.publishPost` **never calls an API** — it validates (caption ≤ 700, one media item, video needs a file) and returns `{ platformPostId: 'manual-action', requiresManualAction: true, manualActionNote }`. The job completes successfully (no BullMQ retry) and the post is marked `NEEDS_MANUAL_ACTION` — the status the schema already provides for exactly this.
3. The composer shows a WhatsApp card: media download links, copy-caption button, and the exact steps — **open WhatsApp on his phone → Status → My Status → pick the media → Post**. Text-only statuses work too (typed in the app, not picked).
4. MS taps **"I posted the Status"** here (`PATCH /content/:id/platforms/:platformPostId/complete`) to close the loop. A banner at the top of the composer also lists any pending Statuses.

**Limits the app itself enforces:** video clips max 60 s (longer videos are split by the app), Status disappears after 24 h, only contacts who saved his number (and whom he saved) reliably see it. There is no OAuth for WhatsApp — `connect` returns 422 NOT_SUPPORTED, and `PlatformPost.connectedAccountId` is nullable for this reason.

## Gemini fix

- **Model:** `gemini-3.5-flash-lite` (verified working). The MultiPost Hub's `gemini-3.8-flash` was wrong — quota-limited on the free key (429, limit 20, resets ~13:00 PKT Nov 17) — and `gemini-2.5-flash` is dead for this key (404). The service is in `packages/api/src/services/gemini.service.ts`.
- **Key:** never in a file, argument, env var, or log. Resolution = `GEMINI_API_KEY` env first, else the Google AI Studio connector surrogate via the same `dynamic_credentials` helper the studio's `run-agent.py` uses (cached in memory). **Proven live:** the service returned real hashtags (`#JavaScript, #Coding, #LearnToCode`) in the runtime test.
- **Fallback:** on ANY Gemini failure the AI routes answer with the local fallback (hashtags + captions, incl. a WhatsApp variant) and `source: 'fallback'` — AI never blocks posting.
- Routes: `POST /ai/generate-hashtags`, `POST /ai/optimize-caption` (same request/response shapes as the old `server.ts`, plus a WhatsApp caption key in optimize), auth required, moderate rate limit.

## Backend changes (all local only)

- **Schema** (`packages/db/prisma/schema.prisma`): `WHATSAPP` added to the Platform enum; `PlatformPost.connectedAccountId` made nullable. Prisma Client regenerated (v5.22.0).
- **Integrations:** `integration.types.ts` — Platform += `WHATSAPP`; PublishResult += `requiresManualAction?` + `manualActionNote?`; IntegrationErrorCode += `NOT_SUPPORTED`. New `packages/integrations/src/whatsapp/whatsapp.integration.ts` (see above). Registered in `registry.ts`.
- **Workers** (`publish.processor.ts`): token-fetch guard (WHATSAPP / null account → empty tokens, no `getValidTokens` call); `requiresManualAction` → post + job marked `NEEDS_MANUAL_ACTION`, note + media URLs stored in the job's `apiResponse`; catch block guards `markAccountExpired` with a null check on `connectedAccountId`.
- **API — new `packages/api/src/services/publish-queue.ts`:** memoized BullMQ queue (`publish-queue`, attempts 3, exponential backoff 60 s) against `fastify.redis`, so the API can enqueue without depending on `@scope/workers`.
- **API — new `packages/api/src/routes/content/index.ts`:** all under `/workspaces/:workspaceId/content`, preHandler `[authenticate, validateWorkspace]`. POST `/` (create + enqueue, or draft-only with `publishNow: false`); GET `/` (list, newest first, with media + platformPosts + latest job `apiResponse` for manual notes); GET `/:contentId`; DELETE `/:contentId` (cancel jobs, mark CANCELLED, archive item); PATCH `/:contentId/platforms/:platformPostId/complete` (close the WhatsApp loop); POST `/media` (multipart upload to R2, field `file`, images + video only, 50 MB max → MediaAsset READY + public URL).
- **API — new `packages/api/src/routes/accounts/index.ts`:** POST `/workspaces/:workspaceId/accounts/:platform/connect` (OAuth URL; redirectUri from `API_PUBLIC_URL`; state = HMAC-signed payload, workspaceId + userId + platform + nonce, 10-min expiry, `COOKIE_SECRET`); GET `/accounts/:platform/callback` (no JWT — signed state is the trust; exchanges the code, fetches account info, encrypts tokens with `@scope/shared` `encrypt` + `ENCRYPTION_KEY`, upserts ConnectedAccount, redirects to the composer `COMPOSER_URL`, default `http://localhost:5173`); GET `/workspaces/:workspaceId/accounts` (tokens NEVER returned); DELETE disconnect (the grant stays live in the platform's settings until MS revokes it there). WHATSAPP connect → 422 NOT_SUPPORTED.
- **API `index.ts`:** registered contentRoutes (prefix `/workspaces/:workspaceId/content`), aiRoutes (prefix `/ai`), accountConnectionRoutes (no prefix). CORS origins added: `http://localhost:5173` + `http://127.0.0.1:5173`.
- **API deps:** added `@scope/media` + `@scope/integrations` (workspace:*) to `packages/api/package.json` + matching `pnpm-lock.yaml` entries + symlinks in `packages/api/node_modules/@scope/`. Found during this: `@scope/media` has NO `dist/index` (src/ has only `storage/` + `types/`) so the root import can never resolve — the content route imports from the `@scope/media/storage` subpath instead (exports entry exists, dist files present).
- **Flag (not fixed):** the Fastify server listens on port 4000 with NO `/api/v1` prefix, but `apps/app`'s api-client base URL is `http://localhost:4000/api/v1` — wrong. `apps/app` has NO pages at all (only `globals.css` + `src/lib/*`) — an empty shell. The composer uses its own `src/lib/api.ts` and does not depend on `apps/app`.

## Composer changes (`apps/composer/`)

- `package.json`: renamed `@scope/composer` v0.1.0; scripts dev `vite --port 5173`, build `vite build`, preview, typecheck `tsc --noEmit`; removed server deps (express, dotenv, @google/genai, esbuild, tsx, @types/express, motion — motion was imported nowhere). `package-lock.json` regenerated (`npm install --package-lock-only --ignore-scripts`).
- `vite.config.ts`: port 5173 + `/api` proxy → `http://localhost:4000`, rewrite strips `/api`.
- New `src/lib/api.ts`: `apiUrl` (`VITE_API_URL` prefix, default `''` for the dev proxy), `ApiError`, token helpers (localStorage key `scope_access_token`, same as `apps/app`), `apiFetch` (Bearer token, unwraps the `{success, data}` envelope, throws with the server message), `login`, `login2FA`, `listWorkspaces`, `createWorkspace`, `listAccounts` / `connectAccount` / `disconnectAccount`, `createContent` / `listContent` / `getContent` / `deleteContent` / `completeManualPost` / `uploadMedia`, `generateHashtags` / `optimizeCaption`.
- `src/types.ts`: PlatformId += `"whatsapp"`; PlatformConfig += `manualOnly?`, `note?`; MediaAttachment += `file?: File` + `mediaAssetId?: string`; new `PlatformResult` interface; SocialPost += `platformResults?`.
- `src/constants/platforms.ts`: WhatsApp entry (color `#25D366`, charLimit 700, video+image, 9:16, iconName `MessageCircle`, `manualOnly: true`, note about no API).
- `src/components/PostComposer.tsx`: `processFile` now attaches the `File` to the attachment (needed for upload).
- `src/components/AIAssistantModal.tsx` + `HashtagManager.tsx`: fetch calls replaced with the `api.ts` helpers (envelope unwrap fixed); AIAssistantModal gained a WhatsApp tab.
- New `src/components/ManualActionCard.tsx`: the WhatsApp manual card — worker's note, media download links, copy-caption, "Mark as posted" (calls `completeManualPost`).
- `src/components/PublishModal.tsx` — FULL rewrite (real publishing): uploads media if needed → `POST /content` → marks skipped platforms → polls `GET /content/:id` every 2.5 s up to ~30 s until all platforms are terminal → calls `onPostPublished` with `platformResults`. Removed: clipboard auto-copy, webhook fetch, fake 500 ms stepping, `window.open` tabs, "Open All Channels in Tabs". Kept: copy-caption bar, blue note box (rewritten to explain real API publishing + the WhatsApp manual step), Done / Publish Now footer.
- `src/App.tsx` — FULL rewire: login gate (email+password → `/auth/login`, 2FA step via `/auth/login/2fa` if required; token in localStorage); on login, loads workspaces, picks the first (personal version — one workspace; creates `My Workspace` automatically if none); loads posts from `GET /content` (maps `ApiContentItem` → `SocialPost`, incl. `mediaAssetId`, `platformResults`, status mapping DRAFT→draft / SCHEDULED→scheduled / PUBLISHED→published / FAILED→failed, ARCHIVED filtered out); Save Draft → `POST /content publishNow: false`; Schedule → `POST /content` with `publishAt`; Publish → the new PublishModal (gets `workspaceId`, no more `webhookUrl`); Delete → `DELETE /content/:id`; Publish-now from the queue archives the old item first (cancels its scheduled jobs) so it can't double-post; "Connected accounts" card (per selected platform: Connect opens the OAuth URL in a new tab, Disconnect, WhatsApp shown as "no login needed — posted from your phone"); a banner lists pending WhatsApp Statuses with an "I posted the Status" button; handles the `?connected=` / `?connect_error=` OAuth callback params with a toast. Defaults: platforms `["tiktok","instagram","facebook","whatsapp"]`, author "Muhammad Shahid", empty caption (the demo caption is gone). localStorage now holds only settings + language — posts live in the API. Banner copy updated to the four platforms.
- `index.html` title → `Scope Social Manager — Composer`. New `apps/composer/README.md` (run guide, env vars, MS steps).
- `src/vite-env.d.ts` added (`/// <reference types="vite/client" />`) — the original project never used `import.meta.env`; `api.ts` is the first file to.

## Verification (Nov 17, after all changes)

- **Composer:** `npx tsc --noEmit` exit 0; `npm run build` exit 0 (1,688 modules, 3.24 s; `dist/index-Dtsk0Be0.js` 350.81 kB / 99.26 kB gzip). Two real errors were fixed on the way: `LoginResult` was missing `tempToken`, and the Vite client types file was missing.
- **Repo root:** `pnpm typecheck` → **15/15 successful** (was 14/14 before the composer; the 15th is `@scope/composer`). `pnpm build` → **11/11 successful** (was 10/10; the 11th is the composer). No `any` casts, no `ts-ignore`.
- **Runtime tests (no live DB/Redis in the sandbox):**
  - WhatsApp integration (compiled dist): image → `{ platformPostId: 'manual-action', requiresManualAction: true, manualActionNote: "Open WhatsApp on your phone → Status → My Status → pick this photo …" }`, no API call. Text-only → allowed (real WhatsApp feature), note now says "type this text as a Status" (fixed a wording bug found by the test: it used to say "pick this text"). Caption > 700 → rejected `CONTENT_REJECTED`. OAuth → throws `NOT_SUPPORTED`.
  - Gemini service (compiled dist, live call): `generateGeminiText` returned real hashtags `#JavaScript, #Coding, #LearnToCode` via `gemini-3.5-flash-lite`. Local fallback also verified.
- **Environment note:** the VM restarted mid-build and wiped the global pnpm install (it lived outside `~`). Reinstalled with `npm install -g pnpm@8.15.1` (8.15.1). The final typecheck + build above ran after the reinstall and are the current green state.

## What still needs a real machine (cannot be tested here)

- **No live DB/Redis:** no migrations, no `DATABASE_URL`, no `REDIS_URL` in the sandbox. The queue, posts, and accounts all run against Postgres + Redis on a real machine. The API will not boot without them.
- **No connected accounts:** OAuth has never been exercised end-to-end (no Facebook/TikTok/Instagram app credentials here). The connect/callback code is written and typechecks; the first real connect will be the first real test.
- **No R2 bucket here:** media upload (`POST /media`) needs R2 credentials + `R2_PUBLIC_URL`.

## MS steps before he can post once → all four

1. **Get the backend running somewhere real** (his laptop / a server): Postgres 16 + Redis, `DATABASE_URL` + `REDIS_URL`, run the Prisma migrations (`pnpm --filter @scope/db db:migrate` — migrations do not exist yet; they must be created from the current schema first), then start the API (`pnpm --filter @scope/api dev`, port 4000), the workers (`pnpm --filter @scope/workers dev`), and the composer (`npm run dev` in `apps/composer`, port 5173).
2. **Set the env vars** (API side): `ENCRYPTION_KEY`, `COOKIE_SECRET`, `API_PUBLIC_URL` (e.g. `http://localhost:4000`), `COMPOSER_URL` (e.g. `http://localhost:5173`), R2 bucket + keys + `R2_PUBLIC_URL`, `GEMINI_API_KEY` (or the connector surrogate in this sandbox), and the OAuth app credentials below.
3. **Create the OAuth apps** (his accounts, his browser):
   - **Facebook + Instagram:** a Meta app with Facebook Login + Instagram Graph — needs `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` and `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` (confirmed: the integrations read all four). The redirect URI registered in the Meta app must be `${API_PUBLIC_URL}/accounts/facebook/callback` (and `/accounts/instagram/callback`).
   - **TikTok:** a TikTok developer app with the Content Posting API — needs `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET`; redirect URI `${API_PUBLIC_URL}/accounts/tiktok/callback`. TikTok video-only.
4. **Register once** in the API (`POST /auth/register`, his work email `iamafreelancer150@gmail.com`), then sign in at the composer. The composer creates his one workspace automatically.
5. **Connect each account** from the "Connected accounts" card: click Connect → the platform's own site opens → he approves → he comes back here (`?connected=FACEBOOK` toast confirms). WhatsApp needs no connect.
6. **Post:** write the caption, attach the video/image, pick the platforms, Publish now (or Schedule). Then open WhatsApp on his phone → Status → My Status → pick the media → Post → back here, tap **"I posted the Status"**.

## Not in this version (SaaS later)

- No public signup / teams / subscription plans — one personal workspace. (Stripe likely cannot onboard Pakistan merchants — a second provider, Paddle / Lemon Squeezy / Polar, is still needed for the SaaS.)
- No LinkedIn / Twitter/X / Threads / Reddit / SnackVideo in the composer (LinkedIn + Reddit integrations exist in the backend).
- No professional redesign yet — MS's rule: the MultiPost Hub UI is fine for the personal version; the SaaS gets a clean light dashboard-style rebuild (Buffer/Hootsuite-like).
- `apps/app` is still an empty shell (no pages) and its api-client base URL (`http://localhost:4000/api/v1`) is wrong — the API has no `/api/v1` prefix. Untouched; the composer does not use it.
