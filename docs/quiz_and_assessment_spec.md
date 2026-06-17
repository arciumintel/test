Arcademy V1 Quiz & Assessment Spec

**Alignment notes**: Source-of-truth hierarchy for V1: (1) the Ecosystem Learning Foundation PRD ("Ecosystem Learning Foundation") is the canonical product-level source; (2) this Quiz & Assessment Spec is the canonical source for quiz behavior and acceptance criteria; (3) the Engineering Implementation Brief governs implementation guardrails. Preserve the existing working implementation unless it conflicts with a must-have V1 requirement. Where conflicts arise, follow the priority order above and document any necessary deviations.

**Terminology note**: "Ecosystem project" is the primary learner-facing term for an Arcium-related protocol, application, integration, tool, infrastructure component, service, or product represented in Arcademy. Use "partner" to refer to the team or organization behind an ecosystem project. Use "product" only when specifically referring to a partner's own product/app/site/tool.

**Implementation preservation note**: Implementation teams must avoid destructive schema changes. Do not rewrite or rename existing quiz schema, tables, or columns in a way that breaks current data. Existing Quiz, Question, QuizAttempt, Product, productId, or similar structures should be extended where feasible. If Product/productId terminology exists in the codebase, preserve it initially and treat it semantically as EcosystemProject/ecosystemProjectId for V1 unless a safe migration is explicitly approved.

### TL;DR

Arcademy V1 quizzes are lightweight learning checks that validate course understanding, reinforce key concepts, and unlock course completion badges. V1 supports one required final course-level quiz per course, using beginner-friendly single-select multiple-choice questions with retry support and instructional feedback.

This spec is a companion to the Arcademy V1 PRD. It expands the quiz model, learner experience, admin authoring requirements, scoring rules, analytics, edge cases, and acceptance criteria while preserving the V1 scope: curated courses, staff-managed content, off-chain badges, and wallet-linked progress.

---

## Goals

### Business Goals

* Support the primary V1 success metric of course completions by making quizzes clear, fair, and achievable for new learners.
* Validate that lightweight assessments can increase trust in Arcademy badges without creating unnecessary learner friction.
* Enable Arcademy staff to create and maintain final course quizzes without engineering support.
* Provide basic quiz analytics that help staff improve course content and identify learner confusion.
* Establish a quiz model that can later support more advanced certification paths without overbuilding V1.

### User Goals

* Understand what knowledge is required to complete a course.
* Take a short, low-pressure quiz that reinforces the most important course concepts.
* Receive clear pass/fail results and helpful explanations after submission.
* Retry after failure without penalty.
* Earn a completion badge after satisfying lesson and quiz requirements.

### Non-Goals

* Build a formal exam, proctored assessment, or high-stakes certification system.
* Support lesson-level quizzes, question banks, randomized questions, timed quizzes, or weighted scoring in V1.
* Support free-response, multi-select, coding, or sandbox-based assessments in V1.
* Penalize learners for failed attempts or limit retries.
* Mint quiz-based credentials on-chain in V1.

---

## V1 Quiz Model

Arcademy V1 supports one required final course-level quiz per course.

### Core Rules

* Quiz type: final course quiz.
* Requirement: required for course completion.
* Question format: single-select multiple-choice.
* Recommended question count: 5–8 questions per course.
* Recommended answer options: 3–4 options per question.
* Default passing threshold: 70%, configurable by staff admin per quiz.
* Retry policy: unlimited retries in V1.
* Feedback policy: show score, pass/fail state, and instructional explanations after submission.
* Completion dependency: passing the quiz satisfies the quiz requirement, but badge award still requires all required lessons to be completed.

### Deferred Quiz Models

The following are explicitly deferred from V1:

* Lesson-level quizzes (optional knowledge checks: should-have if time permits; non-gating in V1).
* Multiple quizzes per course.
* Randomized question order.
* Randomized answer order.
* Question pools or question banks.
* Timed quizzes.
* Weighted questions.
* Multi-select questions.
* Free-response questions.
* Code execution or developer sandbox assessments.
* AI-generated quizzes.
* Formal certification exam modes.

Optional Knowledge Checks: Final course quizzes remain a must-have in V1. Optional lesson-level knowledge checks are a should-have if time permits; they are explicitly non-gating and must not block course completion or badge awards in V1.

---

## Personas

### New Arcium Ecosystem Learner

A beginner or early-stage ecosystem user who wants to understand Arcium and related ecosystem projects without being overwhelmed by technical language.

Quiz needs:

* Clear expectations before starting.
* Beginner-friendly wording.
* No trick questions.
* Encouraging feedback after mistakes.
* Ability to retry without penalty.

### Project-Interested Learner

A learner referred from an ecosystem project, partner documentation, community campaign, or in-product prompt who needs to understand a specific ecosystem project before using it. They require clear, project-focused onboarding that explains project purpose, who it serves, and first steps to get started.

Quiz needs:

* Simple quiz authoring workflow.
* Ability to define correct answers and explanations.
* Configurable passing threshold.
* Preview before publishing.
* Basic analytics on pass rate, average score, and missed questions.

---

## User Stories

### New Arcium Ecosystem Learner

* As a learner, I want to know that the final quiz is required for completion, so that I understand what is needed to earn the badge.
* As a learner, I want quiz questions to use plain language, so that I can focus on the concepts rather than decoding jargon.
* As a learner, I want to see whether I passed or failed immediately after submission, so that I know what to do next.
* As a learner, I want explanations after answering questions, so that I can learn from mistakes.
* As a learner, I want to retry the quiz after failing, so that I can complete the course after reviewing the material.

### Arcademy Staff Admin

* As a staff admin, I want to create a final quiz for a course, so that learners can demonstrate understanding before earning a badge.
* As a staff admin, I want to add single-select multiple-choice questions, so that quiz authoring remains simple and consistent.
* As a staff admin, I want to define one correct answer and explanation per question, so that learners receive accurate feedback.
* As a staff admin, I want to configure the passing threshold, so that each course can define an appropriate completion standard.
* As a staff admin, I want to view quiz performance, so that I can improve course content and identify confusing concepts.

---

## Functional Requirements

### Learner Quiz Experience, Priority: Must-Have

* Quiz Availability: A wallet-connected learner can access the final course quiz from the course experience.
* Quiz Requirement Visibility: The course page and progress UI should make clear that passing the final quiz is required for course completion.
* Question Display: The learner sees one or more single-select multiple-choice questions.
* Answer Selection: The learner can select one answer per question.
* Submission Validation: The learner cannot submit the quiz until all required questions have an answer selected.
* Score Calculation: The system calculates the learner’s score after submission.
* Pass/Fail Result: The learner receives a clear pass or fail result.
* Feedback Display: The learner sees explanations after submission.
* Retry Support: A learner who fails can retry the quiz without penalty.
* Completion Check: If the learner passes the quiz and all required lessons are complete, the course is marked complete and the badge award flow is triggered.

### Admin Quiz Authoring, Priority: Must-Have

* Create Quiz: Staff can create one final quiz for a course.
* Edit Quiz: Staff can edit quiz title, description if supported, and passing threshold.
* Add Question: Staff can add single-select multiple-choice questions.
* Edit Question: Staff can edit prompts, answer options, correct answer, and explanation.
* Delete Question: Staff can delete unpublished questions.
* Correct Answer Selection: Staff must select exactly one correct answer per question.
* Passing Threshold: Staff can set the pass threshold as a percentage.
* Publish Readiness: Staff should be prevented or warned before publishing a course with no final quiz, no questions, missing correct answers, or missing explanations.

### Quiz Analytics, Priority: Must-Have

* Attempt Count: Staff can see total quiz attempts per course.
* Pass Rate: Staff can see the percentage of quiz attempts or learners that passed.
* Average Score: Staff can see average quiz score.
* Attempts Before Pass: Staff can see the average number of attempts before passing, if feasible.
* Most Missed Questions: Staff can identify questions with the highest incorrect response rate, if feasible for V1.

### Enhancements, Priority: Should-Have If Time Permits

* Quiz Preview: Staff can preview the quiz as a learner before publishing.
* Question Reordering: Staff can reorder questions.
* Feedback by Missed Question: Learners can see explanations specifically tied to questions they missed.
* Lesson Reference Links: Feedback can link back to the relevant lesson, if lesson mapping exists.

### Deferred Features, Priority: Defer

* Question banks.
* Randomized question order.
* Randomized answer order.
* Timed quizzes.
* Weighted questions.
* Multi-select questions.
* Free-response questions.
* Partial credit.
* Manual grading.
* Quiz certificates separate from course badges.
* Proctoring or identity verification beyond wallet signature authentication.

---

## Question Design Rules

Arcademy quizzes should reinforce learning and validate understanding. They should not feel like traps, exams, or technical gatekeeping.

### Writing Standards

