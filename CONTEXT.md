# Arcademy — Domain Context

Arcademy is the official learning platform for Arcium ecosystem products. V1 is a curated learner MVP with limited partner self-service: staff publish courses, partners submit and review materials, learners browse publicly, connect a Solana wallet to track progress, pass quizzes, and earn off-chain badges.

Full product requirements: [docs/PRD.md](docs/PRD.md)

## Audience

- **Primary (V1):** New users learning Arcium ecosystem concepts — not developers first.
- **Staff:** Arcademy team curating and publishing courses, approving partner-submitted content, viewing analytics.
- **Partners:** Ecosystem teams using limited self-service to submit source material, draft course content, review factual accuracy, and view basic reporting.
- **Deferred:** Developer sandboxes, social features, advanced LMS functionality.

## Core Concepts

| Term | Meaning |
|------|---------|
| **Learner** | A user with role `learner` who browses courses, completes lessons, takes quizzes, and earns badges. |
| **Staff admin** | A user with role `staff_admin` who creates, edits, publishes products/courses and views analytics. |
| **Partner admin** | A limited partner user who can submit source material, draft or review assigned ecosystem project content, and view basic reporting without direct publish authority. |
| **Product** | A staff-managed Arcium ecosystem product page with metadata (name, slug, description, logo, links). Status: draft, published, or archived. |
| **Course** | A structured learning path owned by a product, with metadata (title, slug, level, duration, thumbnail). Status: draft, published, or archived. Public course URLs are product-scoped. |
| **Lesson** | An ordered unit within a course. Contains content and optional media. |
| **Quiz** | An assessment tied to a course (and optionally a lesson). Has a pass threshold. |
| **Question** | A multiple-choice item within a quiz with prompt, options, correct answer, and explanation. |
| **Progress** | Per-user, per-lesson completion state within a course. |
| **Quiz attempt** | A submitted quiz with score and pass/fail outcome. |
| **Badge** | A course completion credential definition (name, description, image). |
| **Badge award** | An instance of a badge granted to a learner after course completion. V1: off-chain only, stored in Postgres. |

## User Journey (V1)

1. Browse published products or courses (no wallet required).
2. View product-scoped course detail (overview, lessons, difficulty, time, badge reward).
3. Connect Solana wallet to start tracked progress.
4. Complete lessons in order.
5. Pass the final quiz.
6. Receive a badge award (off-chain).
7. View progress and badges in learner profile.

## Course Completion Rules

A course is complete when **all** of the following are true:

1. Every required lesson is marked complete.
2. The final quiz is passed (score ≥ pass threshold).
3. The learner has a connected Solana wallet.

On completion → create a `BadgeAward` (when a published badge exists).

### Learner-facing signals

| Signal | Meaning |
|--------|---------|
| **Requirements met** | Required lessons done + final quiz passed. Drives progress % and “course completed” UI. |
| **Badge awarded** | A `BadgeAward` row exists. Shown in badges/profile; not the definition of “completed.” |

Progress % counts required lessons and the final quiz only — optional lessons do not affect the completion path.

**Code:** `src/lib/course-completion.ts` (predicates + read API); `src/lib/completion.ts` (award); `src/lib/completion-side-effects.ts` (analytics, notifications, Discord). Partner submit vs staff publish readiness: `src/lib/course-lifecycle-readiness.ts`. Course content editing: `src/lib/course-editing.ts` + `src/app/actions/course-editing.ts`. URL slugs: `src/lib/slugify.ts` (pure) + `src/lib/slugs.ts` (unique slugs for products, courses, learning paths). Access checks: `src/lib/access-control.ts` (`authorizeUser`, `authorizeStaff`, `authorizeProjectAdmin` → `{ ok, user } | { ok: false, reason, message }`; server actions use `toActionError()`). **Catalog surfaces:** learning catalog (`src/lib/products.ts` → `/products`) vs ecosystem directory (`src/lib/ecosystem-catalog.ts` → `/ecosystem`); linked on product publish via `syncEcosystemDirectoryFromProduct`.

## Ecosystem surfaces

Arcademy has two public catalogs that answer different questions:

| Surface | Routes | Question | Source of truth |
|---------|--------|----------|-----------------|
| **Learning catalog** | `/products`, `/courses` | Where can I learn? | Published `Product` rows and their courses |
| **Ecosystem directory** | `/ecosystem` | What exists in the ecosystem? | `EcosystemDirectoryEntry` in Postgres |

The explorer may list projects before they have courses. When a product is published, staff sync upserts a directory entry and the explorer shows a **View courses on Arcademy** link. Static data in `src/lib/ecosystem/data.ts` seeds the directory in dev/CI only — runtime reads go through `loadEcosystemExplorerProjects()` in `src/lib/ecosystem-catalog.ts`.

## Wallet Gating

| Action | Wallet required? |
|--------|------------------|
| Browse products | No |
| Browse course catalog | No |
| View course details | No |
| Start course / save progress | Yes |
| Take quizzes | Yes |
| Earn badges | Yes |
| View learner profile | Yes |

## Roles

- `learner` — default role for wallet-connected users.
- `staff_admin` — access to admin dashboard.
- Limited partner role — access to assigned partner self-service workspace.

Partner self-service is in V1, but publishing remains staff-approved. Products are staff-governed and may be partner-assisted through assigned partner workspaces. Partner teams are trusted to mark lesson, quiz, and badge content as visible; staff still approves course publication.

## Infrastructure (Fixed for V1)

| Layer | Choice |
|-------|--------|
| App | Next.js App Router on Vercel |
| Database | Neon Postgres |
| ORM | Prisma (recommended) |
| Auth | Solana wallet signature (Better Auth or Auth.js custom flow) |
| Media | Cloudinary (store references in Postgres only) |
| UI | shadcn/ui + Tailwind CSS |

## Explicit Non-Goals (V1)

Soulbound NFTs, on-chain credentials, partner direct publishing without staff approval, paid courses, leaderboards, social profiles, comments, AI-generated lessons, multi-language, mobile app, code execution sandboxes, full LMS grading.

## Success Metrics

- **Primary:** Course completions.
- **Supporting:** Start-to-completion rate, quiz pass rate, wallet-connected learners, avg lesson time, drop-off points, users with ≥1 badge.

## Launch Content

1. **Welcome to Arcium** — intro to Arcium, privacy-preserving computation, ecosystem overview.
2. **Flagship product course** — practical onboarding for one ecosystem product, written for new users.
