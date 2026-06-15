# Arcademy V1 PRD: Ecosystem Learning Foundation

### TL;DR

Arcademy V1 is the official learning foundation for the Arcium ecosystem: a curated platform where users can discover ecosystem products, complete structured learning paths, pass lightweight assessments, and earn trustworthy wallet-linked recognition. This release moves beyond a minimal MVP by launching a more complete product, course, badge, admin, analytics, and partner representation foundation while still avoiding full partner self-service.

The core product bet is that ecosystem products will refer users to Arcademy if Arcademy helps them educate users faster, reduce onboarding friction, present their product in a credible official context, and provide meaningful completion signals. V1 should make Arcademy valuable to learners, useful to Arcium ecosystem partners, and operationally manageable for Arcademy staff.

---

## Summary

Arcademy exists to make Arcium ecosystem learning more approachable, structured, measurable, and trustworthy. Users who encounter Arcium or ecosystem products may face fragmented documentation, technical terminology, and unclear onboarding paths. Ecosystem products, in turn, need a credible place to send users who require education before they can meaningfully adopt or understand the product.

Arcademy V1 should launch as an ecosystem learning foundation, not a bare MVP and not a full partner-operated LMS. It should provide enough depth to feel like the official education layer for the ecosystem while preserving delivery discipline through staff-managed content, curated partner/product representation, wallet-linked progress, final course assessments, and off-chain credentials.

V1 should support:

* Public product and course discovery.
* Staff-managed product pages for ecosystem partners and flagship products.
* Structured courses with modules, lessons, final quizzes, and optional knowledge checks if feasible.
* Wallet-linked learner progress and profiles.
* Off-chain badges with public verification pages.
* Staff admin workflows for products, courses, lessons, quizzes, badges, media, and analytics.
* Basic partner/product performance reporting managed by Arcademy staff.

Arcademy should make a clear case to ecosystem partners: referring users to Arcademy improves onboarding quality, reduces education burden, provides official learning experiences, generates measurable completion data, and creates a repeatable path for user activation without requiring partners to build their own education infrastructure.

---

## Strategic Context

Arcium’s ecosystem will become easier to adopt if users can learn key concepts and project workflows through a trusted, guided experience. For many users, ecosystem education is not a separate activity from onboarding; it is a prerequisite for adoption.

**Terminology note:** Throughout this document, “ecosystem project” refers to any Arcium-related protocol, application, integration, tool, infrastructure component, service, or product represented through Arcademy learning pages or courses. “Partner” refers to the team, organization, protocol team, project team, or contributor responsible for or associated with an ecosystem project. V1 is partner-assisted and staff-managed: partners provide source material and factual review, while Arcademy staff owns publishing and learner-facing quality.

Arcademy should serve three strategic functions:

* Learner education: help users understand Arcium concepts and ecosystem products in plain language.
* Partner enablement: give ecosystem products a trusted destination for educating and onboarding users.
* Ecosystem intelligence: produce data on what users start, complete, misunderstand, and value.

V1 should establish Arcademy as the official learning layer rather than simply proving a narrow course-completion loop. However, V1 should still avoid the complexity of full partner self-service, on-chain credentialing, paid courses, developer sandboxes, and advanced LMS features.

---

## Product Vision

Arcademy becomes the trusted education and onboarding layer for the Arcium ecosystem.

For learners, Arcademy provides a guided path from curiosity to understanding to recognized completion.

For ecosystem partners, Arcademy provides a professional, official, measurable onboarding surface that they can confidently reference from their own products, docs, communities, and campaigns.

For Arcium, Arcademy creates a scalable foundation for ecosystem education, content governance, learner recognition, and future credentialing.

---

## Goals

### Business Goals

* Launch Arcademy as a credible ecosystem learning foundation with 3–5 published product pages and 3–5 curated courses.
* Drive at least 250 course starts and 75 course completions within the first 90 days after launch, assuming reasonable ecosystem distribution.
* Secure at least 2 ecosystem product or partner referrals into Arcademy from product websites, documentation, onboarding flows, Discord, newsletters, or launch campaigns.
* Enable Arcademy staff to publish and update product/course content without engineering support for routine content changes.
* Establish a reusable partner-assisted content workflow that allows ecosystem teams to provide source material while Arcademy maintains learner-facing quality.

### User Goals

* Understand Arcium and ecosystem products through clear, structured, beginner-friendly learning experiences.
* Discover relevant ecosystem products and courses before connecting a wallet.
* Track progress across courses after wallet connection.
* Complete lessons, pass assessments, and earn recognition without unnecessary friction.
* View and share credible badges that represent completed learning.

### Partner Goals

* Send users to a trusted official learning destination instead of maintaining separate onboarding content alone.
* Help users understand the product’s purpose, use cases, and beginner workflows.
* Improve user activation by reducing conceptual and practical onboarding friction.
* Receive basic insight into starts, completions, quiz performance, and badge awards for product-related courses.
* Benefit from consistent Arcademy editorial standards, learning design, and official ecosystem positioning.