* Use plain language suitable for new ecosystem users.
* Avoid trick questions.
* Avoid obscure details that do not affect course understanding.
* Avoid testing facts that were not covered in the course.
* Avoid unnecessary crypto jargon unless the course already explained the term.
* Each question should map to one specific learning objective.
* Each question should have one clearly correct answer.
* Incorrect options should be plausible but not misleading.
* Explanations should teach the concept, not simply restate the answer.
* Failure feedback should be encouraging and should guide the learner to review relevant material.

### Difficulty Guidelines

* Easy: validates a core definition, concept, or purpose.
* Medium: requires applying a concept to a simple scenario.
* Hard: requires comparing concepts or identifying a common misconception.

V1 launch quizzes should skew easy to medium. Hard questions should be used sparingly and only when the course clearly prepares learners for them.

---

## Question Template

Use this template for each quiz question.

### Question

* Question ID:
* Course:
* Related lesson or learning objective:
* Difficulty:
* Question prompt:
* Answer option A:
* Answer option B:
* Answer option C:
* Answer option D:
* Correct answer:
* Explanation:
* Failure feedback:
* Tags:

### Example Question

* Question ID: welcome-arcium-q1
* Course: Welcome to Arcium
* Related lesson or learning objective: Understand Arcium’s purpose
* Difficulty: Easy
* Question prompt: What is the primary purpose of Arcium?
* Answer option A: To provide a social network for crypto users
* Answer option B: To enable privacy-preserving computation for decentralized applications
* Answer option C: To replace all blockchain wallets
* Answer option D: To create NFTs for online courses
* Correct answer: B
* Explanation: Arcium focuses on privacy-preserving computation, helping applications use protected data in useful ways.
* Failure feedback: Review the introductory lesson on what Arcium enables and why privacy matters.
* Tags: arcium-basics, privacy

---

## Course-Level Quiz Objectives

### Welcome to Arcium

The quiz should validate that the learner understands:

* What an ecosystem project is at a high level.
* Why privacy-preserving computation matters.
* How Arcium and ecosystem projects support new kinds of applications or ecosystem products.
* How the ecosystem is structured at a beginner level.
* What a learner should do next after completing the course (clear recommended action).

Recommended quiz size:

* 5–7 questions.

Recommended passing threshold:

* 70%.

### Flagship Partner/Product Course

The quiz should validate that the learner understands:

* What the ecosystem project does.
* Who the ecosystem project is for.
* Why the ecosystem project matters in the Arcium ecosystem.
* How a new user should get started with the ecosystem project.
* Common beginner mistakes or misconceptions.
* What successful completion or onboarding means, and the next action the learner should take.

Recommended quiz size:

* 5–8 questions.

Recommended passing threshold:

* 70%.

---

## Scoring and Passing Rules

### Score Calculation

* Score is calculated as correct answers divided by total questions.
* Score should be displayed as a percentage.
* A learner passes when their score is greater than or equal to the configured passing threshold.
* The default threshold is 70% unless staff configures a different threshold.

### Attempt Storage

* Every submitted quiz attempt is stored.
* Stored attempt data includes user, quiz, score, pass/fail result, and submission time.
* If feasible, V1 should also store selected answers to support question-level analytics.

### Completion Interaction

* The first passing attempt satisfies the quiz requirement for course completion.
* A later failed attempt should not remove a previously achieved pass.
* Passing the quiz does not automatically award a badge unless all required lessons are also complete.
* If all required lessons are already complete, passing the quiz should trigger course completion and badge awarding.

---

## Retry Rules

V1 uses a learner-friendly retry model.

* Learners may retry after failing.
* Retries are unlimited in V1.
* No cooldown is required in V1.
* No penalty is applied for failed attempts.
* The learner should be encouraged to review lessons before retrying.
* The system should track repeat attempts for analytics.
* Retaking after passing is allowed only if simple to support, but it must not duplicate badge awards or revoke prior completion.

Rationale:

* Arcademy V1 is designed to validate learning and completion, not enforce high-stakes credentialing.
* Unlimited retries reduce anxiety and support beginner-friendly learning.
* Attempt analytics still allow staff to detect confusing course content or poorly written questions.

---

## Feedback Rules

### On Pass

The learner should see:

* Score.
* Pass confirmation.
* Message that the quiz requirement is complete.
* Badge awarded confirmation if all course requirements are complete.
* Remaining completion requirements if lessons are still incomplete.
* Link to profile or next recommended course, if available.

### On Fail

The learner should see:

* Score.
* Clear message that the learner did not pass yet.
* Encouragement to review lessons and retry.
* Explanations for missed questions, or explanations for all questions if simpler to implement.
* Retry action.

### Feedback Tone

Feedback should be:

