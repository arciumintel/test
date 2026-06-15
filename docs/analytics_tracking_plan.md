# Arcademy V1 Analytics Tracking Plan

This plan defines the minimum analytics needed to measure the Arcademy V1 learner funnel, course completion loop, quiz quality, badge verification, and partner-assisted reporting. It uses the PRD terminology for learner-facing concepts while preserving the current implementation reality: existing schema and routes use `Product` and `productId`, which should be treated as the current implementation of `EcosystemProject` and `ecosystemProjectId`.

## Tracking Principles

Analytics should support product decisions, content quality improvements, and manual partner reporting without turning V1 into a partner dashboard or a full LMS reporting system.

Track only what Arcademy needs for V1 acceptance criteria. Avoid storing personal information beyond the wallet-linked learner identity already required for authentication, progress, quiz attempts, and badge awards. Public browsing events should not require a wallet. Wallet-bound learning events should use the internal `userId` when available and may include the `walletAddress` only where the product requirement explicitly depends on wallet verification, such as badge verification.

Use additive instrumentation. If an existing implementation already emits product-oriented event names in the future, do not break dashboards by renaming them in place. Emit the canonical ecosystem-project event names as aliases or add new names alongside old names after review.

## Product Terminology Compatibility

The canonical PRD term is `ecosystemProject`. The current codebase uses `Product`, `/products`, `productSlug`, and `productId`. Analytics should expose PRD-aligned event names and property names while preserving internal compatibility.

Recommended event payloads should include `ecosystemProjectId` and `ecosystemProjectSlug` when presenting the event contract. In the current implementation, these values should be populated from `Product.id` and `Product.slug`. Do not rename schema objects or route parameters just to implement analytics.

## Event Envelope

Every tracked event should use a common envelope so events remain easy to query, export, and debug.

| Property | Type | Required | Notes |
| --- | --- | --- | --- |
| `eventName` | string | yes | One of the canonical event names in this document. |
| `occurredAt` | ISO datetime | yes | Server time is preferred for server actions. Client time is acceptable for page views. |
| `anonymousId` | string | yes for public events | Stable browser/session identifier when available. Do not use fingerprinting. |
| `userId` | string | when signed in | Internal user id. |
| `walletAddress` | string | limited | Use for auth and verification events only when needed. Prefer `userId`. |
| `sessionId` | string | should-have | Browser/session identifier for funnel analysis. |
| `source` | string | yes | `client`, `server_action`, `route_handler`, `admin`. |
| `path` | string | yes | Current pathname, such as `/products/arcium`. |
| `referrer` | string | optional | Browser referrer when available. |
| `utmSource` | string | optional | From query string. |
| `utmMedium` | string | optional | From query string. |
| `utmCampaign` | string | optional | From query string. |
| `utmContent` | string | optional | From query string. |
| `metadata` | object | optional | Event-specific fields not promoted to top-level columns. |

## Core Entity Properties

Use these names consistently across events.

| Property | Notes |
| --- | --- |
| `ecosystemProjectId` | Current implementation source: `Product.id`. |
| `ecosystemProjectSlug` | Current implementation source: `Product.slug`. |
| `ecosystemProjectName` | Current implementation source: `Product.name`. |
| `courseId` | `Course.id`. |
| `courseSlug` | `Course.slug`. |
| `courseTitle` | `Course.title`. |
| `lessonId` | `Lesson.id`. |
| `lessonOrder` | `Lesson.order`. |
| `quizId` | `Quiz.id`. |
| `questionId` | `Question.id`, used only for aggregated quiz quality analysis or answer-level records. |
| `badgeId` | `Badge.id`. |
| `badgeAwardId` | `BadgeAward.id`. |
| `verificationSlug` | Future `BadgeAward.verificationSlug` or equivalent public verification identifier. |

## Public Discovery Events

### `course_catalog_viewed`

Emitted when a public visitor views the course catalog.

Required properties: `path`.

Optional properties: `visibleCourseCount`, `utmSource`, `utmMedium`, `utmCampaign`.

Use this to measure top-of-funnel course discovery without requiring wallet connection.

### `ecosystem_project_viewed`

Emitted when a public visitor views an ecosystem project page. In the current route structure, this maps to `/products/[productSlug]`.

Required properties: `ecosystemProjectId`, `ecosystemProjectSlug`, `path`.

Optional properties: `visibleCourseCount`, `referrer`, UTM fields.