### Non-Goals

* Build a full LMS, marketplace, partner-operated publishing platform, or social learning network.
* Launch partner self-service authoring, partner login, partner roles, or public partner dashboards in V1.
* Mint on-chain credentials or soulbound NFTs in V1.
* Support paid courses, advanced developer sandboxes, AI-generated lessons, mobile apps, multilingual content, or high-stakes certification exams in V1.

---

## Product Hypotheses

* If Arcademy provides official structured learning paths, users will be more likely to complete ecosystem education than if they rely on fragmented documentation alone.
* If learners can browse course value before connecting a wallet, wallet friction will decrease and connection quality will improve.
* If badges include clear criteria, wallet association, and public verification pages, off-chain recognition will be credible enough for V1.
* If ecosystem products receive high-quality staff-curated product pages and courses, they will be willing to refer users to Arcademy even without partner self-service tooling.
* If Arcademy provides basic partner/product analytics, ecosystem teams will see Arcademy as an onboarding service, not just a content repository.

---

## Personas

### New Arcium Ecosystem Learner

A curious user who has heard about Arcium or an ecosystem product but does not yet understand the concepts, terminology, or practical value. This user may be crypto-aware but should not be assumed to be a developer.

Needs:

* Plain-language explanations.
* Structured learning paths.
* Public browsing before wallet connection.
* Visible progress and clear completion requirements.
* Trustworthy recognition tied to wallet identity.

### Product-Interested User

A user referred by an ecosystem product, campaign, documentation page, community post, or partner onboarding flow. This user wants to understand a specific product well enough to try it, use it, or explain its value.

Needs:

* Product-specific learning path.
* Clear explanation of what the product does and who it is for.
* Practical onboarding steps.
* Common beginner mistakes and best practices.
* Next steps after course completion.

### Ecosystem Partner Contributor

A product team in the Arcium ecosystem that wants users to understand its product and may refer users to Arcademy as an onboarding and education destination.

Needs:

* Accurate, polished representation of its product.
* Simple content intake process.
* Review/approval touchpoint before publication.
* Referral-ready course and product pages.
* Basic reporting on learner engagement and completion.

### Arcademy Staff Admin

An internal operator responsible for managing products, courses, lessons, quizzes, badges, content quality, publishing workflow, and analytics.

Needs:

* Efficient content management.
* Clear draft, preview, publish, unpublish, and archive states.
* Media upload and management.
* Course and quiz quality controls.
* Analytics that support content improvement and partner reporting.

---

## User Stories

### New Arcium Ecosystem Learner

* As a learner, I want to browse products and courses without connecting a wallet, so that I can understand Arcademy’s value before authenticating.
* As a learner, I want course pages to explain what I will learn, how long it will take, and what badge I can earn, so that I can choose the right course.
* As a learner, I want lessons to be sequenced clearly, so that I always know what to do next.
* As a learner, I want quizzes to provide helpful explanations, so that mistakes help me learn.
* As a learner, I want earned badges to appear in my profile, so that I can track and share my progress.

### Product-Interested User

* As a referred user, I want to land on a product-specific course page, so that I can quickly understand the product I came to learn about.
* As a referred user, I want beginner-friendly product explanations, so that I can understand the value without reading technical documentation first.
* As a referred user, I want a clear next step after completing a product course, so that I know how to continue into the product experience.

### Ecosystem Partner Contributor

* As a partner, I want Arcademy to present my product clearly and professionally, so that I can refer users with confidence.
* As a partner, I want to provide source material to Arcademy staff, so that the course accurately reflects our product without requiring us to operate the platform.
* As a partner, I want a review step before publication, so that factual product information is correct.
* As a partner, I want basic reporting on course starts, completions, and quiz results, so that I can understand whether education is supporting onboarding.
* As a partner, I want a stable course URL, so that I can link to Arcademy from docs, product onboarding, campaigns, and community channels.

### Arcademy Staff Admin

* As a staff admin, I want to create and manage product pages, so that Arcademy can represent ecosystem products consistently.
* As a staff admin, I want to create structured courses with lessons, quizzes, badges, and media, so that learners have a complete guided experience.
* As a staff admin, I want publish readiness checks, so that incomplete or low-quality courses do not go live.
* As a staff admin, I want analytics by product and course, so that I can improve content and support partner conversations.

---

## Functional Requirements

### Public Product and Course Discovery, Priority: Must-Have

* Ecosystem Project Index: Users can browse a public list of Arcium ecosystem projects represented in Arcademy.
* Ecosystem Project Detail Pages: Users can view project overview, logo, category, description, key links, associated courses, and recommended next actions.
* Course Catalog: Users can browse courses across projects and learning categories.
* Course Detail Pages: Users can view course title, summary, difficulty, estimated duration, module/lesson list, project association, wallet requirement, badge reward, and completion requirements.
* Referral-Friendly URLs: Project and course pages should have stable URLs suitable for partners to link from docs, project flows, newsletters, Discord, or marketing pages.
* Public Access Before Wallet: Users can browse project pages, course pages, and badge details without connecting a wallet.

