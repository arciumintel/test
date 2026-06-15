# Arcademy V1 Engineering Implementation Brief

### TL;DR

This brief translates the Arcademy V1 PRD into an engineering-facing implementation guide for coding agents. Agents should use the new PRD as the canonical product source of truth, but must first inspect the existing codebase, schema, routes, components, and deployed functionality before making changes.

Important constraint: some schema and functionality already exist. Agents should preserve working implementation, avoid destructive rewrites, and extend or adapt existing structures wherever feasible. Do not rename, delete, or rebuild existing tables, routes, components, or flows unless there is a clear incompatibility with the canonical PRD and the change is explicitly approved.

---

## Source Documents

Use the following documents as implementation references:

1. Arcademy V1 PRD: Ecosystem Learning Foundation

  * Canonical product source of truth.
  * Defines V1 scope, terminology, personas, partner-assisted model, ecosystem project model, learner experience, badges, analytics, and acceptance criteria.

2. Arcademy V1 Quiz & Assessment Spec

  * Canonical source of truth for quiz behavior.
  * Defines final course quiz model, scoring, retries, question authoring, feedback, analytics, and edge cases.

3. Existing codebase and database schema

  * Canonical source of truth for what has already been implemented.
  * Must be inspected before changes are proposed or applied.

---

## Source-of-Truth Hierarchy

When resolving ambiguity, follow this order:

1. Existing working implementation, unless it conflicts with a must-have V1 requirement.
2. Arcademy V1 PRD: Ecosystem Learning Foundation.
3. Arcademy V1 Quiz & Assessment Spec.
4. This Engineering Implementation Brief.
5. Agent assumptions.

Agents should not make major architectural, schema, or terminology changes based only on inference. If a conflict exists between existing implementation and the PRD, document the conflict and propose the smallest safe change.

---

## Implementation Principles

* Preserve what already works.
* Extend existing schema and functionality instead of replacing it.
* Avoid destructive migrations.
* Avoid wholesale refactors unless explicitly requested.
* Keep V1 staff-managed and partner-assisted.
* Do not build partner self-service in V1.
* Do not build partner login, partner dashboards, partner roles, or partner publishing permissions in V1.
* Do not build on-chain credentials, soulbound NFTs, paid courses, leaderboards, social profiles, or advanced LMS features in V1.
* Use ecosystem project as the canonical learner-facing concept going forward.
* Treat partner as the team, organization, protocol team, project team, or contributor behind an ecosystem project.
* Use product only when referring to a partner’s own product, app, site, tool, or in-product referral surface.
* Prefer incremental pull requests or commits grouped by implementation phase.
* Every change should map back to a PRD requirement, quiz spec rule, or acceptance criterion.

---

## Existing Implementation Preservation Rules

Before coding, agents must inspect and summarize:

* Current database schema and migrations.
* Existing Prisma models or database entities.
* Existing routes and page structure.
* Existing authentication/session implementation.
* Existing wallet connection implementation, if any.
* Existing admin dashboard functionality.
* Existing course, lesson, quiz, progress, or badge functionality.
* Existing media upload functionality.
* Existing analytics or event tracking.
* Existing deployed environment assumptions.

Agents must then classify existing work into:

* Keep as-is.
* Extend.
* Rename only in UI/copy.
* Migrate carefully.
* Defer changing.
* Needs explicit approval.

### Do Not Change Without Approval

Agents should not do any of the following without explicit approval:

* Drop tables or columns.
* Rename database tables or columns that already have data.
* Rewrite authentication from scratch.
* Replace the ORM or database provider.
* Replace the UI framework or routing structure.
* Remove existing public pages.
* Remove existing admin workflows.
* Remove or reset existing seeded content.
* Change wallet identity semantics.
* Convert off-chain badges into on-chain credentials.
* Add partner-facing authentication or self-service tooling.

### Safe Change Pattern

When existing implementation uses older naming such as Product, productId, or product pages, prefer this order:

1. Keep database names unchanged if renaming would be risky.
2. Update user-facing labels to Ecosystem Project.
3. Add code-level aliases or comments to clarify terminology.
4. Add new fields only when needed.
5. Plan database renames only as a dedicated migration after approval.

Example:

* Existing table: Product
* Public UI label: Ecosystem Project
* Internal comment: Product model currently represents an EcosystemProject in V1 terminology.
* Future migration: optional rename from Product to EcosystemProject, only if safe and approved.

---

## Canonical Terminology

### Ecosystem Project

An Arcium-related protocol, application, integration, tool, infrastructure component, service, or product represented through Arcademy learning pages or courses.

Learner-facing examples:

* Ecosystem project page.
* Ecosystem project course.
* Ecosystem project analytics.
* Ecosystem project referral.

