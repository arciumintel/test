# Arcademy — Agent Guide

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## What we're building

Arcademy V1: a curated learning platform for Arcium ecosystem products. Prove the core loop — browse → connect wallet → complete lessons → pass quiz → earn off-chain badge.

**Read first:** [docs/PRD.md](docs/PRD.md) (full requirements) · [CONTEXT.md](CONTEXT.md) (domain glossary)

## Hard constraints

- **Audience:** New users first, not developers.
- **Publishing:** Partner self-service is in V1 for partner-submitted drafts, source material, review, and basic reporting. Staff retains final publish approval.
- **Auth:** Solana wallet signature. User anchored to `walletAddress`, not email/password.
- **Credentials:** Off-chain badges in Postgres. No NFT minting in V1.
- **Browsing:** Public catalog without wallet. Wallet required for progress, quizzes, badges, profile.
- **Stack:** Next.js App Router · Vercel · Neon Postgres · Prisma · Cloudinary · shadcn/ui · Tailwind.
- **Roles:** `learner`, `staff_admin`, and limited partner roles for partner self-service.

## Data model (minimum entities)

`User` · `Course` · `Lesson` · `Quiz` · `Question` · `Progress` · `QuizAttempt` · `Badge` · `BadgeAward`

Field definitions and relationships: [docs/PRD.md#core-data-model](docs/PRD.md#core-data-model)

## Completion logic

Course complete when: all required lessons done + final quiz passed + wallet connected → create `BadgeAward`.

## Do not build (V1)

Soulbound NFTs, on-chain verification, paid courses, leaderboards, social features, comments, AI lessons, multi-language, mobile app, code sandboxes, full LMS grading, partner direct publishing without staff approval.

## Acceptance checklist

- [ ] Browse published courses without login
- [ ] Connect Solana wallet
- [ ] Start course, persist lesson progress
- [ ] Pass quiz, receive badge, see badge in profile
- [ ] Staff: CRUD courses/lessons/quizzes, publish, preview, analytics
- [ ] Partners: self-service draft/source submission, review workflow, basic reporting
- [ ] Cloudinary media uploads
- [ ] Production on Vercel + Neon

## UX tone

Official, calm, trustworthy. Plain language. Visible progress. No unnecessary crypto jargon.

## Project layout

Next.js app at the repo root. Product docs in `docs/`. Setup: [`README.md`](README.md).
