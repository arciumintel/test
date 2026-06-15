# Arcademy — Domain Context

Arcademy is the official learning platform for Arcium ecosystem products. V1 is a curated learner MVP: staff publish courses, learners browse publicly, connect a Solana wallet to track progress, pass quizzes, and earn off-chain badges.

Full product requirements: [docs/PRD.md](docs/PRD.md)

## Audience

- **Primary (V1):** New users learning Arcium ecosystem concepts — not developers first.
- **Staff:** Arcademy team curating and publishing courses, viewing analytics.
- **Deferred:** Partner self-service authoring, developer sandboxes, social features.

## Core Concepts

| Term | Meaning |
|------|---------|
| **Learner** | A user with role `learner` who browses courses, completes lessons, takes quizzes, and earns badges. |
| **Staff admin** | A user with role `staff_admin` who creates, edits, publishes products/courses and views analytics. |
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

On completion → create a `BadgeAward`.

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

No partner roles in V1. Products are staff-managed; future partner organizations can be added later without exposing partner self-service.

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

Soulbound NFTs, on-chain credentials, partner self-service publishing, paid courses, leaderboards, social profiles, comments, AI-generated lessons, multi-language, mobile app, code execution sandboxes, full LMS grading.

## Success Metrics

- **Primary:** Course completions.
- **Supporting:** Start-to-completion rate, quiz pass rate, wallet-connected learners, avg lesson time, drop-off points, users with ≥1 badge.

## Launch Content

1. **Welcome to Arcium** — intro to Arcium, privacy-preserving computation, ecosystem overview.
2. **Flagship product course** — practical onboarding for one ecosystem product, written for new users.
