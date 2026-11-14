# Roadmap & Progress

Status legend: ✅ done · 🟡 partial · ⬜ not started

## Phase 1 – Foundation
- ✅ Monorepo (pnpm + Turborepo), tsconfig base, docker-compose, CI skeleton
- ✅ `config` (env validation, constants), `shared` types/utils
- ✅ `db` Prisma schema, client, seed

## Phase 2 – Backend API
- ✅ Fastify app, plugins (prisma, redis, auth, rate-limit, multipart)
- ✅ Auth routes + services (register/login/refresh/reset, 2FA deps)
- ✅ Account routes, Workspace routes + service (teams, invites)
- 🟡 Payments: only `payment-provider.interface.ts` (no Stripe implementation, no webhooks)
- ⬜ Posts / content routes
- ⬜ Media upload routes (wire `packages/media`)
- ⬜ Social account connect (OAuth) routes
- ⬜ Analytics routes
- ⬜ Subscription / billing routes (provider-agnostic: Stripe OR Paddle/Lemon Squeezy/Polar)
- ⬜ Admin routes
- ⬜ `GET /health` verification + API tests

## Phase 3 – Integrations
- ✅ Base integration + interface/types
- ✅ Facebook, Instagram, Threads, TikTok, LinkedIn, YouTube
- ✅ `integrations/src/index.ts` + registry added
- 🟡 Reddit: types only, `reddit.integration.ts` missing

## Phase 4 – Workers
- 🟡 `publish.queue.ts`, redis, logger, sanitizer, errors exist
- ⬜ `workers/src/index.ts` (entry point missing)
- ⬜ Publish worker processor, retry/backoff, token-refresh job, analytics sync job
- ⬜ Email notification jobs (post published/failed, token expiring)

## Phase 5 – Emails
- ✅ 9 templates + send utility
- ⬜ Preview / test script

## Phase 6 – Frontend
- 🟡 `apps/web`: layout, Navbar, Footer, Hero, Pricing, PlatformGrid components — **no `page.tsx` yet**
- 🟡 `apps/app`: api-client, store, mock data, utils — **no `layout.tsx` / pages / components yet**
- 🟡 `apps/admin`: layout, header, sidebar, StatCard, Modal, dashboard `page.tsx` — other admin pages missing
- ⬜ Auth pages (login, register, forgot/reset password, verify email)
- ⬜ Dashboard: composer, calendar, media library, inbox, analytics, settings, billing, team

## Phase 7 – Quality & Release
- ⬜ ESLint config (lint scripts exist but no config)
- ⬜ Unit / integration tests (`pnpm test` has nothing to run)
- ⬜ `pnpm-lock.yaml` committed (CI currently installs without frozen lockfile)
- ⬜ Prisma initial migration committed
- ⬜ Deployment config (Dockerfiles, hosting)

## Known issues to fix
1. `packages/api` has no `typecheck` / `lint` scripts and doesn't depend on `@scope/email` or `@scope/integrations`.
2. `packages/workers` has no `lint` script and its tsconfig lacks `module` overrides for `tsx` ESM use.
3. API CORS allow-list is hard-coded to port 3000; the dashboard app now runs on 3002.
4. `.env.example` should be cross-checked against `packages/config/src/env.ts`.
5. Brand name is currently a constant in `packages/config/src/constants.ts`. Make it editable by the owner from the super-admin panel (store in a `PlatformSetting` table, cache in Redis, read via a `getBrand()` helper).
6. Placeholder domain `scopesocialmanager.com` is used in emails/constants — replace with the real domain.
7. Stripe likely cannot onboard Pakistan-based merchants — build a second `PaymentProvider` (Paddle / Lemon Squeezy / Polar) behind the existing interface. See COSTS.md.

## Suggested next steps (in order)
1. Push repo to GitHub, enable Actions, fix whatever CI reports.
2. Add missing entry points (`integrations/src/index.ts`, `workers/src/index.ts`) and `reddit.integration.ts`.
3. Get `pnpm install && pnpm typecheck && pnpm build` fully green.
4. Finish `apps/web` home page, then `apps/app` shell + auth pages.
5. Build posts/media/social-account API routes, then worker processor.
