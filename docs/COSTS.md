# Running Costs — "Free until it grows" plan

Prices checked **14 Nov 2026** from vendor docs and third-party summaries. Vendors change free tiers often — re-check before launch.

## 1. Code / packages: $0
Every npm dependency used here (Next.js, Fastify, Prisma, BullMQ, React Email, Zod, Tailwind, etc.) is open source and free, including commercial use. Costs only come from **services** that run the app.

## 2. Services

| Need | Free option | Free-tier limits | When you'd pay | After free |
|---|---|---|---|---|
| Source code + CI | GitHub Free | limited private Actions minutes (unlimited on public repos) | many builds | $4/user/mo Team |
| PostgreSQL | **Neon Free** | 100 projects, 100 CU-hrs/project, 1 GB storage/project (20 GB total), scales to zero (cold starts) | >1 GB data | Launch: pay-as-you-go, $5 minimum |
| Redis / queues | **Upstash Free** | 256 MB, **500K commands/month** | BullMQ idles with constant commands — can exhaust 500K | PAYG $0.20/100K cmds, or Fixed ~$10–20/mo |
| Media storage | **Cloudflare R2** | 10 GB, 1M writes, 10M reads/mo, **free egress** | >10 GB | $0.015/GB-month |
| Next.js sites (web/app/admin) | Vercel Hobby or Cloudflare Pages | free | Vercel Hobby is for non-commercial use — check terms before charging customers | Vercel Pro ~$20/mo |
| API + workers (always-on) | **Render free web service** | 0.1 vCPU / 512 MB, **sleeps after 15 min idle** | scheduled posts need an always-on worker | ~$7/mo+ always-on instance |
| Email | any SMTP (project uses Nodemailer): Brevo / Resend free tiers | a few hundred–few thousand mails/mo (verify current limits) | volume | ~$15–20/mo |
| Domain | — | not free | always | ~$10–15/year |
| AI captions (optional) | skip at launch | — | — | OpenAI usage-based |

## 3. Realistic monthly cost
- **Development (local Docker):** $0
- **Beta / first users:** ~$0 + domain (~$1/mo). Caveat: free API host sleeps → scheduled posts can be late. Mitigation: run the worker inside the API process and keep the service awake with a free uptime monitor (check the host's terms).
- **First paying customers:** ~$7–15/mo (always-on API/worker host, maybe Redis fixed plan). Revenue should cover this.
- **Growth:** Neon Launch + Upstash Fixed + Render/Fly ≈ $30–60/mo.

## 4. Payments (important for Pakistan)
- Stripe does **not** appear to onboard Pakistan-registered businesses (sources conflict; verify at stripe.com/global).
- Options: **Paddle** (~5% + 50¢, merchant of record, handles VAT/tax), **Polar** (~4% + 40¢), **Lemon Squeezy** (Pakistan listed for bank payouts; min payout $50; is migrating to Stripe Managed Payments).
- No monthly fee on any of them — they only take a cut of each sale, so cost is $0 until you earn.
- Decision: keep the `PaymentProvider` interface and implement one MoR provider first. Stripe code can stay as an optional adapter.

## 5. Platform API costs
Facebook/Instagram/Threads, TikTok, LinkedIn, YouTube and Reddit developer APIs are free to register, but need app review (Meta/TikTok/LinkedIn) before the public can connect accounts. Reddit's API terms for commercial use should be checked before launch.