### Course and Content Model, Priority: Must-Have

* Course Structure: Courses support ordered lessons and may support modules if implementation remains manageable.
* Required Lessons: Staff can designate lessons as required for completion.
* Optional Lessons: Staff can designate optional lessons if needed for richer learning paths.
* Rich Content: Lessons support text, images, embedded media references, and links.
* Course Metadata: Courses include level, estimated duration, product association, status, thumbnail, and completion badge.
* Course Prerequisites: Staff can optionally indicate recommended prerequisite courses as informational guidance, not hard gating in V1.
* Course Templates: Staff should follow repeatable templates for foundational courses and product onboarding courses.

### Wallet-Based Learner Identity, Priority: Must-Have

* Solana Wallet Login: Users authenticate through Solana wallet signature verification.
* Wallet-Anchored Account: A learner account is anchored to a wallet address rather than email/password.
* Session Persistence: Learners can return later and recover progress after reconnecting the same wallet.
* Minimum Roles: The system supports learner and staff_admin roles.
* Partner Roles Deferred: Partner roles are not exposed in V1.

### Learning Experience, Priority: Must-Have

* Lesson Viewing: Learners can read or view lesson content within a course.
* Visible Progress: Learners can see completed lessons, remaining lessons, quiz status, and overall completion state.
* Manual Lesson Completion: Learners explicitly mark lessons complete in V1.
* Flexible Navigation: Learners can navigate freely, but course completion requires all required lessons and assessment requirements.
* Continue Learning: Learners can resume in-progress courses from their profile.

### Quiz and Assessment, Priority: Must-Have

* Final Course Quiz: Each completable course has one required final quiz.
* Multiple-Choice Questions: V1 supports single-select multiple-choice questions.
* Passing Threshold: Staff can set a passing threshold per quiz.
* Quiz Retakes: Learners can retry after failure with no cooldown in V1.
* Quiz Feedback: Learners receive pass/fail state, score, and instructional explanations after submission.
* Question-Level Analytics: If feasible, store selected answers to identify most-missed questions.

### Optional Knowledge Checks, Priority: Should-Have If Time Permits

* Lightweight Lesson Checks: Staff can add non-required knowledge checks within lessons if implementation remains simple.
* No Completion Gating: Optional knowledge checks should not block badge completion in V1.
* Instructional Purpose: Knowledge checks are used to reinforce learning, not to grade learners.

### Completion, Badges, and Verification, Priority: Must-Have

* Completion Rule: A course is complete when all required lessons are marked complete, the final quiz is passed, and the learner has a connected wallet.
* Off-Chain Badge Award: Arcademy creates an off-chain BadgeAward after completion.
* Badge Detail Page: Each badge has a detail page explaining issuer, course, completion criteria, and badge meaning.
* Public Verification Page: Each awarded badge has a public verification URL that confirms wallet, course, badge, and awarded date.
* Idempotent Awarding: The system prevents duplicate badge awards for the same user, course, and badge.
* Future Credential Compatibility: Badge metadata should be structured so on-chain credentials can be added later.

### Learner Profile, Priority: Must-Have

* Profile Overview: Learners can view connected wallet address, in-progress courses, completed courses, earned badges, and completion dates.
* Badge Collection: Learners can view all earned badges.
* Badge Sharing: Learners can access a shareable verification link for each badge.
* Recommended Next Courses: Learners can see basic recommendations, such as related product courses or next foundational course.
* Social Profile Deferred: Public social profiles, followers, comments, and reputation systems are deferred.

### Partner Representation Without Full Self-Service, Priority: Must-Have

* Staff-Managed Ecosystem Project Pages: Arcademy staff creates and maintains partner/project pages in V1.
* Partner Attribution: Ecosystem project pages clearly identify the ecosystem project, logo, official links, and relevant context.
* Partner Content Intake: Arcademy provides a lightweight intake process for partners to submit project information, links, screenshots, learning goals, common user questions, and suggested next steps.
* Arcademy Editorial Ownership: Arcademy staff owns final learner-facing course structure, tone, clarity, and publication quality.
* Partner Review Step: Partners can review factual project details before publication, without receiving direct publishing permissions.
* Referral Toolkit: Arcademy provides partners with stable URLs, suggested referral copy, and recommended placements for linking to Arcademy.
* Ecosystem Project Analytics: Staff can view and share basic project/course performance metrics with partners manually.
* Partner Self-Service Deferred: Partners do not log in, edit content, publish courses, or access dashboards in V1.

### Staff Admin Content Management, Priority: Must-Have

