# Scope Social Manager

> **Multi-tenant Social Media Management SaaS** — Schedule, publish, and analyse content across every major social platform from a single workspace.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web App | Next.js 14 (App Router) |
| API | Fastify + Prisma |
| Queue | BullMQ on Redis |
| Database | PostgreSQL 16 |
| Cache / Pub-Sub | Redis 7 |
| Object Storage | Cloudflare R2 |
| Payments | Stripe |
| Email | Nodemailer + React Email |
| Auth | JWT (access + refresh) |
| AI | OpenAI GPT-4o (optional) |

## Supported Platforms

Facebook · Instagram · TikTok · LinkedIn · YouTube · Reddit · Threads

## Brand

- **Primary**: `#6366f1` (Indigo 500)
- **Secondary**: `#0ea5e9` (Sky 500)

---

## Project Structure

```
scope-social-manager/
├── apps/
│   ├── web/            # Next.js 14 marketing site (landing, pricing)
│   ├── app/            # Next.js 14 customer dashboard (scheduler, inbox, analytics)
│   └── admin/          # Next.js 14 super-admin panel
├── packages/
│   ├── api/            # Fastify REST API (auth, account, workspaces)
│   ├── config/         # Zod-validated env + app constants
│   ├── db/             # Prisma schema, client, seed
│   ├── email/          # React Email templates + send utility
│   ├── integrations/   # Social platform integrations (FB, IG, TikTok, LinkedIn, YouTube, Reddit, Threads)
│   ├── media/          # Cloudflare R2 storage service
│   ├── shared/         # Shared TypeScript types & utilities
│   └── workers/        # BullMQ publishing workers
├── infrastructure/
│   └── docker/         # docker-compose for local PostgreSQL & Redis
├── docs/               # Roadmap, architecture notes
└── .github/            # CI workflow, issue & PR templates
```

> Internal package scope is `@scope/*`. Progress: [`docs/ROADMAP.md`](docs/ROADMAP.md) · Running costs: [`docs/COSTS.md`](docs/COSTS.md)

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 8 — `npm install -g pnpm`
- **Docker + Docker Compose** (for local PostgreSQL & Redis)

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/scope-social-manager.git
cd scope-social-manager
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in all required values in .env
```

### 3. Start local services

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start development servers

```bash
pnpm dev
```

This starts:
- **Apps** → web: http://localhost:3000 · admin: http://localhost:3001 · app (dashboard): http://localhost:3002
- **API server** → http://localhost:4000

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in dev mode (watch) |
| `pnpm build` | Production build for all apps & packages |
| `pnpm lint` | ESLint across all packages |
| `pnpm test` | Run all test suites |
| `pnpm typecheck` | Type-check all packages |
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:migrate` | Apply pending DB migrations |
| `pnpm db:studio` | Open Prisma Studio |

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions.

---

## Contributing

1. Fork the repo and create a feature branch (`feat/your-feature`)
2. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
3. Open a PR — CI must be green before merging

---

## License

MIT © Scope Social Manager