Use this for partner-referred traffic and ecosystem project page performance.

### `ecosystem_project_referral_clicked`

Emitted when a visitor clicks an official ecosystem project link, referral CTA, docs link, website link, or next-step link from an Arcademy ecosystem project page.

Required properties: `ecosystemProjectId`, `ecosystemProjectSlug`, `linkLabel`, `destinationUrl`.

Optional properties: `courseId`, `courseSlug`, `placement`, UTM fields.

Do not track sensitive destination content beyond the URL already present in the staff-managed project page.

### `course_detail_viewed`

Emitted when a visitor views a course detail page.

Required properties: `courseId`, `courseSlug`, `ecosystemProjectId`, `ecosystemProjectSlug`.

Optional properties: `courseLevel`, `estimatedDuration`, `lessonCount`, `hasFinalQuiz`, `hasBadge`, UTM fields.

Use this as the baseline denominator for start-course conversion.

### `start_course_clicked`

Emitted when a learner clicks the start-course CTA before the server confirms progress creation.

Required properties: `courseId`, `courseSlug`, `ecosystemProjectId`, `ecosystemProjectSlug`, `walletConnected`.

Optional properties: `ctaPlacement`.

Use this to measure wallet friction. A click from a signed-out user should be tracked even when the action later returns a wallet-required error.

## Wallet Events

### `wallet_connect_started`

Emitted when a learner begins wallet connection or opens the wallet modal from Arcademy.

Required properties: `path`.

Optional properties: `courseId`, `courseSlug`, `ctaPlacement`, `walletAdapterName`.

### `wallet_connected`

Emitted after Solana signature verification succeeds and a session is created.

Required properties: `userId`, `walletAddress`.

Optional properties: `role`, `courseId`, `courseSlug`, `walletAdapterName`.

Because the user identity is wallet-anchored in V1, this is one of the few events where `walletAddress` is acceptable.

### `wallet_connect_failed`

Emitted when wallet connection, message signing, nonce validation, or signature verification fails.

Required properties: `path`, `failureStage`, `failureReason`.

Optional properties: `courseId`, `courseSlug`, `walletAdapterName`.

Recommended `failureStage` values: `wallet_modal`, `nonce_request`, `signature_request`, `signature_verification`, `session_create`.

Do not store raw signatures, signed messages, nonce values, or provider error blobs.

## Learning Events

### `course_started`

Emitted after the server successfully creates or confirms lesson progress rows for a course.

Required properties: `userId`, `courseId`, `courseSlug`, `ecosystemProjectId`, `ecosystemProjectSlug`.

Optional properties: `createdProgressRowCount`, `firstLessonId`, `alreadyStarted`.

Use this as the canonical course-start metric for completion-rate calculations.

### `lesson_viewed`

Emitted when a wallet-connected or public learner views a lesson page.

Required properties: `courseId`, `courseSlug`, `lessonId`, `lessonOrder`.

Optional properties: `userId`, `ecosystemProjectId`, `ecosystemProjectSlug`, `isCompleted`.

Public lesson access may still be trackable without `userId`; progress and completion remain wallet-gated.

### `lesson_completed`

Emitted after the server successfully marks a lesson complete.

Required properties: `userId`, `courseId`, `courseSlug`, `lessonId`, `lessonOrder`.

Optional properties: `completedLessonCount`, `totalRequiredLessonCount`, `courseCompleted`, `badgeAwarded`.

Current implementation treats published lessons as required. If `Lesson.required` is added later, use only required lessons for completion counts.

### `module_viewed`

Deferred unless modules are implemented. If V1 continues to use ordered lessons only, do not emit this event.

## Quiz Events

The quiz spec makes quiz analytics a V1 must-have: attempt count, pass rate, average score, attempts before pass if feasible, and most-missed questions if feasible.

### `quiz_started`

Emitted when a learner opens the final quiz page or begins answering.

Required properties: `userId`, `courseId`, `courseSlug`, `quizId`, `questionCount`, `passThreshold`.

Optional properties: `attemptNumber`, `previouslyPassed`.

Do not emit for optional lesson-level knowledge checks unless those are explicitly added later with separate non-gating semantics.

### `quiz_submitted`

Emitted after the server stores a quiz attempt.

Required properties: `userId`, `courseId`, `courseSlug`, `quizId`, `quizAttemptId`, `score`, `passed`, `questionCount`, `passThreshold`.

