# Arcademy V1 PRD

## Summary

Arcademy is the official learning platform for Arcium ecosystem products. V1 should prove that users can learn intimidating ecosystem concepts through structured courses, complete assessments, and receive trustworthy recognition tied to their Solana wallet.

V1 should launch as a curated learner MVP, not a full partner self-service platform. Arcademy staff will create and publish the first 1-2 courses, with public course browsing and wallet-gated progress, quizzes, completion records, and badges.

## Product Direction

Arcademy serves new users first. Developer education remains important, but should come after the core learning loop is validated.

The v1 user journey:

1. User visits Arcademy and browses available courses.
2. User views course overview, lessons, difficulty, estimated time, and completion reward.
3. User connects a Solana wallet to start tracking progress.
4. User completes lessons and quizzes.
5. User earns an off-chain badge stored in Arcademy.
6. User can view completed courses and badges in their profile.
7. Arcademy staff can see course completion and quiz performance.

Primary success metric:

- Course completions.

Supporting metrics:

- Course start-to-completion rate.
- Quiz pass rate.
- Wallet-connected learner count.
- Average lesson completion time.
- Drop-off point per course.
- Number of users earning at least one badge.

## V1 Scope

Build:

- Public course catalog.
- Course detail pages.
- Lesson reading/viewing experience.
- Quiz flow with pass/fail logic.
- Solana wallet login.
- Learner profile with progress and earned badges.
- Off-chain completion badges.
- Staff-only admin dashboard for creating/editing courses, lessons, quizzes, and viewing learner analytics.
- Cloudinary-backed image/media uploads for course assets.
- Neon Postgres database for users, wallets, courses, lessons, quizzes, attempts, progress, and badges.
- Vercel deployment.

Defer:

- Partner self-service course creation.
- Soulbound NFT minting.
- On-chain credential verification.
- Public partner analytics portals.
- Complex certification paths.
- Paid courses.
- Leaderboards.
- Social profiles.
- Comments/discussions.
- AI-generated lessons.
- Multi-language support.
- Mobile app.
- Advanced developer sandboxes or code execution.
- Full LMS-style grading system.

## Recommended Tech Stack

Use Next.js App Router on Vercel for the web app, API routes/server actions, authentication flow, and admin surfaces.

Use Neon Postgres as the source of truth.

Suggested ORM:

- Prisma

Prisma is recommended because it gives clear schema management, migrations, and strong TypeScript ergonomics.

Use Solana wallet authentication with wallet signature verification. A user account should be anchored to a wallet address, not email/password.

Session handling can use one of:

- Better Auth with a custom Solana credentials/signature flow.
- Auth.js with a custom Solana credentials/signature flow.

Use Cloudinary for:

- Lesson images.
- Partner logos.
- Course thumbnails.
- Rich media assets.

Store only Cloudinary asset references in Postgres.

Use shadcn/ui and Tailwind CSS for fast, consistent product UI.

Minimum roles:

- `learner`
- `staff_admin`

Do not add partner roles in v1 unless needed internally. Design the schema so partner organizations can be added later without rewriting course ownership.

## Core Data Model

Minimum entities:

### User

Stores learner/admin identity.

Fields:

- `id`
- `walletAddress`
- `displayName`
- `role`
- `createdAt`
- `updatedAt`

### Course

Represents a published or draft course.

Fields:

- `id`
- `title`
- `slug`
- `partnerName`
- `summary`
- `level`
- `status`
- `thumbnailUrl`
- `estimatedDuration`
- `createdAt`
- `updatedAt`

### Lesson

Represents one ordered learning unit inside a course.

Fields:

- `id`
- `courseId`
- `title`
- `order`
- `content`
- `mediaUrl`
- `status`
- `createdAt`
- `updatedAt`

### Quiz

Represents an assessment for a course or lesson.

Fields:

- `id`
- `courseId`
- `lessonId`
- `passThreshold`
- `createdAt`
- `updatedAt`

### Question

Represents one quiz question.

Fields:

- `id`
- `quizId`
- `prompt`
- `answerOptions`
- `correctAnswer`
- `explanation`
- `createdAt`
- `updatedAt`

### Progress

Tracks learner progress through a course.

Fields:

- `id`
- `userId`
- `courseId`
- `lessonId`
- `completed`
- `completedAt`
- `createdAt`
- `updatedAt`

### QuizAttempt

Stores quiz submissions and outcomes.

Fields:

- `id`
- `userId`
- `quizId`
- `score`
- `passed`
- `submittedAt`

### Badge

Defines a course completion badge.

Fields:

- `id`
- `courseId`
- `name`
- `description`
- `imageUrl`
- `createdAt`
- `updatedAt`

### BadgeAward

Stores awarded badges.

Fields:

- `id`
- `userId`
- `badgeId`
- `courseId`
- `awardedAt`

## Completion Logic

A user completes a course when:

1. All required lessons are marked complete.
2. The final quiz is passed.
3. The user has a connected Solana wallet.

When the completion requirements are met, Arcademy creates a `BadgeAward`.

V1 badges are off-chain. They are stored in Postgres and displayed in the learner profile.

## Admin Requirements

The staff dashboard should support:

- Create courses.
- Edit courses.
- Archive courses.
- Create lessons.
- Edit lessons.
- Reorder lessons.
- Add course thumbnails.
- Add lesson media through Cloudinary.
- Create quizzes.
- Create multiple-choice questions.
- Set quiz passing threshold.
- Preview course as a learner.
- Publish courses.
- Unpublish courses.
- View course analytics.

V1 analytics should include:

- Course starts.
- Course completions.
- Quiz pass rate.
- Average quiz score.
- Drop-off lesson.
- Badge awards.

Avoid building a complex partner dashboard in v1. Staff can manually create the first partner courses after collecting content from ecosystem teams.

## UX Requirements

Public users can browse courses without connecting a wallet.

Wallet connection is required to:

- Start a course.
- Save progress.
- Take quizzes.
- Earn badges.
- View learner profile.

The learner experience should feel official, calm, and trustworthy.

Avoid unnecessary crypto jargon.

Use:

- Plain explanations.
- Visible progress.
- Clear lesson sequencing.
- Helpful quiz feedback.
- Course pages that explain what the user will learn.

Each course should clearly show:

- What the user will learn.
- Who the product/course is from.
- Estimated time.
- Difficulty.
- Wallet requirement for tracked progress.
- Badge earned on completion.

## Non-Goals

V1 is not:

- A marketplace.
- A complete LMS.
- A partner-operated publishing platform.
- An NFT credentialing product.
- A developer sandbox.
- A social learning network.

The first release should not attempt to prove that every Arcium ecosystem product can self-serve course creation.

The first release should prove that Arcademy can produce official learning experiences users complete and trust.

## Risks And Solutions

### Risk: Scope creep

Trying to serve learners, partners, staff, and developers equally could make v1 too large.

Solution:

- V1 focuses on new users and staff-curated courses.

### Risk: NFT credentials slow down launch

Soulbound NFTs introduce smart contract, wallet, cost, testing, and support complexity.

Solution:

- Use off-chain badges now.
- Design badge awards so NFT minting can be added later.

### Risk: Partner content quality varies

Partner-created content may be too technical, inconsistent, or unclear.

Solution:

- Arcademy staff owns publishing in v1.
- Create a repeatable course template partners must follow.

### Risk: Wallet login adds friction

Some users may hesitate to connect a wallet before understanding the value.

Solution:

- Allow public browsing.
- Require wallet connection only for progress, quizzes, and credentials.

### Risk: Analytics expectations become too broad

Partners may eventually want deep reporting.

Solution:

- V1 analytics should answer only whether users start, finish, pass, and where they drop off.

## Suggested First Courses

Recommended launch set:

### 1. Welcome to Arcium

A short introductory course explaining:

- What Arcium is.
- Why privacy-preserving computation matters.
- How the ecosystem works.
- What users can do next.

### 2. Flagship Partner/Product Course

A practical onboarding course for a specific Arcium ecosystem product.

This course should be written for new users rather than developers.

It should explain:

- What the product does.
- Why it matters.
- How to use it.
- Common beginner mistakes.
- What successful completion means.

## Acceptance Criteria

V1 is ready when:

- A new visitor can browse published courses without logging in.
- A learner can connect a Solana wallet.
- A learner can start a course.
- Lesson progress persists across sessions.
- A learner can complete all required lessons.
- A learner can pass a quiz.
- A badge is awarded after completion.
- The badge appears in the learner profile.
- Staff can create, edit, preview, and publish a course.
- Staff can create lessons and quizzes.
- Staff can view completion and quiz analytics.
- Course media can be uploaded or selected through Cloudinary.
- Production deployment works on Vercel with Neon Postgres.

## Assumptions

- V1 prioritizes new users, not developers.
- V1 launches with 1-2 curated courses.
- Arcademy staff creates and publishes course content.
- Recognition is off-chain badges first, not soulbound NFTs.
- Solana wallet login is required for tracked progress and credentials.
- Partner dashboards and self-service authoring are deferred.
- Vercel, Neon Postgres, and Cloudinary are fixed infrastructure choices.
