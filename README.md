# Arcademy

The official learning platform for the Arcium ecosystem. Learners browse courses publicly, connect a Solana wallet to track progress, pass quizzes, and earn off‑chain badges. Staff create and publish courses through an admin dashboard.

Built with **Next.js (App Router)**, **Prisma + Neon Postgres**, **Solana wallet auth**, **Cloudinary**, and **Tailwind CSS**.

> Product spec: [`docs/PRD.md`](docs/PRD.md) · Domain context: [`CONTEXT.md`](CONTEXT.md)

## Features

- **Public catalog** — browse products and courses without a wallet; course detail pages live under product pages.
- **Solana wallet sign‑in** — nonce challenge + ed25519 signature verification, session in an httpOnly JWT cookie. Accounts are anchored to a wallet address (no email/password).
- **Learning flow** — ordered lessons, persisted progress, and a final quiz with pass/fail logic and per‑question feedback.
- **Off‑chain badges** — awarded automatically when all lessons are complete and the final quiz is passed; shown in the learner profile.
- **Staff admin** — create/edit/archive products and courses, manage lessons (with reordering), build quizzes and multiple‑choice questions, define badges, publish/unpublish, preview as a learner, and view per‑course analytics (starts, completions, quiz pass rate, average score, drop‑off lesson, badge awards).
- **Cloudinary media** — signed, direct‑to‑Cloudinary uploads for thumbnails and lesson/badge images. Only the asset URL is stored in Postgres.

## Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io)
- A [Neon](https://neon.tech) Postgres database
- A [Cloudinary](https://cloudinary.com) account (optional for local dev; uploads are disabled until configured)

## Setup

```bash
pnpm install
cp .env.example .env   # then fill in the values
```

Set the following in `.env`:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (runtime). |
| `DIRECT_URL` | Neon **direct** connection string (migrations). |
| `AUTH_SECRET` | Long random string for signing session JWTs. |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | `devnet`, `mainnet-beta`, or `testnet`. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials (server‑side signing). |
| `STAFF_ADMIN_WALLETS` | Comma‑separated wallet addresses granted `staff_admin`. |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Database

```bash
pnpm db:push     # create tables from prisma/schema.prisma
pnpm db:seed     # seed Arcium product + two launch courses (+ staff admins from env)
pnpm db:studio   # optional: browse data
```

For versioned migrations use `pnpm db:migrate` instead of `db:push`.

## Run

```bash
pnpm dev         # http://localhost:3000
```

To become a staff admin: add your wallet to `STAFF_ADMIN_WALLETS`, run `pnpm db:seed` (or just sign in — the role is applied on sign‑in), then visit `/admin`.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server. |
| `pnpm build` | Generate Prisma client + production build. |
| `pnpm start` | Run the production server. |
| `pnpm lint` | ESLint. |
| `pnpm db:push` / `db:migrate` | Sync / migrate the schema. |
| `pnpm db:seed` | Seed launch content. |

## Deployment (Vercel)

1. Push this repo to Git and import the project in Vercel.
2. Add all `.env` variables in the Vercel project settings.
3. The `build` script runs `prisma generate` automatically.
4. Run `pnpm db:push` (or `db:migrate deploy`) against your production database once.

Cloudinary images are served from `res.cloudinary.com` (already allow‑listed in `next.config.ts`).

## Project structure

```
src/
  app/
    actions/        Server actions (auth, learn, admin)
    api/cloudinary/ Signed upload endpoint
    admin/          Staff dashboard + product/course editors
    courses/        Cross-product course catalog
    products/       Product pages + product-scoped course, lesson, and quiz routes
    profile/        Learner profile + badges
  components/
    ui/             Design-system primitives
    admin/          Admin editor components
  lib/              prisma, session, solana, cloudinary, courses, completion, analytics
prisma/
  schema.prisma     Data model
  seed.ts           Arcium product + launch courses
```

## Notes

- **Badges are off‑chain** in V1 (stored in Postgres). The `BadgeAward` model is designed so NFT minting can be layered on later without schema changes.
- **Products are first-class** in V1. Courses belong to a product through `productId`, public course URLs are nested under `/products/[productSlug]/courses/[courseSlug]`, and `/courses` remains a cross-product catalog.