### Partner

The team, organization, protocol team, project team, contributor, or sponsor responsible for or associated with an ecosystem project.

Internal/stakeholder examples:

* Partner intake.
* Partner review.
* Partner-assisted workflow.
* Partner referral surfaces.
* Partner reporting.

### Course

A structured learning experience with lessons, completion requirements, and usually one final quiz.

### Badge

An off-chain recognition artifact awarded after course completion and displayed in the learner profile, with a public verification page in V1.

---

## V1 Non-Negotiables

The implementation must support:

* Public ecosystem project discovery.
* Public course discovery.
* Ecosystem project detail pages.
* Course detail pages.
* Solana wallet-based learner identity.
* Wallet-gated progress tracking.
* Staff-managed course and content publishing.
* Lesson viewing and manual lesson completion.
* Final course quiz with single-select multiple-choice questions.
* Quiz scoring, pass/fail logic, retry support, and instructional feedback.
* Course completion based on required lessons plus final quiz pass.
* Off-chain badge awards.
* Badge detail and public verification pages.
* Learner profile with progress and badges.
* Staff admin content management.
* Basic course and ecosystem project analytics.
* Partner-assisted but staff-managed representation workflow.

---

## Explicit V1 Exclusions

Do not implement:

* Partner login.
* Partner dashboard.
* Partner roles.
* Partner self-service authoring.
* Partner publishing permissions.
* Public partner analytics portal.
* Soulbound NFTs.
* On-chain credential minting.
* Paid courses.
* Leaderboards.
* Social profiles.
* Comments or discussion forums.
* AI-generated lessons.
* Multi-language support.
* Mobile app.
* Developer sandbox or code execution.
* Full LMS grading system.
* Timed quizzes.
* Proctored exams.
* Question banks unless explicitly requested.

---

## Recommended Tech Stack

Use the existing stack where already present. If the stack is not fully implemented, use the PRD-recommended stack:

* Next.js App Router.
* Vercel deployment.
* Neon Postgres as source of truth.
* Prisma for schema management and migrations.
* Solana wallet authentication through signature verification.
* Better Auth or Auth.js with custom Solana credentials/signature flow.
* Cloudinary for media assets.
* shadcn/ui and Tailwind CSS for UI.

Do not replace existing working choices unless explicitly approved.

---

## Implementation Discovery Checklist

Before implementing a phase, agents should answer:

* What already exists for this phase?
* Which files, routes, components, models, and server actions are relevant?
* Which PRD requirements are already satisfied?
* Which requirements are partially satisfied?
* Which requirements are missing?
* What is the smallest safe change to close the gap?
* Does the change risk breaking existing behavior?
* Are migrations additive and reversible?
* Are new terms aligned with Ecosystem Project vs Partner terminology?

Agents should provide a short discovery summary before coding.

---

## Domain Model Guidance

The PRD uses EcosystemProject as the canonical V1 concept. However, if the existing schema already uses Product, do not rename the database table automatically.

### Preferred Logical Entities

* EcosystemProject
* Course
* Module, should-have if feasible
* Lesson
* User
* CourseProgress
* LessonProgress
* Quiz
* Question
* QuizAttempt
* QuizAttemptAnswer, should-have if feasible
* Badge
* BadgeAward
* PartnerIntake
* AnalyticsEvent, if not already handled elsewhere

### Existing Schema Compatibility Guidance

If existing schema has:

* Product: treat it as the current implementation of EcosystemProject.
* productId: treat it as ecosystemProjectId semantically.
* Product pages: relabel in UI as Ecosystem Project pages where appropriate.
* Partner fields: preserve them as metadata for the team or organization behind the ecosystem project.

Do not perform table/column renames until:

* Existing data and migrations are reviewed.
* Code references are mapped.
* A migration plan is created.
* Approval is received.

### Additive Fields to Consider

If missing and required by the PRD, consider additive fields such as:

* category
* partnerName
* referralUrl
* status
* courseType
* prerequisiteCourseIds
* required on lessons
* estimatedDuration
* badge criteria
* badge verificationSlug
* partner intake reviewStatus

Add fields only when needed for current phase implementation.

---

## Public Routes

Use existing route structure if already implemented. If not implemented, recommended public routes are:

* / or existing home route
* /projects
* /projects/\[projectSlug\]
* /projects/\[projectSlug\]/courses/\[courseSlug\]
* /courses
* /courses/\[courseSlug\], optional if project-scoped routes are not sufficient
* /profile
* /badges/\[verificationSlug\]

If the current app already uses /products routes, do not break them. Options:

* Preserve /products as backward-compatible routes.
* Add /projects routes as canonical going forward.
* Redirect /products to /projects only if safe.
* Keep route names stable if existing links or implementation depend on them.

