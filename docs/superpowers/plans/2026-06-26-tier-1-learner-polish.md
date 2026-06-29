# Tier 1 Learner Polish — Implementation Plan

> **For agentic workers:** Implement task-by-task in order. Each task should leave the app in a shippable state. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship six learner-facing improvements — prerequisites, catalog filters, continue learning, richer lessons, shareable badges, and post-completion next steps — without schema changes or new dependencies.

**Architecture:** Extract shared learner-progress logic into `src/lib/learner-progress.ts` first; build UI components on top. Extend existing query helpers in `src/lib/courses.ts` for filters and recommendations. Keep the custom lesson renderer (no MDX) but expand its grammar. Use Next.js App Router `opengraph-image.tsx` for badge OG images.

**Tech Stack:** Next.js 16 App Router · Prisma · existing shadcn/ui · `ImageResponse` from `next/og` (built into Next.js)

**Out of scope (Tier 2):** Lesson knowledge checks, learning paths, referral dashboards, quiz analytics, notifications, modules.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/learner-progress.ts` | **Create.** Shared in-progress course aggregation + resume URL |
| `src/lib/courses.ts` | **Modify.** Filtered catalog query + related-course recommendations |
| `src/lib/course-catalog.ts` | **Create.** Filter param parsing, sort options, course-type labels |
| `src/lib/lesson-markdown.ts` | **Create.** Pure parse/render helpers for extended lesson grammar |
| `src/components/lesson-content.tsx` | **Modify.** Use `lesson-markdown.ts` |
| `src/components/course-prerequisites.tsx` | **Create.** Informational prerequisite list on course detail |
| `src/components/course-catalog-filters.tsx` | **Create.** Level / type / product / sort chips |
| `src/components/continue-learning-card.tsx` | **Create.** Home + profile resume card |
| `src/components/copy-link-button.tsx` | **Create.** Reusable clipboard button (extract from partner toolkit) |
| `src/components/course-completion-next-steps.tsx` | **Create.** Post-quiz recommendations panel |
| `src/components/admin/partner-referral-toolkit.tsx` | **Modify.** Use `CopyLinkButton` |
| `src/app/page.tsx` | **Modify.** Continue learning section for authed users |
| `src/app/courses/page.tsx` | **Modify.** Filters via `searchParams` |
| `src/app/profile/page.tsx` | **Modify.** Use shared progress lib + resume links |
| `src/app/products/[productSlug]/courses/[courseSlug]/page.tsx` | **Modify.** Prerequisites section |
| `src/app/products/.../quiz/page.tsx` | **Modify.** Pass recommendation data to `QuizRunner` |
| `src/components/quiz-runner.tsx` | **Modify.** Next-steps panel on pass + completion |
| `src/app/badges/[verificationSlug]/page.tsx` | **Modify.** Share UI |
| `src/app/badges/[verificationSlug]/opengraph-image.tsx` | **Create.** Dynamic OG image |
| `src/app/badges/[verificationSlug]/twitter-image.tsx` | **Create.** Re-export OG (optional alias) |

---

## Recommended task order

```
Task 1  Shared learner progress lib
Task 2  Course catalog filters
Task 3  Learner-facing prerequisites
Task 4  Richer lesson content
Task 5  Continue learning (home + resume links)
Task 6  Shareable badge cards
Task 7  Post-completion "What's next"
```

Tasks 2–4 are independent and can be parallelized after Task 1 if using subagents. Tasks 5–7 depend on earlier libs.

---

### Task 1: Shared learner progress lib

**Why:** Profile page already computes in-progress courses inline (~80 lines). Home page and resume links need the same logic.

**Files:**
- Create: `src/lib/learner-progress.ts`
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: Create `LearnerCourseProgress` type and query**

```typescript
// src/lib/learner-progress.ts
import { prisma } from "@/lib/prisma";
import { coursePath, lessonPath, quizPath } from "@/lib/paths";

export type LearnerCourseProgress = {
  courseId: string;
  slug: string;
  productSlug: string;
  title: string;
  productName: string;
  totalLessons: number;
  completedLessons: number;
  pct: number;
  completed: boolean;
  resumeHref: string;
  lastActivityAt: Date;
};

