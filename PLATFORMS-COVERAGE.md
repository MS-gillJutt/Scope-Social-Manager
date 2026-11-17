# Social Manager — full platform coverage plan (Nov 17, 2026)

MS's order: cover EVERY social platform, not just the first four. This file is the honest map: which platforms have a real posting API (we can automate them), which do not (manual only), what each costs, and the build order.

## The honest rule
A platform can be automated **only if it has an official posting API**. No API = no automation, no matter how much we want it. For those, the composer prepares the media + caption and shows the manual steps (same pattern as WhatsApp Status today).

## Already in the monorepo (backend integrations exist)
| Platform | Integration file | Status |
|---|---|---|
| Facebook | `packages/integrations/src/facebook/` | ✅ In composer, posts for real |
| Instagram | `packages/integrations/src/instagram/` | ✅ In composer, posts for real |
| TikTok | `packages/integrations/src/tiktok/` | ✅ In composer, posts for real (video-only) |
| LinkedIn | `packages/integrations/src/linkedin/` | ✅ In the composer WITH the MS checkbox rule (Nov 17, 2026): **unchecked by default** (professional only — the user ticks the box only when they want this post on LinkedIn). Promo posts never go there unless the user ticks it. The backend integration exists; the connect flow is part of the SaaS wiring. |
| YouTube | `packages/integrations/src/youtube/` | Backend exists, not in composer yet |
| Reddit | `packages/integrations/src/reddit/` | Backend exists, text only, media upload not implemented |
| Threads | `packages/integrations/src/threads/` | Backend exists, not in composer yet |
| WhatsApp | `packages/integrations/src/whatsapp/` | Manual-action only (no Status API exists) |

## Batch 1 — wire the 3 that already exist (next build)
YouTube (Data API v3, free, 10,000 quota units/day — video + Shorts uploads), Threads (free, Meta App Review, 250 API posts/24h), Reddit (text/link posts; media upload to add). **LinkedIn is already in the composer with the checkbox rule (unchecked by default)** — no Batch 1 work needed for it.
- Reddit flag: Meta/Reddit now requires approval for any API access and the public Data API is closing to new requests (was Oct 31, 2026) — a new Reddit app may not be approved at all. Verify before building the Reddit wiring.

## Batch 2 — new integrations to build (all have a real free API)
| Platform | API | Cost | Notes |
|---|---|---|---|
| Bluesky | AT Protocol (open) | Free, no app review | Text + up to 10 images or 1 video, 300 chars. Easiest new one. |
| Pinterest | Pinterest API v5 | Free (Trial + Standard) | Pins on boards; Trial pins are hidden from the public web; Standard needs a video-demo review. |
| Mastodon | Mastodon API (open) | Free | Any instance; text + media. |
| Telegram | Bot API | Free | Channels/groups (not personal profiles). Good for a ScopeTreasure channel. |
| Tumblr | Tumblr API | Free | Text/photo/video posts. |
| Snapchat | Snap Public Profile API | Free, but gated | Needs review + allowlist; media must be AES-256-CBC encrypted. |
| Google Business Profile | GBP API | Free | Business posts (good for the agency side). |

## X (Twitter) — real API, but PAID (needs MS's decision)
X API is pay-per-use since Feb 2026: **$0.015 per text post, $0.20 per post that contains a URL** (our posts always contain a link). No free tier for new developers. At 1 post/day with a link = ~$6/month. Build it only if MS accepts the cost.

## Manual-only — NO posting API exists (composer prepares, MS posts in the app)
| Platform | Why manual |
|---|---|
| WhatsApp Status | Meta has no Status endpoint. (Already handled: manual-action card.) |
| SnackVideo | No public posting API (Kuaishou). Only read-only scrapers exist. |
| Likee | No public posting API. |
| Moj | No public posting API. |
| ShareChat | No public posting API. |
| Kwai | No public posting API (only public-data scrapers). |
| Josh, Helo | No public posting API. |
| Signal, Viber (personal) | No posting API. |

For these, the composer will offer a "Prepare for manual post" card: download the media + copy the caption + the exact steps, same as WhatsApp Status.

## The full count
- **Automated (real API):** Facebook, Instagram, TikTok, YouTube, Threads, Reddit*, Bluesky, Pinterest, Mastodon, Telegram, Tumblr, Snapchat*, Google Business Profile, X* (paid) = **14 platforms** (+ LinkedIn backend-only, professional flow later).
- **Manual-only:** WhatsApp Status, SnackVideo, Likee, Moj, ShareChat, Kwai, Josh, Helo = **8 platforms** (prepared in the composer, posted by hand).
- **Total coverage: 22 platforms.**

## Build order (proposed)
1. Batch 1: YouTube + Threads + Reddit* (wire existing integrations into the composer).
2. Batch 2a (easy, free): Bluesky + Mastodon + Telegram + Tumblr.
3. Batch 2b (needs review): Pinterest + Snapchat + Google Business Profile.
4. X: only after MS accepts the $0.20/post cost.
5. Manual cards: SnackVideo + Likee + Moj + ShareChat + Kwai (prepare-only cards in the composer).

Sources: Blotato 2026 API guide, Buffer multi-platform API guide, invisibleapi.ai 2026 guide, bundle.social platforms list, ShortSync API (17 platforms), Ayrshare Snapchat guide.
