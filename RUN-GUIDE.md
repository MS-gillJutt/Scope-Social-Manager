# Scope Social Manager — How to run it (your laptop)

**What it is:** one app where you write a post once, and it goes to Facebook, Instagram and TikTok. WhatsApp Status is a 10-second manual step on your phone (no app in the world can post a Status for you — Meta has no Status API).

**What it is built on (simple words):**
- **Composer (what you see):** React 19 + Vite + Tailwind — the screen where you write the post. Runs at `http://localhost:5173` on your laptop.
- **API (the brain):** Fastify (Node.js) — it holds your accounts, posts and queue. Runs at `http://localhost:4000`.
- **Database:** PostgreSQL 16 — stores your accounts, posts and results.
- **Queue:** Redis + BullMQ — the workers that actually send each post to Facebook/Instagram/TikTok, one by one, and report back.
- **Media:** Cloudflare R2 — where your photos/videos are stored (free tier is enough).
- **AI captions:** Google Gemini (your own AI Studio key).

## Option A — run it on your laptop (start here, free, fastest)

Your laptop must be ON while you post. Scheduled posts only go out while it is on. This is the fastest way to start — about 1 hour of setup, no new paid account.

### Step 1 — Install 4 things
1. **Node.js 20 or newer** — from nodejs.org (LTS). Check: open a terminal, type `node --version` — it must say v20 or higher.
2. **pnpm 8** — in the terminal: `npm install -g pnpm@8.15.1`. Check: `pnpm --version`.
3. **PostgreSQL 16** — from postgresql.org (the installer). During setup, set a password you remember. It creates a server on your laptop at `localhost:5432`.
4. **Redis** — on Windows: install WSL2 (Ubuntu) once, then inside it `sudo apt install redis-server` and `sudo service redis-server start`. On Mac: `brew install redis` then `brew services start redis`.

### Step 2 — Get the code
```bash
git clone https://github.com/MS-gillJutt/Scope-Social-Manager.git
cd Scope-Social-Manager
pnpm install
```

### Step 3 — Make the database
Open pgAdmin (comes with PostgreSQL) or `psql` and create one database:
```sql
CREATE DATABASE scope_social;
```
Then copy the settings file and fill it in:
```bash
cp .env.example .env
```
Edit `.env` — the only lines you MUST fill now:
- `DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/scope_social` (use the password from Step 1)
- `REDIS_URL=redis://localhost:6379`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` — any long random text (32+ characters)
- `ENCRYPTION_KEY` — run `openssl rand -hex 32` and paste the result (or any 64-character hex text)
- `GEMINI_API_KEY` — your Google AI Studio key
- Leave the R2 and OAuth lines empty for now — the app runs without them; you add them in Step 5.

### Step 4 — Build the tables and start it
```bash
pnpm --filter @scope/db db:generate
pnpm --filter @scope/db db:migrate
```
(The first migration file `0001_init` is already in the repo — this step just runs it.)
Then start the three parts — **one terminal window each**:
```bash
# Terminal 1 — API
pnpm --filter @scope/api dev
# Terminal 2 — workers (the part that actually posts)
pnpm --filter @scope/workers dev
# Terminal 3 — composer (your screen)
npm run dev --prefix apps/composer
```
Open `http://localhost:5173` in your browser. Register with your work email. It makes your one workspace automatically.

### Step 5 — Connect your accounts (your browser, one time each)
1. **Meta app (Facebook + Instagram):** at developers.facebook.com, make one app, add "Facebook Login" and "Instagram Graph". Copy the App ID + App Secret into `.env` as `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`. In the app settings, add these redirect URIs:
   - `http://localhost:4000/accounts/facebook/callback`
   - `http://localhost:4000/accounts/instagram/callback`
   Restart the API (Terminal 1) after editing `.env`.
2. **TikTok app:** at developers.tiktok.com, make an app with the "Content Posting API". Copy the Client Key + Client Secret into `.env` as `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`. Redirect URI: `http://localhost:4000/accounts/tiktok/callback`. Restart the API.
3. **In the composer:** open "Connected accounts", click Connect next to Facebook, Instagram and TikTok, and approve on each site. WhatsApp needs no connect.
4. **R2 (for photos/videos):** free Cloudflare account → R2 → make a bucket → copy the account ID, bucket name and keys into `.env` (`R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL`). Restart the API.

### Step 6 — Post
Write your post in the composer, pick Facebook + Instagram + TikTok, press Post. The screen shows each result live (published with link, or failed with the error). For WhatsApp Status, the composer shows the photo + text and the steps: open WhatsApp on your phone → Status → My Status → pick the media → Post → tap "I posted the Status" in the composer.

## Option B — deploy it somewhere (later, always-on)

If you want it running even when your laptop is off, and postable from your phone, it needs a small server. Free tiers that fit: **Railway or Render** (API + workers), **Neon or Supabase** (free Postgres), **Upstash** (free Redis), **Cloudflare Pages** (composer, free). The code is the same — only the URLs in `.env` change from `localhost` to the server's address, and the OAuth redirect URIs change to match. This is a second job (about half a day); start on the laptop first and move it when the laptop version proves itself.

## What is ready right now
- The whole app builds green (typecheck 15/15, build 11/11).
- The first database migration (`packages/db/prisma/migrations/0001_init/migration.sql`, 19 tables) is already made.
- `.env.example` lists every setting you need.
- Nothing is online yet — no deploy has happened. The repo on GitHub still has only the Nov 14 code; all of this work is local until you say push/deploy.