export async function getLearnerCourseProgressList(
  userId: string
): Promise<LearnerCourseProgress[]> {
  const [progressRows, passedAttempts, awards] = await Promise.all([
    prisma.progress.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            product: { select: { slug: true, name: true } },
            lessons: {
              where: { status: "published" },
              orderBy: { order: "asc" },
              select: { id: true },
            },
            quizzes: {
              where: { lessonId: null, status: "published" },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, passed: true },
      select: { quizId: true },
    }),
    prisma.badgeAward.findMany({
      where: { userId },
      select: { courseId: true },
    }),
  ]);

  const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId));
  const awardedCourseIds = new Set(awards.map((a) => a.courseId));

  const byCourse = new Map<string, LearnerCourseProgress & { completedLessonIds: Set<string> }>();

  for (const row of progressRows) {
    const c = row.course;
    if (c.status !== "published") continue;

    let agg = byCourse.get(c.id);
    if (!agg) {
      const finalQuizId = c.quizzes[0]?.id ?? null;
      agg = {
        courseId: c.id,
        slug: c.slug,
        productSlug: c.product.slug,
        title: c.title,
        productName: c.product.name,
        totalLessons: c.lessons.length,
        completedLessons: 0,
        pct: 0,
        completed: awardedCourseIds.has(c.id),
        resumeHref: coursePath(c.product.slug, c.slug),
        lastActivityAt: row.updatedAt,
        completedLessonIds: new Set(),
        // internal
      } as LearnerCourseProgress & { completedLessonIds: Set<string> };
      byCourse.set(c.id, agg);
    }
    if (row.completed) agg.completedLessonIds.add(row.lessonId);
    if (row.updatedAt > agg.lastActivityAt) agg.lastActivityAt = row.updatedAt;
  }

  return [...byCourse.values()].map((agg) => {
    const completedLessons = agg.completedLessonIds.size;
    const finalQuizId = progressRows.find((r) => r.courseId === agg.courseId)?.course.quizzes[0]?.id ?? null;
    const quizDone = finalQuizId ? passedQuizIds.has(finalQuizId) : true;
    const totalSteps = agg.totalLessons + (finalQuizId ? 1 : 0);
    const doneSteps = completedLessons + (finalQuizId && quizDone ? 1 : 0);
    const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

    const course = progressRows.find((r) => r.courseId === agg.courseId)!.course;
    const nextLesson = course.lessons.find((l) => !agg.completedLessonIds.has(l.id));
    let resumeHref = coursePath(agg.productSlug, agg.slug);
    if (nextLesson) {
      resumeHref = lessonPath(agg.productSlug, agg.slug, nextLesson.id);
    } else if (finalQuizId && !quizDone) {
      resumeHref = quizPath(agg.productSlug, agg.slug);
    }

    const { completedLessonIds: _, ...rest } = agg;
    return { ...rest, completedLessons, pct, resumeHref };
  });
}

export function getInProgressCourses(courses: LearnerCourseProgress[]) {
  return courses
    .filter((c) => !c.completed && c.pct < 100)
    .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
}

export function getMostRecentInProgress(courses: LearnerCourseProgress[]) {
  return getInProgressCourses(courses)[0] ?? null;
}
```

- [ ] **Step 2: Refactor profile page to use the lib**

Replace inline `byCourse` aggregation in `src/app/profile/page.tsx` with `getLearnerCourseProgressList(user.id)`. Update `CourseProgressRow` to accept `resumeHref` instead of building `coursePath` internally.

- [ ] **Step 3: Manual verify**

1. Sign in, start a course, complete lesson 1 of 4.
2. Profile → "Continue learning" row links to **lesson 2**, not course overview.
3. Complete all lessons → row links to **quiz**.
4. Pass quiz → course moves to completed section.

---

### Task 2: Course catalog filters

**Why:** `/products` already has category chips; `/courses` is an unfiltered grid that won't scale.

**Files:**
- Create: `src/lib/course-catalog.ts`
- Create: `src/components/course-catalog-filters.tsx`
- Modify: `src/lib/courses.ts`
- Modify: `src/app/courses/page.tsx`

- [ ] **Step 1: Define filter types and URL parsing**

```typescript
// src/lib/course-catalog.ts
import type { CourseLevel, CourseType } from "@prisma/client";

export const COURSE_SORT_OPTIONS = ["recommended", "newest", "duration"] as const;
export type CourseSort = (typeof COURSE_SORT_OPTIONS)[number];

export type CourseCatalogFilters = {
  level?: CourseLevel;
  courseType?: CourseType;
  productSlug?: string;
  sort?: CourseSort;
};

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  foundational: "Foundations",
  product_onboarding: "Product onboarding",
  builder_intro: "Builder intro",
};