* Ecosystem Project Management: Staff can create, edit, publish, unpublish, and archive ecosystem projects.
* Course Management: Staff can create, edit, preview, publish, unpublish, and archive courses.
* Lesson Management: Staff can create, edit, reorder, and manage lesson content.
* Quiz Management: Staff can create final course quizzes, add questions, set correct answers, define explanations, and set passing thresholds.
* Badge Management: Staff can create badge name, description, image, criteria, and course association.
* Media Management: Staff can upload or select project logos, course thumbnails, lesson images, and badge images through Cloudinary.
* Publish Readiness Checks: Staff receives warnings for missing quiz, missing badge, empty lessons, missing thumbnail, missing explanations, or unpublished project association.

### Analytics and Reporting, Priority: Must-Have

* Course Analytics: Starts, completions, completion rate, quiz pass rate, average score, average attempts before pass, and drop-off lesson.
* Ecosystem Project Analytics: Course starts, completions, and badge awards grouped by ecosystem project.
* Learner Funnel: Track course view, start click, wallet connection, course start, lesson completion, quiz submission, course completion, and badge award.
* Partner Reporting Export: Staff can manually produce or export a basic partner-facing summary if feasible.
* Advanced Dashboards Deferred: Public partner dashboards and partner self-serve analytics are deferred.

---

## Partner Value Proposition

Arcademy should make the case that ecosystem products benefit from referring users to Arcademy because it improves education quality and reduces partner burden.

### Why Partners Should Refer Users to Arcademy

* Official Context: Arcademy presents partner-referenced ecosystem projects within the broader Arcium ecosystem, increasing credibility and trust.
* Better Onboarding: Structured courses help users understand the project before or during first use.
* Reduced Support Burden: Beginner education can reduce repetitive questions in Discord, docs, and support channels.
* Higher Activation Quality: Users who complete a project course are more likely to understand the project’s value and next steps.
* Measurable Learning: Partners can receive basic signals on course starts, completions, quiz performance, and badge awards.
* Professional Content Quality: Arcademy staff translates technical project material into clear learner-facing content.
* Recognition Layer: Wallet-linked badges give users a reason to complete onboarding and create a visible achievement.
* Future Credential Path: Off-chain badges create a foundation for future on-chain credentials or ecosystem reputation.

### Partner Referral Surfaces

Partners should be encouraged to link to Arcademy from:

* Project documentation.
* Onboarding checklists.
* In-app education prompts.
* Discord welcome flows.
* Community announcements.
* Blog posts and launch campaigns.
* Help center articles.
* Ecosystem pages.

### Partner-Assisted Workflow

1. Partner identifies an ecosystem project, feature, or onboarding topic that users need to understand.
2. Partner submits source material using an Arcademy intake template.
3. Arcademy staff converts source material into a beginner-friendly project page and course outline.
4. Partner reviews factual accuracy.
5. Arcademy staff publishes the project page and course.
6. Partner refers users to the stable Arcademy URL.
7. Arcademy staff monitors engagement and shares basic performance insights.
8. Course content is iterated based on analytics and partner feedback.

### Partner Intake Template

Each partner/product submission should include:

* Project name.
* Project logo and approved brand assets.
* Short project description.
* Target user segment.
* Primary user problem solved.
* Top 3–5 concepts users need to understand.
* Common beginner questions.
* Common beginner mistakes.
* Key project links.
* Desired user action after completing the course.
* Subject matter expert contact.

---

## User Experience

### Entry Point and First-Time User Experience

* Users may arrive through Arcademy homepage, ecosystem navigation, project pages, partner referrals, direct course URLs, documentation links, or community campaigns.
* Public users can browse project and course information without connecting a wallet.
* Project pages should explain what the project does, why it matters, who it is for, and which courses help users get started.
* Course pages should clearly show learning outcomes, estimated duration, difficulty, completion requirements, and badge reward.
* Wallet connection should be introduced only when the user wants to start a course, save progress, take a quiz, earn a badge, or access their profile.

### Core Experience

* Step 1: User discovers a project or course. The user may come from Arcademy browsing or from a partner referral. The page should immediately confirm that Arcademy is the official learning destination. Partner/project context should be visible and credible.
* Step 2: User reviews course value. The user sees what they will learn, how long the course takes, what level it is, and what badge they can earn. The user sees whether the course is foundational, project-specific, or builder-oriented. The user can browse before connecting a wallet.
* Step 3: User connects wallet to begin. Wallet connection is requested at the point of tracked action. The system explains that wallet connection saves progress and associates completion recognition with the learner. If wallet connection fails, the user remains on the same page with a retry path.
* Step 4: User completes lessons. Lessons are ordered and clearly marked complete or incomplete. Learners manually mark required lessons complete. Optional lessons, if present, are clearly labeled and do not block completion.
* Step 5: User completes assessment. Learner takes the final course quiz. Learner receives score, pass/fail result, and explanations. Learner can retry after failure.
* Step 6: User earns recognition. When requirements are complete, the badge is awarded. Learner sees a completion state and can view the badge detail or verification page.
* Step 7: User continues. Learner can return to profile, view related courses, follow project next steps, or share the badge verification link.