Optional properties: `attemptNumber`, `correctCount`, `incorrectCount`, `courseCompleted`, `badgeAwarded`.

This event should be emitted from the server action that writes `QuizAttempt`, so analytics cannot claim a submission that failed to persist.

### `quiz_passed`

Emitted after a stored quiz attempt passes.

Required properties: `userId`, `courseId`, `courseSlug`, `quizId`, `quizAttemptId`, `score`, `passThreshold`.

Optional properties: `attemptNumber`, `courseCompleted`, `badgeAwarded`.

A later failed attempt must not revoke a previous pass.

### `quiz_failed`

Emitted after a stored quiz attempt fails.

Required properties: `userId`, `courseId`, `courseSlug`, `quizId`, `quizAttemptId`, `score`, `passThreshold`.

Optional properties: `attemptNumber`, `incorrectCount`.

Failure events should support content improvement and should not be used to penalize learners.

### Question-Level Analytics

For V1, selected answers may remain in `QuizAttempt.answers` JSON if that is the smallest safe implementation. If a normalized `QuizAttemptAnswer` table is added later, it should support:

| Property | Notes |
| --- | --- |
| `quizAttemptId` | Parent attempt. |
| `questionId` | Question answered. |
| `selectedAnswer` | Selected option index. |
| `correctAnswer` | Correct option index at submission time, if stored. |
| `correct` | Boolean result. |

Question-level analytics should aggregate most-missed questions and incorrect answer distribution for staff. Do not expose individual learner answer histories publicly or in partner-facing reports.

## Completion and Badge Events

### `course_completed`

Emitted after the completion evaluator determines that all required lessons are complete, the final course quiz has been passed, and the learner is wallet-connected.

Required properties: `userId`, `courseId`, `courseSlug`, `ecosystemProjectId`, `ecosystemProjectSlug`.

Optional properties: `completedLessonCount`, `totalRequiredLessonCount`, `quizId`, `badgeAwarded`.

This event should be idempotent. If completion is recalculated after a learner is already complete, avoid creating duplicate analytics records unless the analytics backend intentionally deduplicates by `userId` and `courseId`.

### `badge_awarded`

Emitted after a `BadgeAward` is created.

Required properties: `userId`, `courseId`, `courseSlug`, `badgeId`, `badgeAwardId`.

Optional properties: `verificationSlug`, `ecosystemProjectId`, `ecosystemProjectSlug`.

This event should only fire when a new award is created, not when an existing award is found.

### `badge_verification_viewed`

Emitted when a public badge verification page is viewed.

Required properties: `badgeAwardId`, `badgeId`, `courseId`, `verificationSlug`, `verificationStatus`.

Optional properties: `ecosystemProjectId`, `ecosystemProjectSlug`.

The public verification page should show only the minimum required data: badge, course, wallet, award date, and verification status.

## Profile Event

### `profile_viewed`

Emitted when a wallet-connected learner views their profile.

Required properties: `userId`.

Optional properties: `inProgressCourseCount`, `completedCourseCount`, `badgeCount`.

Do not emit public profile events in V1 because public social profiles are deferred.

## Admin Events

Admin events should be emitted from server actions after writes succeed. They support staff auditability and launch operations, not partner self-service.

### `admin_ecosystem_project_created`

Required properties: `adminUserId`, `ecosystemProjectId`, `ecosystemProjectSlug`.

Current implementation source: product creation.

### `admin_ecosystem_project_published`

Required properties: `adminUserId`, `ecosystemProjectId`, `ecosystemProjectSlug`, `previousStatus`, `nextStatus`.

Emit when status changes to `published`.

### `admin_course_created`

Required properties: `adminUserId`, `courseId`, `courseSlug`, `ecosystemProjectId`, `ecosystemProjectSlug`.

### `admin_course_published`

Required properties: `adminUserId`, `courseId`, `courseSlug`, `ecosystemProjectId`, `ecosystemProjectSlug`, `previousStatus`, `nextStatus`.

Optional properties: `publishedLessonCount`, `hasFinalQuiz`, `questionCount`, `hasBadge`, `readinessWarningCount`.

### `admin_quiz_created`

Required properties: `adminUserId`, `courseId`, `quizId`.

Optional properties: `passThreshold`, `questionCount`.

### `admin_badge_created`

Required properties: `adminUserId`, `courseId`, `badgeId`.

Optional properties: `hasImage`, `hasCriteria`.

### `partner_report_generated`