export function parseCourseCatalogSearchParams(
  params: Record<string, string | undefined>
): CourseCatalogFilters {
  const level = params.level;
  const courseType = params.type;
  const productSlug = params.product?.trim() || undefined;
  const sort = params.sort;
  return {
    level:
      level === "beginner" || level === "intermediate" || level === "advanced"
        ? level
        : undefined,
    courseType:
      courseType === "foundational" ||
      courseType === "product_onboarding" ||
      courseType === "builder_intro"
        ? courseType
        : undefined,
    productSlug,
    sort:
      sort === "newest" || sort === "duration" || sort === "recommended"
        ? sort
        : undefined,
  };
}
```

- [ ] **Step 2: Extend `getPublishedCourses`**

```typescript
// src/lib/courses.ts — add optional second argument
export async function getPublishedCourses(filters?: CourseCatalogFilters) {
  const orderBy =
    filters?.sort === "newest"
      ? { createdAt: "desc" as const }
      : filters?.sort === "duration"
        ? { estimatedDuration: "asc" as const }
        : { createdAt: "asc" as const };

  return prisma.course.findMany({
    where: {
      status: "published",
      product: {
        status: "published",
        ...(filters?.productSlug ? { slug: filters.productSlug } : {}),
      },
      ...(filters?.level ? { level: filters.level } : {}),
      ...(filters?.courseType ? { courseType: filters.courseType } : {}),
    },
    orderBy,
    include: { product: true, badge: true, _count: { select: { lessons: { where: { status: "published" } } } } },
  });
}