### Advanced Features and Edge Cases

* If a user is referred to a product course that is unpublished, show a graceful unavailable state or redirect to product page.
* If a course changes after learners have started, preserve existing progress and do not revoke completed badges.
* If a badge award fails, completion logic should be retryable and idempotent.
* If a partner requests a content change after publication, staff should update content through normal admin workflow and avoid breaking learner progress.
* If a learner passes a quiz before completing all required lessons, quiz pass is stored but badge is not awarded until lessons are complete.

### UI/UX Highlights

* Official, calm, trustworthy visual tone.
* Clear Arcium and Arcademy branding.
* Project pages that look credible enough for partners to link publicly.
* Plain language over crypto-native jargon.
* Visible progress throughout learning.
* Accessible forms, clear error states, readable contrast, and responsive web design.
* Badge pages that feel credible even before on-chain credentialing exists.

---

## Narrative

A user discovers an Arcium ecosystem product through a partner announcement. The product sounds promising, but the user is unsure what privacy-preserving computation means, how the product fits into the ecosystem, or what steps to take first. Instead of sending the user into scattered documentation, the product links directly to its Arcademy learning page.

The user lands on a polished product page that explains the product in plain language, shows official links, and recommends a short onboarding course. Before connecting a wallet, the user can see what the course covers, how long it takes, and what badge they can earn. Once the value is clear, they connect a Solana wallet to save progress.

The course guides the learner through short lessons, examples, and a final quiz. Quiz feedback helps the learner correct misunderstandings without feeling punished. After completing the required lessons and passing the quiz, the user receives an off-chain badge with a public verification page.

The partner benefits because users now have a trusted path to understand the product before asking for support or dropping off. Arcademy benefits because it becomes the measurable education layer for the ecosystem. Arcium benefits because ecosystem learning becomes more consistent, credible, and scalable.

---

## Success Metrics

Primary success metric:

* Verified course completions: at least 75 completed courses within 90 days after launch, assuming reasonable ecosystem distribution.

### User-Centric Metrics

* Course start-to-completion rate: target 30% or higher among learners who start a course.
* Wallet connection rate: target 25% or higher from users who click Start Course.
* Quiz pass rate: target 60% or higher within two attempts.
* Badge verification views: track visits to public badge verification pages.
* Return learning rate: target 15% or higher of wallet-connected learners starting more than one course.

### Partner-Centric Metrics

* Partner referral count: at least 2 ecosystem products link to Arcademy within the first 90 days.
* Partner-referred traffic: track course/product visits using UTM parameters or referral metadata.
* Product course starts: track starts grouped by product.
* Product course completions: track completions grouped by product.
* Partner satisfaction: collect qualitative feedback from partner teams after first reporting cycle.

### Business Metrics

* Launch catalog: 3–5 product pages and 3–5 courses live at launch or within the first launch window.
* Staff publishing independence: staff can publish routine product/course updates without engineering support.
* Content production cycle time: partner-assisted course can move from intake to publication within 1–2 weeks after source material is complete.

### Technical Metrics

* Production availability: 99% uptime target during first 30 days.
* Data integrity: no duplicate badge awards for the same user, badge, and course.
* Wallet flow reliability: monitor wallet connect failure and quiz submission failure rates.
* Page performance: public product and course pages should load smoothly and not be blocked by wallet scripts.

### Tracking Plan

Track the following events:

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

---

## Technical Considerations

### Technical Needs

* Web application supporting public browsing, wallet authentication, course learning, quizzes, badge pages, learner profiles, and staff admin workflows.
* Server-side routes or actions for authentication, progress, quiz submission, completion calculation, badge award, and analytics events.
* Database models for products, courses, modules if used, lessons, quizzes, questions, attempts, users, progress, badges, badge awards, partner intake metadata, and analytics.
* Media upload and asset management for product logos, course thumbnails, lesson media, and badge images.
* Admin dashboard with role-based access control for staff_admin users.

### Recommended Stack

* Next.js App Router deployed on Vercel.
* Neon Postgres as source of truth.
* Prisma for schema management, migrations, and TypeScript ergonomics.
* Solana wallet authentication through signature verification.
* Better Auth or Auth.js with custom Solana credentials/signature flow.
* Cloudinary for media assets.
* shadcn/ui and Tailwind CSS for fast, consistent UI.

### Integration Points

* Solana wallets for authentication and wallet-linked identity.
* Cloudinary for image and media storage.
* Vercel for deployment.
* Neon Postgres for persistent data.
* Partner referral links using UTM parameters or simple referral metadata.
* Future integration path for on-chain credentials or soulbound NFTs.

### Data Storage and Privacy

* Store wallet address, display name if provided, role, progress, quiz attempts, badge awards, and analytics events.
* Store only Cloudinary asset references in the database, not raw media files.
* Avoid collecting unnecessary personal information in V1.
* Public badge verification pages should expose only the minimum necessary information: badge, course, wallet address, award date, and verification status.
* Admin access should be role-restricted.