* Encouraging.
* Specific.
* Instructional.
* Plainly worded.
* Free of punitive language.

Recommended failure message pattern:

* “You did not pass this attempt yet, but you can retry. Review the explanations below, revisit any lessons that felt unclear, and try again when ready.”

---

## User Experience

### Entry Point and First-Time User Experience

* Learners discover that the course includes a final quiz from the course detail page.
* The quiz requirement should be visible before the learner starts the course.
* The learner should understand that wallet connection is required to submit a quiz and save the result.
* The product should explain that quizzes are learning checks used for badge completion.

### Core Experience

* Step 1: Learner reaches quiz entry point.

  * The learner sees quiz title, question count, passing threshold, and retry policy.
  * The interface confirms that wallet connection is required to submit.

* Step 2: Learner answers questions.

  * Each question presents one prompt and 3–4 answer options.
  * The learner selects one option per question.
  * The UI should clearly show unanswered questions before submission.

* Step 3: Learner submits quiz.

  * The system validates that all required questions have been answered.
  * If the wallet session is expired, the learner is prompted to reconnect before submission.
  * The system calculates score and stores the attempt.

* Step 4: Learner receives result.

  * On pass, the learner sees a completion-oriented success state.
  * On fail, the learner sees an instructional retry state.
  * Explanations are displayed after submission.

* Step 5: Completion state is evaluated.

  * If all lessons are complete and the quiz is passed, course completion is recorded.
  * Badge awarding is triggered once completion requirements are satisfied.
  * If lessons remain, the learner is directed back to the remaining lesson requirements.

### UI/UX Highlights

* Keep quizzes short and focused.
* Show the passing threshold before the learner starts.
* Avoid making the quiz feel like a high-stakes exam.
* Use progress indicators such as “Question 2 of 6.”
* Make answer selection clear and accessible.
* Make submit disabled or blocked until all required questions are answered.
* Use clear error messages for session, wallet, and validation failures.

---

## Admin Authoring Experience

### Quiz Creation Flow

1. Staff opens a course in the admin dashboard.
2. Staff creates or edits the final course quiz.
3. Staff sets the passing threshold.
4. Staff adds questions.
5. Staff enters answer options.
6. Staff selects exactly one correct answer per question.
7. Staff adds an explanation and optional failure feedback.
8. Staff previews the quiz if preview is available.
9. Staff resolves publish readiness warnings.
10. Staff publishes the course.

### Admin Validation Rules

The system should warn or prevent publishing when:

* The course has no final quiz.
* The quiz has no questions.
* A question has fewer than two answer options.
* A question has no correct answer selected.
* A question has more than one correct answer selected.
* A question is missing an explanation.
* The passing threshold is missing or invalid.

### Recommended Defaults

* Passing threshold: 70%.
* Minimum question count warning: fewer than 5 questions.
* Maximum question count warning: more than 10 questions.
* Answer option count: 3–4 recommended.

---

## Data Model Considerations

This spec aligns with the PRD’s Core Data Model.

### Quiz

Represents the required final course-level assessment.

Recommended fields:

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

Recommended fields:

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

Represents one learner submission.

Recommended fields:

* id
* userId
* quizId
* score
* passed
* submittedAt

### QuizAttemptAnswer, Recommended If Feasible

Stores selected answers per attempt for question-level analytics.

Recommended fields:

* id
* quizAttemptId
* questionId
* selectedAnswer
* correct
* createdAt

Rationale:

* This table enables most-missed-question analytics and better content iteration. If implementation time is constrained, this can be deferred, but the system will have weaker diagnostic analytics.

---

## Analytics and Tracking Plan

### Events

Track the following learner events (connect to course and ecosystem project reporting where implemented):

* quiz_started
* quiz_question_answered
* quiz_submitted
* quiz_passed
* quiz_failed
* quiz_retried
* quiz_abandoned
* course_completed
* badge_awarded
* badge_verification_viewed

Event guidance should remain compatible with the Engineering Implementation Brief and include context linking quiz analytics to course_completed, badge_awarded, badge_verification_viewed, and ecosystem project-level reporting where implemented. V1 may expose basic assigned-project quiz and course analytics through partner self-service; advanced partner analytics remain out of scope.

Track the following admin events:

* admin_quiz_created
* admin_quiz_updated
* admin_question_created
* admin_question_updated
* admin_quiz_published

### Admin Metrics

* Total quiz attempts.
* Unique learners who attempted quiz.
* Pass rate by course.
* Average score by course.
* Average attempts before pass.
* Most missed questions.
* Quiz abandonment rate.
* Course completion rate after quiz pass.