export async function getPublishedCourseFilterOptions() {
  const [products, levels, types] = await Promise.all([
    prisma.product.findMany({
      where: { status: "published", courses: { some: { status: "published" } } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.course.groupBy({
      by: ["level"],
      where: { status: "published", product: { status: "published" } },
    }),
    prisma.course.groupBy({
      by: ["courseType"],
      where: { status: "published", product: { status: "published" } },
    }),
  ]);
  return { products, levels: levels.map((r) => r.level), types: types.map((r) => r.courseType) };
}
```

- [ ] **Step 3: Build `CourseCatalogFilters` component**

Mirror `ProjectCategoryFilters` chip pattern. Build hrefs by merging current `searchParams` (e.g. `/courses?level=beginner&type=foundational`). Include:
- All / Beginner / Intermediate / Advanced (only levels that exist)
- Course type chips (only types that exist)
- Product dropdown or chips (if ≤6 products; otherwise a `<select>` that navigates)
- Sort: Recommended (default) · Newest · Shortest

- [ ] **Step 4: Wire `/courses` page**

```typescript
// src/app/courses/page.tsx
type Props = { searchParams: Promise<{ level?: string; type?: string; product?: string; sort?: string }> };

export default async function CoursesPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = parseCourseCatalogSearchParams(raw);
  const [courses, filterOptions] = await Promise.all([
    getPublishedCourses(filters),
    getPublishedCourseFilterOptions(),
  ]);
  // render filters + grid; show empty state when filters active but 0 results
}
```

- [ ] **Step 5: Manual verify**

1. `/courses?level=beginner` shows only beginner courses.
2. Combining filters narrows results.
3. Invalid params (`?level=foo`) are ignored safely.
4. Empty filter combo shows helpful message + "Clear filters" link to `/courses`.

---

### Task 3: Learner-facing prerequisites

**Why:** `prerequisiteCourseIds` is stored and editable in admin but invisible to learners. PRD specifies informational-only (no hard gating).

**Files:**
- Modify: `src/lib/courses.ts`
- Create: `src/components/course-prerequisites.tsx`
- Modify: `src/app/products/[productSlug]/courses/[courseSlug]/page.tsx`

- [ ] **Step 1: Resolve prerequisites in course query**

Extend `getCourseBySlugs` return to include resolved prerequisites:

```typescript
// After fetching course, if prerequisiteCourseIds.length > 0:
const prerequisites = await prisma.course.findMany({
  where: {
    id: { in: course.prerequisiteCourseIds },
    status: "published",
    product: { status: "published" },
  },
  select: {
    id: true,
    title: true,
    slug: true,
    summary: true,
    level: true,
    product: { select: { slug: true, name: true } },
  },
});
// attach as course.prerequisites (ordered to match prerequisiteCourseIds)
```

- [ ] **Step 2: Create `CoursePrerequisites` component**

```tsx
// src/components/course-prerequisites.tsx
// Section: "Recommended before this course"
// List 1–3 linked mini-cards → coursePath(productSlug, slug)
// Footnote: "Optional — you can start this course without completing these first."
```

Place above "About this course" on the course detail page. Hide when `prerequisites.length === 0`. Do not block `CourseStartPanel`.

- [ ] **Step 3: Manual verify**

1. In admin, set "Welcome to Arcium" as prerequisite for a second course.
2. Learner view shows linked prerequisite card.
3. Start button still works without completing prerequisite.

---

### Task 4: Richer lesson content

**Why:** Seed lessons use `##` headings and `**bold**` but authors will need links and code blocks soon.

**Files:**
- Create: `src/lib/lesson-markdown.ts`
- Modify: `src/components/lesson-content.tsx`

- [ ] **Step 1: Extend inline renderer**

In `renderInline`, add support for markdown links:

```typescript
// Match [label](https://example.com) — only http/https URLs
// Render as <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
```

Reject `javascript:` URLs.

- [ ] **Step 2: Add fenced code blocks**

In the line loop, detect opening ` ``` ` (optional language tag). Collect lines until closing ` ``` `. Render:

```tsx
<pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
  <code>{code}</code>
</pre>
```

- [ ] **Step 3: Add blockquotes**

Lines starting with `> ` → `<blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">`.

- [ ] **Step 4: Manual verify**

Add a test lesson in admin (or temporarily edit seed) with:
- A link to `https://arcium.io`
- A 3-line code fence
- A blockquote

Confirm rendering on lesson page. Confirm existing seed lessons still render correctly.

---

### Task 5: Continue learning on home + resume links

**Why:** Profile already has a continue section; home is the primary return path and currently has no personalized state. Resume-to-lesson is covered in Task 1 but this task surfaces it on home.

**Files:**
- Create: `src/components/continue-learning-card.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build `ContinueLearningCard`**

Props: `course: LearnerCourseProgress` (single most recent).

Layout:
- Eyebrow: "Continue where you left off"
- Title + product name
- Progress bar + pct
- Primary CTA → `resumeHref` ("Resume lesson" / "Take quiz" / "Continue")
- Secondary link → course overview

- [ ] **Step 2: Add to home page**

In `src/app/page.tsx`, after hero (or between hero and "How it works"):

```typescript
const user = await getCurrentUser();
let continueCourse = null;
if (user) {
  const progress = await getLearnerCourseProgressList(user.id);
  continueCourse = getMostRecentInProgress(progress);
}
```

Render `<ContinueLearningCard />` when `continueCourse` is set. Do not block page for anonymous users.

- [ ] **Step 3: Manual verify**

1. Anonymous home → no continue card.
2. Signed in, in-progress → card appears with correct % and resume link.
3. Completed all courses → no card (or only if another course in progress).

---

### Task 6: Shareable badge cards

**Why:** Verification pages exist but sharing to Discord/Twitter shows generic site metadata.

**Files:**
- Create: `src/app/badges/[verificationSlug]/opengraph-image.tsx`
- Create: `src/components/copy-link-button.tsx`
- Modify: `src/components/admin/partner-referral-toolkit.tsx`
- Modify: `src/app/badges/[verificationSlug]/page.tsx`
- Modify: `src/app/badges/[verificationSlug]/page.tsx` `generateMetadata`

- [ ] **Step 1: Extract `CopyLinkButton`**

Move copy logic from `partner-referral-toolkit.tsx` into `src/components/copy-link-button.tsx`. Update partner toolkit to import it.

- [ ] **Step 2: Dynamic OG image**

```typescript
// src/app/badges/[verificationSlug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getBadgeAwardByVerificationSlug } from "@/lib/badges";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ verificationSlug: string }> }) {
  const { verificationSlug } = await params;
  const award = await getBadgeAwardByVerificationSlug(verificationSlug);
  if (!award) return new ImageResponse(<div>Not found</div>, { ...size });

  return new ImageResponse(
    (/* 1200×630 layout: Arcademy mark, badge name, course title, "Verified completion" */),
    { ...size }
  );
}
```

Use Geist or system fonts (already loaded in layout). Keep design calm: dark background, badge name prominent, course + project as subtitle.

- [ ] **Step 3: Enrich `generateMetadata`**

```typescript
openGraph: {
  title: `${award.badge.name} — Verified`,
  description: `Completed ${award.course.title} on Arcademy`,
  type: "website",
  images: [{ url: `/badges/${verificationSlug}/opengraph-image`, width: 1200, height: 630 }],
},
twitter: { card: "summary_large_image", title: "...", description: "..." },
```

- [ ] **Step 4: Share UI on verification page**

Below the verification card, add an action row:
- `CopyLinkButton` with `absoluteUrl(badgeVerificationPath(slug))`
- "Share on X" link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(...)}&url=${encodeURIComponent(...)}`

Pre-filled tweet: `I earned the "{badge.name}" badge on Arcademy for completing {course.title}.`

- [ ] **Step 5: Manual verify**

1. Open `/badges/{slug}` → copy button works.
2. Paste URL in Discord/Twitter card debugger (or browser devtools → Network → check OG tags).
3. `/badges/{slug}/opengraph-image` returns PNG.

---

### Task 7: Post-completion "What's next"

**Why:** Quiz pass screen currently offers badge/profile links but no guidance on what to learn or do next.

**Files:**
- Modify: `src/lib/courses.ts`
- Create: `src/components/course-completion-next-steps.tsx`
- Modify: `src/app/products/.../quiz/page.tsx`
- Modify: `src/components/quiz-runner.tsx`

- [ ] **Step 1: Add recommendation query**

```typescript
// src/lib/courses.ts
export async function getPostCompletionRecommendations(
  courseId: string,
  productId: string,
  limit = 3
) {
  const [siblingCourses, product] = await Promise.all([
    prisma.course.findMany({
      where: {
        productId,
        status: "published",
        id: { not: courseId },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { slug: true, title: true, summary: true, level: true, product: { select: { slug: true } } },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, slug: true, links: true },
    }),
  ]);

  let moreCourses = siblingCourses;
  if (moreCourses.length < limit) {
    const extras = await prisma.course.findMany({
      where: {
        status: "published",
        id: { not: courseId },
        productId: { not: productId },
        product: { status: "published" },
      },
      orderBy: { createdAt: "asc" },
      take: limit - moreCourses.length,
      select: { slug: true, title: true, summary: true, level: true, product: { select: { slug: true, name: true } } },
    });
    moreCourses = [...moreCourses, ...extras];
  }

  return {
    courses: moreCourses,
    productLinks: normalizeLinks(product?.links),
    productName: product?.name ?? "",
    productSlug: product?.slug ?? "",
  };
}
```

Import `normalizeLinks` from `products.ts` (export it if currently private).

- [ ] **Step 2: Build `CourseCompletionNextSteps`**

Shown when `result.passed && result.courseCompleted`. Sections:
1. **More courses** — up to 3 `CourseCard`-style compact links
2. **Explore the project** — link to product page
3. **Try the product** — external links from `product.links` (Docs, App, etc.) as outline buttons

- [ ] **Step 3: Pass data through quiz page → `QuizRunner`**

Fetch recommendations server-side in `quiz/page.tsx`, pass as prop `nextSteps`. Only render on completion (not on fail/retry).

- [ ] **Step 4: Manual verify**

1. Complete a course → next-steps panel appears below success card.
2. Shows sibling course if one exists on same product.
3. Product external links open in new tab with `rel="noopener noreferrer"`.
4. Failed quiz → no next-steps panel.

---

## Cross-cutting concerns

### Analytics (optional, low effort)

Add metadata to existing events where useful:
- `course_catalog_viewed` → include active filter params
- `course_detail_viewed` → `prerequisiteCount`
- New client event `badge_share_clicked` with `channel: "copy" | "twitter"`

### Accessibility

- Filter chips: `aria-current="true"` on active chip (match products page).
- Continue card: heading hierarchy (`h2` for section).
- OG image: include badge name as text (not image-only).

### No schema migration

All Tier 1 features use existing fields: `prerequisiteCourseIds`, `courseType`, `level`, `product.links`.

---

## Manual test checklist (pre-merge)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Anonymous `/courses` with filters | Works, no wallet needed |
| 2 | Course with prerequisites | Cards visible, start not blocked |
| 3 | Lesson with link + code block | Renders correctly, link opens new tab |
| 4 | Signed-in home with in-progress course | Continue card with resume link |
| 5 | Profile continue row | Links to next lesson, not course root |
| 6 | Badge verification share | Copy works, OG image loads |
| 7 | Quiz pass + course complete | Next steps with courses + product links |
| 8 | `pnpm build` | Passes (OG route included) |

---

## Estimated effort

| Task | Effort |
|------|--------|
| 1 Shared progress lib | ~2h |
| 2 Catalog filters | ~3h |
| 3 Prerequisites | ~1.5h |
| 4 Lesson content | ~2h |
| 5 Continue on home | ~1.5h |
| 6 Shareable badges | ~3h |
| 7 Post-completion next steps | ~2.5h |
| **Total** | **~15h** |

---

## Tier 2 preview (next sprint)

For planning continuity — do not implement now:

1. Lesson knowledge checks (`Quiz.lessonId` learner UI)
2. Learning paths / curated sequences
3. Referral attribution dashboard (UTM data already captured)
4. Per-question quiz analytics
5. Course modules grouping