### Scalability and Performance

* V1 should support modest ecosystem launch traffic and public browsing without requiring complex infrastructure.
* Public pages should be cache-friendly where feasible.
* Wallet-dependent actions should be resilient to session expiration and retryable failures.
* Badge awarding and completion calculation should be idempotent.

### Potential Challenges

* Course and partner content production may become the critical path.
* Partner review cycles may slow publishing.
* Badge verification pages must feel credible despite badges being off-chain.
* Analytics must be consistent enough to support partner reporting.
* Admin workflow can become a hidden scope risk if it expands toward full CMS/LMS complexity.

---

## Core Data Model

Minimum entities:

### EcosystemProject

Represents a staff-managed Arcium ecosystem project page.

Fields:

* id
* name
* slug
* description
* logoUrl
* category
* links
* partnerName
* referralUrl
* status
* createdAt
* updatedAt

Status values:

* draft
* published
* archived

### Course

Represents a structured learning path associated with a product or foundational topic.

Fields:

* id
* ecosystemProjectId
* title
* slug
* summary
* level
* status
* thumbnailUrl
* estimatedDuration
* courseType
* prerequisiteCourseIds
* createdAt
* updatedAt

Course type values:

* foundational
* product_onboarding
* builder_intro

### Module, Should-Have If Time Permits

Represents a grouping of lessons inside a course.

Fields:

* id
* courseId
* title
* description
* order
* createdAt
* updatedAt

If modules add too much complexity, V1 can use ordered lessons only.

### Lesson

Represents one ordered learning unit.

Fields:

* id
* courseId
* moduleId
* title
* order
* content
* mediaUrl
* status
* required
* estimatedDuration
* createdAt
* updatedAt

### User

Stores learner/admin identity.

Fields:

* id
* walletAddress
* displayName
* role
* createdAt
* updatedAt

Role values:

* learner
* staff_admin

### CourseProgress

Tracks learner course-level state.

Fields:

* id
* userId
* courseId
* status
* startedAt
* completedAt
* updatedAt

Status values:

* started
* completed

### LessonProgress

Tracks learner lesson-level progress.

Fields:

* id
* userId
* courseId
* lessonId
* completed
* completedAt
* createdAt
* updatedAt

### Quiz

Represents the final course assessment.

Fields:

* id
* courseId
* type
* title
* description
* passThreshold
* status
* createdAt
* updatedAt

V1 type value:

* final_course_quiz

### Question

Represents one single-select multiple-choice question.

Fields:

* id
* quizId
* prompt
* answerOptions
* correctAnswer
* explanation
* order
* difficulty
* tags
* createdAt
* updatedAt

### QuizAttempt

Stores quiz submissions and outcomes.

Fields:

* id
* userId
* quizId
* score
* passed
* submittedAt

### QuizAttemptAnswer, Should-Have If Time Permits

Stores answer-level data for analytics.

Fields:

* id
* quizAttemptId
* questionId
* selectedAnswer
* correct
* createdAt

### Badge

Defines a course completion badge.

Fields:

* id
* courseId
* name
* description
* imageUrl
* criteria
* issuer
* status
* createdAt
* updatedAt

### BadgeAward

Stores awarded badges.

Fields:

* id
* userId
* badgeId
* courseId
* walletAddress
* verificationSlug
* awardedAt

Integrity rule:

* BadgeAward should be unique per userId, badgeId, and courseId.

### PartnerIntake

Tracks partner-provided source material and review state without exposing partner self-service.

Fields:

* id
* ecosystemProjectId
* partnerName
* contactName
* contactEmail
* sourceMaterialUrl
* requestedCourseTopic
* reviewStatus
* notes
* createdAt
* updatedAt

Review status values:

* received
* in_review
* draft_created
* partner_review
* approved
* published

---

## Completion and Badge Logic

A learner completes a course when:

1. All required lessons are marked complete.
2. The final course quiz is passed.
3. The learner has a connected Solana wallet.

When these requirements are met, Arcademy creates a BadgeAward.

Operational rules:

* Lesson completion is manual in V1.
* Final quiz retakes are allowed after failure.
* A later failed attempt does not revoke a previous pass.
* Completion can be recalculated when lesson progress or quiz attempts change.
* Badge awarding must be idempotent.
* Badge verification pages should remain valid after award.
* Published course edits should not revoke prior badge awards.

---

## Governance and Publishing Workflow

### Staff-Owned Publishing

Arcademy staff owns final publishing quality in V1.

Staff responsibilities:

* Convert partner source material into learner-friendly content.
* Maintain tone, clarity, and consistency.
* Ensure course completion requirements are clear.
* Review quiz quality and answer explanations.
* Publish only when readiness checks pass.

### Partner Review

Partners may review factual product details before publication.

Partner review should focus on:

* Product accuracy.
* Correct links and terminology.
* Correct description of product use cases.
* Recommended next steps.

Partners should not directly publish, edit, or manage course content in V1.

### Publish Readiness Checklist

Before publication, staff should confirm:

* Project page has logo, description, and official links.
* Course has title, summary, level, duration, and thumbnail.
* Course has required lessons.
* Final quiz exists and has questions.
* Questions have correct answers and explanations.
* Badge exists and has name, description, image, and criteria.
* Course has a clear next step after completion.
* Partner factual review is complete for partner/project-specific courses.

---

## Risks and Mitigations

### Risk: Fuller V1 delays launch

A more complete V1 increases scope and coordination compared with an MVP.

Mitigation:

* Treat modules, optional knowledge checks, exports, and advanced analytics as should-have.
* Keep partner self-service, on-chain credentials, and full LMS functionality deferred.
* Launch with 3 high-quality courses if 5 would delay the release.

### Risk: Partner content production slows execution

Partners may not provide complete or beginner-friendly source material on time.

Mitigation:

* Use a structured partner intake template.
* Require Arcademy editorial ownership.
* Start with partners or products that already have strong source material.

### Risk: Partner expectations exceed V1 capabilities

Partners may expect dashboards, direct editing, or deep analytics.

Mitigation:

* Clearly position V1 as partner-assisted, not partner self-service.
* Offer stable links, staff-managed content, and basic reporting instead of dashboards.

### Risk: Off-chain badges may feel insufficient

Users or partners may expect on-chain credentials.

Mitigation:

* Add public verification pages and credential-grade metadata.
* Communicate that off-chain badges are the first step toward future credentialing.

### Risk: Admin tooling becomes a hidden LMS build

Staff workflows can expand quickly into complex content management.

Mitigation:

* Keep admin workflows focused on product pages, courses, lessons, quizzes, badges, and basic analytics.
* Defer advanced versioning, approvals, question banks, and partner permissions.

### Risk: Low completion is hard to interpret

Low completion could result from course quality, wallet friction, quiz difficulty, or poor referral fit.

Mitigation:

* Instrument the funnel from referral to course completion.
* Track drop-off by course, product, lesson, wallet step, and quiz step.

---

## Suggested Launch Catalog

### Course 1: Welcome to Arcium

Purpose:

* Introduce Arcium, privacy-preserving computation, ecosystem context, and next steps.

Target duration:

* 15–20 minutes.

Audience:

* New ecosystem users.

### Course 2: Privacy-Preserving Computation Basics

Purpose:

* Explain why privacy-preserving computation matters and what types of applications it enables.

Target duration:

* 20–30 minutes.

Audience:

* New users and product-interested users.

### Course 3: Flagship Product Onboarding Course

Purpose:

* Help users understand and begin using a flagship Arcium ecosystem product.

Target duration:

* 15–30 minutes.

Audience:

* Users referred by a product or partner.

### Course 4: Second Product Onboarding Course, If Ready

Purpose:

* Validate repeatability of product-scoped course creation.

Target duration:

* 15–30 minutes.

Audience:

* Users referred by another ecosystem product.

### Course 5: Builder Introduction, If Strategically Needed

Purpose:

* Provide a lightweight, non-sandbox introduction for builders without expanding into full developer education.

Target duration:

* 20–30 minutes.

Audience:

* Technically curious users and early builders.

Launch guidance:

* Three high-quality courses are preferable to five rushed courses.
* At least one course should be project-specific to validate partner referral value.
* At least one ecosystem project page should be referral-ready for an ecosystem partner or flagship project.

---

## Acceptance Criteria

### Public Discovery

* A public visitor can browse published ecosystem projects without logging in.
* A public visitor can browse published courses without logging in.
* A public visitor can view ecosystem project pages and project-associated courses.
* Partner-referral URLs resolve to stable project or course pages.
* Draft and unpublished content is not publicly accessible.

### Learning and Wallet Flow

* A learner can connect a Solana wallet.
* A learner can start a course after connecting a wallet.
* Lesson progress persists across sessions for the same wallet.
* A learner can complete all required lessons.
* A learner can take and pass a final course quiz.
* A learner can retry after failing a quiz.

### Badges and Verification

* A badge is awarded when course completion requirements are met.
* Duplicate badges are not created for the same user and course.
* A learner can view earned badges in their profile.
* A learner can open a public verification page for an earned badge.
* Badge verification page shows badge, course, wallet, award date, and verification status.

### Partner Representation

* Staff can create an ecosystem project page for an ecosystem project.
* Ecosystem project page includes logo, description, links, associated courses, and next steps.
* Staff can track partner intake or partner review status internally.
* Staff can provide partners with stable URLs and referral copy.
* Staff can view ecosystem project-level course starts, completions, and badge awards.

### Staff Admin