### Interpretation Guidance

* Low pass rate may indicate confusing course content, overly difficult questions, or unclear quiz wording.
* High retry count may indicate that the quiz is too hard or feedback is insufficient.
* High abandonment before quiz submission may indicate quiz length, wallet friction, or unclear value.
* High quiz pass but low badge award may indicate lesson completion friction or unclear completion requirements.

---

## Edge Cases and Product Decisions

### Learner Starts Quiz but Disconnects Wallet

Decision:

* Wallet connection is required at submission.
* If the wallet disconnects before submission, prompt the learner to reconnect before saving the attempt.

### Session Expires During Quiz

Decision:

* Prompt reconnect before submission.
* Preserve selected answers client-side where feasible.
* If preservation is not feasible in V1, clearly explain that the learner may need to reselect answers.

### Learner Fails Quiz

Decision:

* Store the failed attempt.
* Show score and explanations.
* Allow retry.

### Learner Passes Quiz Before Completing Lessons

Decision:

* Store the passing attempt.
* Mark the quiz requirement as satisfied.
* Do not award the badge until required lessons are complete.
* Show remaining lesson requirements.

### Learner Retakes Quiz After Passing

Decision:

* If retakes are supported, store the additional attempt.
* Do not revoke prior pass.
* Do not duplicate badge awards.

### Quiz Is Edited After Learners Have Attempted It

Decision:

* Avoid material edits to published quizzes after launch unless necessary.
* Do not revoke prior passing attempts or badge awards because of later edits.
* For V1, staff should unpublish and republish carefully rather than relying on advanced versioning.

### Passing Threshold Changes

Decision:

* New attempts use the current threshold.
* Previously awarded badges are not revoked.
* Previously completed courses remain complete.

### Badge Awarding Fails After Quiz Pass

Decision:

* Completion logic should be retryable.
* Badge awarding must be idempotent; off-chain and non-duplicative.
* The same user should not receive duplicate badge awards for the same course.

Update completion and badge language: Passing the final quiz satisfies the quiz requirement only. Course completion requires all required lessons plus a passing final quiz and a wallet-connected learner state. Badge awarding is off-chain and idempotent; public badge verification pages are part of the broader V1 recognition model. A quiz pass may trigger course completion and badge award only when all other requirements are already satisfied.

---

## Acceptance Criteria

### Learner Quiz Flow

* A wallet-connected learner can start the final course quiz.
* A learner can see question count and passing threshold before submission.
* A learner can select one answer per question.
* A learner cannot submit until all required questions have been answered.
* A learner receives a score after submission.
* A learner receives a pass or fail result after submission.
* A learner receives instructional feedback after submission.
* A learner can retry after failing.
* A passing quiz attempt satisfies the course quiz requirement.
* Passing the quiz does not award a badge unless all required lessons are also complete.

### Admin Authoring

* Staff can create one final quiz for a course.
* Staff can add single-select multiple-choice questions.
* Staff can define 3–4 answer options per question.
* Staff can select exactly one correct answer per question.
* Staff can add an explanation for each question.
* Staff can configure the passing threshold.
* Staff receives warnings or is blocked when quiz content is incomplete.

### Scoring and Completion

* The system calculates score as correct answers divided by total questions.
* The system determines pass/fail based on the configured passing threshold.
* All quiz attempts a
  * The system calculates score as correct answers divided by total questions.
  * The system determines pass/fail based on the configured passing threshold.
  * All quiz attempts are stored.
  * A later failed attempt does not revoke a prior passing attempt.
  * Duplicate badge awards are not created after repeated passes.
* Duplicate badge awards are not created after repeated passes.

### Analytics

* Staff can view quiz attempts by course.
* Staff can view pass rate by course.
* Staff can view average quiz score by course.
* Staff can identify common learner confusion through most-missed-question analytics if answer-level storage is implemented.

## Open Questions

* Should staff be able to require lesson completion before quiz access, or should learners be allowed to take the quiz at any time after starting the course?
* Should explanations be shown for all questions or only missed questions?
* Should learners see the correct answer after failing, or only the explanation?
* Should quiz attempts include selected-answer storage in V1, or should that be deferred for speed?
* Should quiz retakes after passing be allowed in V1, or should the quiz become read-only after pass?
* Should the learner profile display quiz scores, or only course completion and badges?

Recommended V1 defaults:

* Allow quiz access after course start, not necessarily after all lessons are complete.
* Show explanations after submission.
* Store selected answers if feasible.
* Allow retakes only if simple to support.
* Do not display quiz scores on the learner profile in V1.