Emitted when staff manually generates or exports a partner-facing report.

Required properties: `adminUserId`, `ecosystemProjectId`, `reportPeriodStart`, `reportPeriodEnd`.

Optional properties: `courseCount`, `courseStarts`, `courseCompletions`, `badgeAwards`, `format`.

This event must not imply partner dashboard access. Reports remain staff-generated in V1.

## Derived Metrics

### Primary V1 Success Metric

Verified course completions are counted from completed courses with associated off-chain badge awards. The PRD target is at least 75 completed courses within 90 days after launch.

Recommended query basis: distinct `BadgeAward` rows joined to published courses, with optional validation that a passing final quiz attempt exists for the same user and course.

### Learner Funnel

Measure the learner funnel in this order:

1. `course_detail_viewed`
2. `start_course_clicked`
3. `wallet_connect_started`
4. `wallet_connected`
5. `course_started`
6. `lesson_completed`
7. `quiz_submitted`
8. `quiz_passed`
9. `course_completed`
10. `badge_awarded`

The funnel should support filtering by ecosystem project, course, UTM campaign, and date range.

### Course Metrics

| Metric | Definition |
| --- | --- |
| Course views | Count of `course_detail_viewed`. |
| Starts | Distinct learners with `course_started`, or distinct progress rows by course in the current implementation. |
| Start conversion | `course_started` / `course_detail_viewed`. |
| Completion rate | `course_completed` / `course_started`. |
| Badge awards | New `BadgeAward` rows or `badge_awarded` events. |
| Lesson drop-off | Largest fall between course starts and per-lesson completion counts. |
| Return learning rate | Learners who start more than one course / wallet-connected learners. |

### Quiz Metrics

| Metric | Definition |
| --- | --- |
| Attempt count | Count of `QuizAttempt` rows or `quiz_submitted` events. |
| Pass rate | Distinct learners with at least one passing attempt / distinct learners with attempts. |
| Average score | Average `QuizAttempt.score`. |
| Average attempts before pass | For each learner who passed, count attempts up to first pass, then average. |
| Within-two-attempt pass rate | Learners who pass within two attempts / learners who attempt. |
| Most missed questions | Incorrect count grouped by `questionId`, if answer-level data is available. |

### Ecosystem Project Metrics

| Metric | Definition |
| --- | --- |
| Project views | Count of `ecosystem_project_viewed`. |
| Referred traffic | Views with UTM/referrer data associated with partner placements. |
| Project course starts | `course_started` grouped by `ecosystemProjectId`. |
| Project course completions | `course_completed` grouped by `ecosystemProjectId`. |
| Project badge awards | `badge_awarded` or `BadgeAward` rows grouped through course to product/project. |
| Referral clicks | Count of `ecosystem_project_referral_clicked`. |

## Privacy and Retention

Do not store signed messages, signatures, raw nonces, private wallet adapter errors, or unnecessary personal details. The partner intake process may collect partner contact details for staff operations, but those details should not be mixed into learner analytics.

Public badge verification intentionally exposes a wallet address because wallet-linked verification is a V1 requirement. Other analytics surfaces should prefer internal identifiers and aggregate partner reports.

Retain raw analytics long enough to support launch learning and partner reporting. If retention is not configured in V1, document the default and revisit before production launch.

## Implementation Notes

The current codebase already computes course analytics from relational data in `src/lib/analytics.ts`. That should remain valid while event instrumentation is added. Event tracking should be additive and should not replace durable product records such as `Progress`, `QuizAttempt`, and `BadgeAward`.

For server-side events, emit only after the state-changing write succeeds. For page-view events, client-side emission is acceptable, but public browsing must remain fast and should not block rendering. If an `AnalyticsEvent` table is added, index by `eventName`, `occurredAt`, `userId`, `courseId`, and the current `Product.id` value used as `ecosystemProjectId`.

## V1 Acceptance Checklist

- Public project and course views can be counted without wallet login.
- Course starts, completions, quiz outcomes, and badge awards can be grouped by course.
- Course starts, completions, and badge awards can be grouped by ecosystem project.
- Quiz attempt count, pass rate, average score, attempts before pass, and most-missed questions are available where feasible.
- Wallet connect failures and quiz submission failures can be monitored.
- Badge verification views can be counted after public verification pages exist.
- Staff can manually produce a partner-facing summary without exposing a partner dashboard.
- Analytics implementation does not require renaming `Product`, `productId`, or `/products` routes.