---

## Admin Routes

Use existing admin routes if already present. If not implemented, recommended admin routes are:

* /admin
* /admin/projects
* /admin/projects/\[id\]
* /admin/courses
* /admin/courses/\[id\]
* /admin/courses/\[id\]/lessons
* /admin/courses/\[id\]/quiz
* /admin/courses/\[id\]/badge
* /admin/partner-intake, optional/internal
* /admin/analytics

If existing admin routes use /admin/products, preserve them unless a safe alias or redirect is approved. UI labels can still say Ecosystem Projects.

---

## Implementation Phases

### Phase 0: Codebase and Schema Audit

Goal:

* Understand what already exists and avoid breaking implemented work.

Tasks:

* Inspect schema, migrations, routes, components, server actions, auth, admin pages, and seed data.
* Map existing implementation to PRD requirements.
* Identify naming mismatches between Product and Ecosystem Project.
* Identify missing must-have requirements.
* Produce a short gap analysis.

Output:

* Implementation gap summary.
* Safe next-step recommendation.
* No destructive changes.

### Phase 1: Data Model and Terminology Alignment

Goal:

* Align the existing data model with the PRD using additive, low-risk changes.

Tasks:

* Preserve existing tables and relationships.
* Add missing fields needed for ecosystem project pages, courses, badges, progress, quizzes, or partner intake.
* Add status fields where necessary: draft, published, archived.
* Add uniqueness constraints for badge awards if not present.
* Add indexes for public slugs and common lookups.
* Update UI copy to use Ecosystem Project where appropriate.

Avoid:

* Renaming Product table or productId columns without approval.
* Dropping old fields.
* Rewriting existing data.

### Phase 2: Public Ecosystem Project and Course Discovery

Goal:

* Make the public referral-ready learning surface usable.

Tasks:

* Build or extend ecosystem project index.
* Build or extend ecosystem project detail pages.
* Build or extend course catalog.
* Build or extend course detail pages.
* Ensure published/draft/archive visibility rules.
* Ensure pages can be linked from external partner/project sites.

Acceptance focus:

* Public visitors can browse published ecosystem projects and courses without wallet login.
* Draft and unpublished content is not publicly accessible.
* Partner referral URLs are stable.

### Phase 3: Wallet Authentication and Learner Progress

Goal:

* Enable wallet-linked learning state.

Tasks:

* Preserve existing wallet/auth implementation if present.
* Add or complete Solana wallet signature verification.
* Create or retrieve user by wallet address.
* Implement start course behavior.
* Implement manual lesson completion.
* Persist lesson and course progress.
* Add profile baseline with in-progress and completed courses.

Acceptance focus:

* A learner can connect a Solana wallet.
* Progress persists for the same wallet across sessions.
* Public browsing remains available without wallet connection.

### Phase 4: Quiz and Completion Logic

Goal:

* Implement final course assessment and completion rules.

Tasks:

* Use the Quiz & Assessment Spec as source of truth.
* Support one final course quiz per course.
* Support single-select multiple-choice questions.
* Calculate score and pass/fail using configurable threshold.
* Allow retry after failure.
* Store quiz attempts.
* Store selected answers if feasible.
* Compute course completion only after required lessons are complete and final quiz is passed.

Acceptance focus:

* Learner can take final quiz after wallet connection.
* Learner receives pass/fail and feedback.
* Learner can retry after failure.
* Completion does not occur until lesson and quiz requirements are satisfied.

### Phase 5: Badges and Public Verification

Goal:

* Make recognition credible and future-compatible.

Tasks:

* Implement or extend badge definitions.
* Implement off-chain badge awards.
* Ensure badge awarding is idempotent.
* Add learner badge collection to profile.
* Add public badge verification pages.
* Show badge, course, wallet, award date, and verification status.

Acceptance focus:

* Badge is awarded after course completion.
* Duplicate badge awards are prevented.
* Badge appears in profile.
* Public verification page works.

### Phase 6: Staff Admin CMS

Goal:

* Enable staff-managed publishing without engineering intervention.

Tasks:

* Build or extend admin management for ecosystem projects.
* Build or extend admin management for courses.
* Build or extend lesson management.
* Build or extend quiz authoring.
* Build or extend badge management.
* Implement publish/unpublish/archive workflows.
* Add publish readiness warnings.
* Restrict admin access to staff_admin.

Acceptance focus:

* Staff can create, edit, preview where available, publish, unpublish, and archive content.
* Staff can manage lessons, quizzes, and badges.
* Staff cannot accidentally publish incomplete course requirements without warnings.

### Phase 7: Partner-Assisted Workflow and Reporting

Goal:

* Support partner representation without self-service.

Tasks:

* Add partnerName and relevant partner metadata to ecosystem project records if missing.
* Add PartnerIntake tracking only if feasible and useful.
* Add referral URL/copy support where appropriate.
* Add basic ecosystem project analytics.
* Add manual partner reporting support or export if feasible.

Acceptance focus:

* Staff can represent an ecosystem project clearly.
* Staff can track partner intake or review state internally if implemented.
* Staff can provide partners stable URLs and basic performance insights.
* No partner-facing login or dashboard is created.

### Phase 8: Analytics and Launch Hardening

Goal:

* Verify instrumentation, QA, and production readiness.

Tasks:

* Track core learner funnel events.
* Track course and ecosystem project performance.
* Verify wallet failure, quiz failure, and badge award failure handling.
* QA public pages, admin flows, progress, quiz, badge, and verification.
* Seed or validate launch content.
* Validate deployment environment.

Acceptance focus:

* Analytics events are emitted consistently.
* Production deployment works.
* Acceptance criteria from the PRD pass.

---

## Analytics Event Names

Use existing analytics infrastructure if present. If adding events, align with PRD terminology:

* ecosystem_project_viewed
* ecosystem_project_referral_clicked
* course_catalog_viewed
* course_detail_viewed
* start_course_clicked
* wallet_connect_started
* wallet_connected
* wallet_connect_failed
* course_started
* module_viewed
* lesson_viewed
* lesson_completed
* quiz_started
* quiz_submitted
* quiz_passed
* quiz_failed
* course_completed
* badge_awarded
* badge_verification_viewed
* profile_viewed
* partner_report_generated
* admin_ecosystem_project_created
* admin_ecosystem_project_published
* admin_course_created
* admin_course_published
* admin_quiz_created
* admin_badge_created

If existing events use product_viewed or similar names, do not break dashboards. Add aliases or emit both old and new event names only if necessary and safe.

---

## Definition of Done

A phase is done when:

* It satisfies the relevant PRD requirements.
* It does not break existing working functionality.
* It avoids destructive schema changes.
* It includes basic error handling.
* It respects draft/published/archive visibility rules where applicable.
* It preserves staff-managed, partner-assisted scope.
* It does not introduce deferred features.
* It has been manually tested against key happy paths and edge cases.

The full V1 implementation is done when:

* Public users can browse published ecosystem projects and courses.
* Wallet-connected learners can start courses and persist progress.
* Learners can complete required lessons.
* Learners can take and pass final course quizzes.
* Learners can earn off-chain badges.
* Badge verification pages work publicly.
* Learner profile shows progress and badges.
* Staff can manage ecosystem projects, courses, lessons, quizzes, badges, media, and publishing states.
* Staff can view basic course and ecosystem project analytics.
* Partner representation is supported without partner self-service.
* No duplicate badge awards are created.
* Production deployment is stable.

---

## Agent Prompt Template

Use this prompt when assigning work to coding agents:

```text
Use “Arcademy V1 PRD: Ecosystem Learning Foundation” as the canonical product source of truth and “Arcademy V1 Quiz & Assessment Spec” as the quiz source of truth.

Before coding, inspect the existing codebase and summarize what already exists for this task. Some schema and functionality already exist. Preserve working functionality and avoid destructive rewrites.

Important terminology:
- Ecosystem project is the canonical learner-facing entity.
- Partner means the team or organization behind an ecosystem project.
- Product should not be used as the main platform concept unless referring to a partner’s own product/app/site/tool.

Do not build partner login, partner dashboards, partner self-service authoring, on-chain credentials, paid courses, social features, leaderboards, or full LMS features.

For this task:
1. Identify relevant existing files and schema.
2. Map current implementation to PRD requirements.
3. Propose the smallest safe implementation plan.
4. Implement only the approved/specified scope.
5. Preserve existing routes and database tables unless a safe migration is explicitly required.
6. Validate against the relevant acceptance criteria.

```

---

## Recommended Repo Docs

If not already present, maintain these files in the repository:

* docs/prd-ecosystem-learning-foundation.md
* docs/quiz-assessment-spec.md
* docs/engineering-implementation-brief.md
* docs/agent-instructions.md
* docs/acceptance-criteria.md
* docs/analytics-tracking-plan.md
* docs/partner-intake-template.md

If only one repo-facing file is created for agents, use this Engineering Implementation Brief or a condensed agent-instructions file derived from it.

---

## Immediate Next Step

Before feature work begins, run Phase 0: Codebase and Schema Audit.

Expected output:

* Current schema summary.
* Existing route summary.
* Existing admin functionality summary.
* Existing learner functionality summary.
* Existing wallet/auth summary.
* Existing quiz/badge/progress summary.
* Gaps against the new PRD.
* Recommended first implementation phase.
* List of items that should not be changed without approval.