* Staff can create, edit, preview, publish, unpublish, and archive ecosystem projects and courses.
* Staff can create and reorder lessons.
* Staff can create quizzes and single-select multiple-choice questions.
* Staff can create and associate badges with courses.
* Staff receives publish readiness warnings for incomplete course requirements.
* Staff can view course and ecosystem project analytics.

### Deployment and Reliability

* Production deployment runs on Vercel.
* Neon Postgres is used as source of truth.
* Cloudinary supports media upload and references.
* Wallet authentication, progress tracking, quiz submission, course completion, badge award, and badge verification work in production.

---

## Assumptions

* Ecosystem projects will refer users to Arcademy if the project pages and courses are high quality, official, and referral-ready.
* New learners will connect a wallet once course value and recognition are clear.
* Off-chain badges with public verification are sufficient for V1 credibility.
* Arcademy staff can own editorial quality and publishing operations in V1.
* Partner self-service is not required to prove partner value in the first full foundation release.
* Three high-quality launch courses can make Arcademy feel credible if paired with strong ecosystem project pages and partner referral flows.

Fixed V1 decisions:

* Wallet-linked progress is required for course starts, quiz submissions, badge awards, and profiles.
* Partner self-service is deferred.
* On-chain credentials are deferred.
* Staff-managed publishing is the operating model for V1.
* Vercel, Neon Postgres, and Cloudinary are the preferred infrastructure choices.

---

## Milestones and Sequencing

### Project Estimate

Foundation V1: 5–7 weeks for a fast-moving lean team, assuming content and partner source material are available early.

This is larger than the original MVP scope but still intentionally avoids full partner self-service, on-chain credentials, and advanced LMS complexity.

### Team Size and Composition

Lean team: 2–4 people.

Recommended composition:

* 1 full-stack product engineer responsible for application, data model, wallet auth, admin, and deployment.
* 1 product/content owner responsible for PRD ownership, partner intake, course structure, acceptance testing, and launch coordination.
* 1 part-time designer responsible for product page polish, learning experience, badge presentation, and trust signals.
* 1 part-time editorial or ecosystem reviewer responsible for course clarity, partner accuracy review, and launch content QA.

### Suggested Phases

### Phase 1: Product Foundation and Information Architecture, 1 week

Key deliverables:

* Finalized product/course/badge model.
* Public information architecture.
* Product page and course page wireframes.
* Partner intake template.
* Launch catalog selection.

Dependencies:

* Product list.
* Partner candidates.
* Brand assets.
* Course topics.

### Phase 2: Public Discovery and Partner Representation, 1 week

* Public ecosystem project index.
* Ecosystem project detail pages.
* Course catalog.
* Course detail pages.
* Stable referral-friendly URLs.
* Initial partner/ecosystem project pages.

Dependencies:

* Partner/product descriptions.
* Logos and official links.
* Referral copy requirements.

### Phase 3: Wallet, Learning, and Progress, 1–1.5 weeks

Key deliverables:

* Solana wallet authentication.
* Learner accounts and sessions.
* Lesson viewing.
* Manual lesson completion.
* Course progress tracking.
* Learner profile baseline.

Dependencies:

* Wallet auth implementation choice.
* Lesson content model.

### Phase 4: Quizzes, Badges, and Verification, 1–1.5 weeks

Key deliverables:

* Final quiz authoring and submission.
* Scoring and pass/fail logic.
* Badge creation and award logic.
* Badge detail pages.
* Public badge verification pages.
* Completion rules and idempotency.

Dependencies:

* Quiz content.
* Badge assets and criteria.
* Completion rules.

### Phase 5: Staff Admin and Analytics, 1–1.5 weeks

Key deliverables:

* Staff admin for ecosystem projects, courses, lessons, quizzes, badges, and media.
* Publish/unpublish/archive workflows.
* Publish readiness warnings.
* Course analytics.
* Ecosystem project-level analytics.
* Basic partner reporting support.

Dependencies:

* Admin role configuration.
* Analytics event definitions.

### Phase 6: Launch Content, QA, and Partner Enablement, 1 week

* 3–5 ecosystem project pages prepared.
* 3–5 courses prepared, with at least 3 launch-ready.
* Partner review completed for project-specific courses.
* Referral URLs and copy shared with partners.
* Production deployment validated.
* Acceptance criteria tested.

Dependencies:

* Final course content.
* Partner review turnaround.
* Production credentials and environment configuration.

---

## Future Roadmap

* Partner login and limited review workflow.
* Partner analytics portal.
* Partner self-service course drafting with staff approval.
* On-chain badge minting or soulbound credentials.
* Advanced certification paths.
* Developer-focused courses and sandbox experiences.
* Course recommendations based on learner goals.
* Multi-language support.
* Paid or sponsored course models.
* Community features, if strategically justified.

### Strategic Sequencing Recommendation

* Prove partner referral value before building partner self-service.
* Prove off-chain badge credibility before adding on-chain credentials.
* Prove project onboarding course completion before expanding into advanced developer education.
* Prove staff publishing workflow before adding complex multi-tenant permissions.