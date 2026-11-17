# MultiPost Hub — study (Nov 16, 2026, ~23:25 PKT)

Source: MS's zip `~/workspace/user/files/multipost-hub.zip` (153 KB), extracted to `~/workspace/scope-social-manager/multipost-hub/` (27 files, 216 KB). AI Studio app: https://ai.studio/apps/bd88953d-f408-4cb2-8f84-fec49c4fa6dd

## What it is
- React 19 + Vite 6 + TypeScript + Tailwind 4 + Express server (`server.ts`). ~3,066 lines in src/ + server.
- Single-page composer: PostComposer, PlatformSelector, PlatformPreview (live feed preview), HashtagManager, PublishModal, SchedulerModal, ScheduledQueue, SettingsModal, AIAssistantModal, ZeroBudgetGuideModal, Navbar.
- Platforms (5): LinkedIn (3,000 chars), TikTok (2,200), Instagram (2,200), Facebook (63,206), Twitter/X (280). Urdu names + RTL toggle + English/Urdu language.
- Server endpoints: `/api/health`, `/api/ai/generate-hashtags` (Gemini), `/api/ai/optimize-caption` (Gemini, per-platform versions), `/api/broadcast/webhook` (forwards the post to a Make.com/n8n/Zapier webhook).
- Storage: localStorage only (`omnipost_posts`, `omnipost_settings`, `omnipost_lang`). No database, no accounts, no server-side queue.

## The honest limit — it does NOT post by itself
- "Publish to Selected Platforms" = (1) copies the caption + hashtags to the clipboard, (2) if a webhook URL is set, fires `/api/broadcast/webhook` to forward the post to the user's own Make/n8n flow, (3) opens each platform's composer in a new tab (`window.open`) so the USER still presses Post in each tab. The modal says so: "Your text & hashtags are automatically copied to clipboard. Click 'Open All Platforms' to launch prefilled creation tabs."
- No platform API calls anywhere (no Facebook Graph, Instagram, TikTok, LinkedIn OAuth). No connected accounts. Scheduling = a `scheduledFor` time stored locally — nothing publishes it at that time (no worker; the browser must be open).
- So on its own it makes posting FASTER (one caption, copy, open all tabs) but does not finish the job. The real posting must come from the Social Manager monorepo (real OAuth integrations + publish workers + DB).

## Code health — clean
- `npx tsc --noEmit`: exit 0, no errors. `npm run build`: exit 0 (1 warning: output format "esm" for import.meta in the server bundle — minor).
- The preview's "2 errors running the code" are NOT in the shipped code. Likely cause: the Gemini model name is `gemini-3.8-flash` — that model name looks wrong (current is Gemini 2.5 Flash) and would fail at runtime, or the missing GEMINI_API_KEY in the preview. Fix when wiring up: verify the model name + key.
- AI endpoints have good fallbacks when no key is set (smart hashtag fallback from the post words + template per-platform captions).

## What is missing for MS
- WhatsApp status (his 4th platform) is NOT in it. Threads, LinkedIn (present), SnackVideo, Reddit also not all there.
- No real publishing, no accounts, no database, no team/multi-user, no analytics (the "Add Post Analytics" card in the screenshot is a placeholder).

## The fold-in plan (rapid build)
Use the MultiPost Hub as the COMPOSER UI of Scope Social Manager (the design + flow + AI helpers + Urdu/RTL that MS likes) and wire it onto the monorepo's real backend:

**MS RULE (Nov 16 ~23:23): the AI Studio interface is NOT professional enough for the later SaaS.** It is a good prototype (dark, consumer-style, "Zero Budget" marketing), but a SaaS people pay for needs a professional design. So TWO versions:
1. **Fast personal version (for MS himself, now):** the MultiPost Hub UI as-is, wired to the real backend — solves his own posting pain quickly.
2. **SaaS version (for paying users, after):** a professional redesign — clean light dashboard-style interface (like Buffer/Hootsuite), proper navigation (dashboard, composer, queue, accounts, analytics, settings, billing), consistent design system, the monorepo's own brand (Indigo #6366f1 + Sky #0ea5e9). That is the version other people will pay for.

Steps:
1. Replace localStorage posts with the Social Manager API (ContentItem + PublishJob + ScheduledQueue from the DB).
2. Replace the webhook/manual-tab publish with the real publish worker (OAuth-connected accounts: Facebook, Instagram, TikTok, YouTube, LinkedIn) — that is what makes "post once, it goes everywhere" real.
3. Add WhatsApp status as a platform (his 4th), then Threads/SnackVideo/Reddit.
4. Keep the Gemini AI endpoints (his key, free tier) with the fallbacks; fix the model name.
5. Keep the dark UI + the Zero-Budget guide (Make/n8n) as the free route for users without connected accounts.
- The monorepo's build is nearly green (12/13 typecheck, 4/10 build — only the Prisma client generation is blocked in this sandbox). The UI fold-in does not depend on that blocker.
