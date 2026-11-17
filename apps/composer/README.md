# Scope Social Manager — Composer (personal version)

The composer MS posts from: write once, it goes to **TikTok, Instagram, Facebook + WhatsApp Status**.

This is the MultiPost Hub UI (React 19 + Vite 6 + Tailwind 4) folded into the
monorepo as `apps/composer`, wired to the **real** backend — no clipboard /
webhook / open-in-tabs pretending any more:

- **Publish** → `POST /workspaces/:workspaceId/content` → ContentItem +
  PlatformPost per platform + PublishJob in the BullMQ queue → the workers
  publish through the real platform APIs (Facebook Graph, TikTok Content
  Posting API, Instagram Graph container flow).
- **Schedule** → same endpoint with `publishAt` → the job runs delayed.
- **WhatsApp Status** → there is no Status API (Meta documents none).
  The worker marks the post `NEEDS_MANUAL_ACTION` with the media + caption
  ready; MS posts it from the WhatsApp app on his phone (Status → My Status)
  and taps **"I posted the Status"** here to close the loop.
- **AI** → `POST /ai/generate-hashtags` + `POST /ai/optimize-caption`
  (Gemini `gemini-3.5-flash-lite`, key via the Google AI Studio connector
  surrogate — never in a file). If Gemini fails, the API answers with a
  local fallback so AI never blocks posting.

## Run it (dev)

Three things, three terminals, in this order:

```bash
# 1. API — from the repo root
pnpm --filter @scope/api dev        # http://localhost:4000

# 2. Workers — from the repo root
pnpm --filter @scope/workers dev    # consumes the publish queue

# 3. Composer — from apps/composer
npm run dev                          # http://localhost:5173, /api proxied to :4000
```

> Why `npm` for the composer and `pnpm` for the rest: the composer keeps its
> own `node_modules` (React 19 + Tailwind 4). The monorepo uses React 18 +
> Tailwind 3, so the composer is NOT a pnpm workspace member — forcing it
> in would break the UI MS approved. It shares no code with the monorepo
> packages; all it needs is the API.

## Env vars (API side — see `packages/api`)

| Var | Needed for |
| --- | --- |
| `DATABASE_URL` | Postgres (queue, posts, accounts) |
| `REDIS_URL` | BullMQ publish queue |
| `ENCRYPTION_KEY` | OAuth tokens at rest |
| `COOKIE_SECRET` | Signed OAuth state |
| `API_PUBLIC_URL` | OAuth redirect URIs (e.g. `http://localhost:4000`) |
| `COMPOSER_URL` | Where the OAuth callback sends MS back (default `http://localhost:5173`) |
| `R2_*` + `R2_PUBLIC_URL` | Media uploads |
| `GEMINI_API_KEY` | AI endpoints (or the connector surrogate in this sandbox) |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook + Instagram connect |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok connect |

## MS steps before the first post (needs him, in his browser)

1. **Register once** in the API (`POST /auth/register` with his work email)
   and sign in here. The composer creates his one workspace automatically.
2. **Connect each account** from the "Connected accounts" card (TikTok,
   Instagram, Facebook): click Connect → the platform's own site opens →
   approve → back here. WhatsApp needs no connect — it is posted from his
   phone (see above).
3. **Post**: write the caption, attach the video/image, pick the platforms,
   Publish now (or Schedule). TikTok + Instagram need a video or image —
   text-only posts are skipped for them. Facebook takes text-only.
4. After the publish window shows the WhatsApp card, open WhatsApp on his
   phone → Status → My Status → pick the media → Post → come back here and
   tap **"I posted the Status"**.

## What is NOT here yet (SaaS version)

- No public signup / teams / subscription plans — one personal workspace.
- No LinkedIn / Twitter/X / Threads / Reddit / SnackVideo in the composer
  (LinkedIn + Reddit integrations exist in the backend; the UI lists the
  four MS uses daily).
- No live DB/Redis in this sandbox — the queue runs against Postgres +
  Redis on a real machine.
