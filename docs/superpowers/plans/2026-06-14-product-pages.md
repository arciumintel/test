# Product Pages & Product-Scoped Courses — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a first-class `Product` model, add staff-managed product pages at `/products/[slug]`, and make all learner course URLs product-scoped (`/products/[slug]/courses/[slug]/…`), while keeping `/courses` as a cross-product catalog.

**Architecture:** A `Product` model is added to the Prisma schema; `Course` gains a required `productId` FK and per-product slug uniqueness. A centralized `src/lib/paths.ts` helper is the single source of truth for all public URLs — it is imported by every page, component, and server action that constructs a route. Public routes and admin routes are added in parallel layers; no existing lesson/quiz business logic changes.

**Tech Stack:** Next.js App Router (Server Components + Server Actions), Prisma 7 / Neon Postgres, Zod, shadcn/ui + Tailwind, Cloudinary (logo uploads).

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `src/lib/paths.ts` | Canonical URL helpers: `productPath`, `coursePath`, `lessonPath`, `quizPath` |
| `src/lib/products.ts` | Data-access: `getPublishedProducts`, `getProductBySlug` |
| `src/components/product-card.tsx` | Reusable product card for index + homepage |
| `src/components/breadcrumbs.tsx` | Breadcrumb bar used on nested learner pages |
| `src/app/products/page.tsx` | `/products` index |
| `src/app/products/[productSlug]/page.tsx` | `/products/[productSlug]` landing |
| `src/app/products/[productSlug]/courses/[courseSlug]/page.tsx` | Course detail (moved) |
| `src/app/products/[productSlug]/courses/[courseSlug]/lessons/[lessonId]/page.tsx` | Lesson (moved) |
| `src/app/products/[productSlug]/courses/[courseSlug]/quiz/page.tsx` | Quiz (moved) |
| `src/app/admin/products/page.tsx` | Admin product list |
| `src/app/admin/products/new/page.tsx` | Create product |
| `src/app/admin/products/[id]/page.tsx` | Edit product |
| `src/components/admin/product-form.tsx` | Product create/edit form |
| `src/components/admin/product-status-controls.tsx` | Publish/archive controls for products |
| `src/app/actions/admin-products.ts` | Server actions for product CRUD |

### Modified files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `Product` model + `ProductStatus` enum; update `Course` |
| `prisma/seed.ts` | Create Arcium product, assign existing courses |
| `prisma.config.ts` | No change needed (migration sequence handled by `migrate dev`) |
| `src/lib/courses.ts` | Add `getCourseBySlugs(productSlug, courseSlug)`; update catalog query to include product |
| `src/lib/analytics.ts` | No change; still keyed by courseId |
| `src/app/actions/admin.ts` | Replace `partnerName` with `productId`; update `uniqueSlug`; update `revalidatePath` calls; add publish guard |
| `src/components/course-card.tsx` | Accept `productSlug`; use `coursePath`; show product attribution |
| `src/components/course-start-panel.tsx` | Accept `productSlug`; use `lessonPath` |
| `src/components/quiz-runner.tsx` | Accept `productSlug`; use `coursePath` |
| `src/components/admin/course-details-form.tsx` | Replace `partnerName` with `productId` select |
| `src/components/admin/course-editor-tabs.tsx` | No functional change; remove `partnerName` display |
| `src/components/site-header.tsx` | Add Products nav link |
| `src/components/site-footer.tsx` | Add Products link |
| `src/app/page.tsx` | Add "Explore products" section; update course card hrefs |
| `src/app/courses/page.tsx` | Update catalog to include product metadata; update card props |
| `src/app/profile/page.tsx` | Update course queries to include `productSlug`; use `coursePath` |

### Deleted files (removed by moving to nested routes)
| File |
|------|
| `src/app/courses/[slug]/page.tsx` |
| `src/app/courses/[slug]/lessons/[lessonId]/page.tsx` |
| `src/app/courses/[slug]/quiz/page.tsx` |

---

## Phase 1 — Schema, Migration & Data Access

### Task 1: Add `Product` model to schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `ProductStatus` enum and `Product` model**

Replace the top of `prisma/schema.prisma` (after the existing enums) with:

```prisma
enum ProductStatus {
  draft
  published
  archived
}

model Product {
  id          String        @id @default(cuid())
  name        String
  slug        String        @unique
  description String
  logoUrl     String?
  links       Json          @default("[]")
  status      ProductStatus @default(draft)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  courses Course[]

  @@index([status])
}
```

- [ ] **Step 2: Update `Course` — add `productId`, remove `partnerName`, change slug uniqueness**

In the `Course` model block:

```prisma
model Course {
  id                String        @id @default(cuid())
  productId         String
  title             String
  slug              String
  summary           String
  description       String?
  level             CourseLevel   @default(beginner)
  status            CourseStatus  @default(draft)
  thumbnailUrl      String?
  estimatedDuration Int?
  learningOutcomes  String[]
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  product     Product      @relation(fields: [productId], references: [id])
  lessons     Lesson[]
  quizzes     Quiz[]
  progress    Progress[]
  badge       Badge?
  badgeAwards BadgeAward[]

  @@unique([productId, slug])
  @@index([status])
  @@index([productId])
}
```

- [ ] **Step 3: Run Prisma generate to confirm the schema compiles**

```bash
pnpm db:generate
```

Expected output: `✔ Generated Prisma Client (7.x.x) to .\generated in …ms`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add Product model and product-scoped course slugs"
```

---

### Task 2: Write and run the migration

**Files:**
- Modify: `prisma.config.ts` (already correct — uses `DIRECT_URL`)

- [ ] **Step 1: Create the migration (two-phase to handle NOT NULL addition)**

Because `productId` will be required but existing rows have none, the migration must:
1. Add `productId` as nullable.
2. Insert the Arcium product row.
3. Backfill existing courses.
4. Add the NOT NULL constraint.

Create `prisma/migrations/add_product/migration.sql` manually or run:

```bash
pnpm db:migrate
```

When prompted for a migration name, enter: `add_product_model`

Prisma will generate a migration file. If it fails because of the NOT NULL + existing data, use the two-step approach below.

- [ ] **Step 2: If migration fails due to NOT NULL — create a manual two-phase migration**

Create `prisma/migrations/add_product_model/migration.sql`:

```sql
-- Step 1: Add ProductStatus enum and Product table
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'published', 'archived');

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "links" JSONB NOT NULL DEFAULT '[]',
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- Step 2: Add nullable productId to Course, drop partnerName
ALTER TABLE "Course" ADD COLUMN "productId" TEXT;
ALTER TABLE "Course" DROP COLUMN IF EXISTS "partnerName";

-- Step 3: Insert Arcium product (backfill happens in seed)
INSERT INTO "Product" ("id", "name", "slug", "description", "links", "status", "createdAt", "updatedAt")
VALUES (
    'product_arcium',
    'Arcium',
    'arcium',
    'Arcium is a network for private computation. Programs can use sensitive data to produce results without exposing the underlying data itself.',
    '[{"label":"Website","url":"https://arcium.com"},{"label":"Docs","url":"https://docs.arcium.com"},{"label":"X","url":"https://x.com/arciumhq"}]',
    'published',
    NOW(),
    NOW()
);

-- Step 4: Backfill all existing courses to Arcium
UPDATE "Course" SET "productId" = 'product_arcium';

-- Step 5: Now make productId NOT NULL
ALTER TABLE "Course" ALTER COLUMN "productId" SET NOT NULL;

-- Step 6: Drop old global unique index on slug, add composite unique
DROP INDEX IF EXISTS "Course_slug_key";
ALTER TABLE "Course" ADD CONSTRAINT "Course_productId_slug_key" UNIQUE ("productId", "slug");
CREATE INDEX "Course_productId_idx" ON "Course"("productId");

-- Step 7: Add FK constraint
ALTER TABLE "Course" ADD CONSTRAINT "Course_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

Then apply it:

```bash
pnpm db:migrate
```

- [ ] **Step 3: Verify migration applied**

```bash
pnpm exec prisma migrate status
```

Expected: `Database schema is up to date!`

- [ ] **Step 4: Regenerate client**

```bash
pnpm db:generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/migrations prisma/schema.prisma
git commit -m "feat(db): migrate to Product model with product-scoped course slugs"
```

---

### Task 3: Update seed to create Arcium product and assign courses

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Update the seed file**

Replace the top of `prisma/seed.ts` with the following (keep all `COURSES` data unchanged):

```typescript
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type CourseLevel } from "@prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const ARCIUM_PRODUCT = {
  id: "product_arcium",
  name: "Arcium",
  slug: "arcium",
  description:
    "Arcium is a network for private computation. Programs can use sensitive data to produce results without exposing the underlying data itself.",
  links: [
    { label: "Website", url: "https://arcium.com" },
    { label: "Docs", url: "https://docs.arcium.com" },
    { label: "X", url: "https://x.com/arciumhq" },
  ],
  status: "published" as const,
};
```

- [ ] **Step 2: Add product upsert at the start of `main()`**

In the `main()` function, before the `for (const c of COURSES)` loop, add:

```typescript
  await prisma.product.upsert({
    where: { id: ARCIUM_PRODUCT.id },
    update: {
      name: ARCIUM_PRODUCT.name,
      description: ARCIUM_PRODUCT.description,
      links: ARCIUM_PRODUCT.links,
      status: ARCIUM_PRODUCT.status,
    },
    create: {
      id: ARCIUM_PRODUCT.id,
      name: ARCIUM_PRODUCT.name,
      slug: ARCIUM_PRODUCT.slug,
      description: ARCIUM_PRODUCT.description,
      links: ARCIUM_PRODUCT.links,
      status: ARCIUM_PRODUCT.status,
    },
  });
  console.log("✓ Product: Arcium");
```

- [ ] **Step 3: Update `seedCourse` to require `productId` and remove `partnerName`**

Update the `SeedCourse` type:

```typescript
type SeedCourse = {
  productId: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  level: CourseLevel;
  estimatedDuration: number;
  learningOutcomes: string[];
  lessons: { title: string; content: string }[];
  passThreshold: number;
  questions: SeedQuestion[];
  badge: { name: string; description: string };
};
```

Update `prisma.course.upsert` in `seedCourse` — replace `partnerName` with `productId`:

```typescript
  const course = await prisma.course.upsert({
    where: { productId_slug: { productId: c.productId, slug: c.slug } },
    update: {
      title: c.title,
      summary: c.summary,
      description: c.description,
      level: c.level,
      status: "published",
      estimatedDuration: c.estimatedDuration,
      learningOutcomes: c.learningOutcomes,
    },
    create: {
      productId: c.productId,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      description: c.description,
      level: c.level,
      status: "published",
      estimatedDuration: c.estimatedDuration,
      learningOutcomes: c.learningOutcomes,
    },
  });
```

- [ ] **Step 4: Add `productId: "product_arcium"` to each course in `COURSES`**

In the `COURSES` array, add `productId: "product_arcium"` to the first object (after `slug`), and do the same for the second course object. Remove the `partnerName` field from both.

- [ ] **Step 5: Run seed to verify**

```bash
pnpm db:seed
```

Expected output:
```
✓ Product: Arcium
✓ Seeded course: Welcome to Arcium
✓ Seeded course: Getting Started with Private Apps
✓ Staff admin: <wallet>

Seed complete.
```

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): create Arcium product and assign launch courses"
```

---

### Task 4: Add path helper and update data-access layer

**Files:**
- Create: `src/lib/paths.ts`
- Modify: `src/lib/courses.ts`

- [ ] **Step 1: Create `src/lib/paths.ts`**

```typescript
export function productPath(productSlug: string) {
  return `/products/${productSlug}`;
}

export function coursePath(productSlug: string, courseSlug: string) {
  return `/products/${productSlug}/courses/${courseSlug}`;
}

export function lessonPath(
  productSlug: string,
  courseSlug: string,
  lessonId: string
) {
  return `/products/${productSlug}/courses/${courseSlug}/lessons/${lessonId}`;
}

export function quizPath(productSlug: string, courseSlug: string) {
  return `/products/${productSlug}/courses/${courseSlug}/quiz`;
}
```

- [ ] **Step 2: Add `getCourseBySlugs` and update catalog query in `src/lib/courses.ts`**

Replace the existing `getPublishedCourses` and add `getCourseBySlugs` below `getCourseBySlug`:

```typescript
import { prisma } from "@/lib/prisma";

/** Catalog cards: published courses with product metadata and light counts. */
export async function getPublishedCourses() {
  return prisma.course.findMany({
    where: {
      status: "published",
      product: { status: "published" },
    },
    orderBy: { createdAt: "asc" },
    include: {
      badge: true,
      product: { select: { slug: true, name: true, logoUrl: true } },
      _count: { select: { lessons: { where: { status: "published" } } } },
    },
  });
}

export async function getCourseBySlug(slug: string) {
  return prisma.course.findFirst({
    where: { slug, status: "published" },
    include: {
      badge: true,
      product: { select: { slug: true, name: true, logoUrl: true } },
      lessons: {
        where: { status: "published" },
        orderBy: { order: "asc" },
      },
      quizzes: {
        include: { _count: { select: { questions: true } } },
      },
    },
  });
}

/** Lookup by (productSlug, courseSlug) — canonical for nested routes. */
export async function getCourseBySlugs(
  productSlug: string,
  courseSlug: string
) {
  return prisma.course.findFirst({
    where: {
      slug: courseSlug,
      status: "published",
      product: { slug: productSlug, status: "published" },
    },
    include: {
      badge: true,
      product: { select: { slug: true, name: true, logoUrl: true } },
      lessons: {
        where: { status: "published" },
        orderBy: { order: "asc" },
      },
      quizzes: {
        include: { _count: { select: { questions: true } } },
      },
    },
  });
}
```

- [ ] **Step 3: Create `src/lib/products.ts`**

```typescript
import { prisma } from "@/lib/prisma";

export async function getPublishedProducts() {
  return prisma.product.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { courses: { where: { status: "published" } } },
      },
    },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "published" },
    include: {
      courses: {
        where: { status: "published" },
        orderBy: { createdAt: "asc" },
        include: {
          badge: true,
          _count: {
            select: { lessons: { where: { status: "published" } } },
          },
        },
      },
    },
  });
}
```

- [ ] **Step 4: Build to confirm no TypeScript errors**

```bash
pnpm build
```

Expected: build succeeds (the old flat routes still exist at this point — they will be removed in Phase 2).

- [ ] **Step 5: Commit**

```bash
git add src/lib/paths.ts src/lib/courses.ts src/lib/products.ts
git commit -m "feat(lib): add path helpers, product data access, composite course lookup"
```

---

## Phase 2 — Public Product & Nested Course Routes

### Task 5: Add `ProductCard` and `Breadcrumbs` components

**Files:**
- Create: `src/components/product-card.tsx`
- Create: `src/components/breadcrumbs.tsx`

- [ ] **Step 1: Create `src/components/product-card.tsx`**

```typescript
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { productPath } from "@/lib/paths";

export type ProductCardData = {
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  courseCount: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={productPath(product.slug)} className="group block">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            {product.logoUrl ? (
              <Image
                src={product.logoUrl}
                alt={`${product.name} logo`}
                width={40}
                height={40}
                className="rounded-md object-contain"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                {product.name[0]}
              </span>
            )}
            <h3 className="font-semibold leading-snug tracking-tight group-hover:text-primary">
              {product.name}
            </h3>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="size-3.5" />
            {product.courseCount} course{product.courseCount === 1 ? "" : "s"}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create `src/components/breadcrumbs.tsx`**

```typescript
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({
  crumbs,
  className,
}: {
  crumbs: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground",
        className
      )}
    >
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product-card.tsx src/components/breadcrumbs.tsx
git commit -m "feat(components): add ProductCard and Breadcrumbs"
```

---

### Task 6: Add `/products` index page

**Files:**
- Create: `src/app/products/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getPublishedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Ecosystem products with official Arcademy learning paths.",
};

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  try {
    products = await getPublishedProducts();
  } catch {
    products = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
        <p className="mt-2 text-muted-foreground">
          Official ecosystem products with Arcademy learning paths. Pick a
          product to learn what it does and start a course.
        </p>
      </header>

      {products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                slug: p.slug,
                name: p.name,
                description: p.description,
                logoUrl: p.logoUrl,
                courseCount: p._count.courses,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <Boxes className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No products yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon — the Arcademy team is adding products.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the page builds**

```bash
pnpm build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/products/page.tsx
git commit -m "feat(products): add /products index page"
```

---

### Task 7: Add `/products/[productSlug]` landing page

**Files:**
- Create: `src/app/products/[productSlug]/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getProductBySlug } from "@/lib/products";
import { productPath } from "@/lib/paths";

type Props = { params: Promise<{ productSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;
  try {
    const product = await getProductBySlug(productSlug);
    if (product)
      return { title: product.name, description: product.description };
  } catch {
    /* ignore */
  }
  return { title: "Product" };
}

type ProductLink = { label: string; url: string };

export default async function ProductLandingPage({ params }: Props) {
  const { productSlug } = await params;

  let product: Awaited<ReturnType<typeof getProductBySlug>>;
  try {
    product = await getProductBySlug(productSlug);
  } catch {
    product = null;
  }
  if (!product) notFound();

  const links = (product.links as ProductLink[]) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
      />

      {/* Hero */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {product.logoUrl ? (
          <Image
            src={product.logoUrl}
            alt={`${product.name} logo`}
            width={72}
            height={72}
            className="shrink-0 rounded-xl object-contain"
          />
        ) : (
          <span className="flex size-[72px] shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
            {product.name[0]}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {product.description}
          </p>
          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((link) => (
                <Button key={link.url} variant="outline" size="sm" asChild>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                    {link.label}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Courses */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">
          Learn {product.name}
        </h2>
        {product.courses.length > 0 ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {product.courses.map((c) => (
              <CourseCard
                key={c.id}
                course={{
                  productSlug: product!.slug,
                  productName: product!.name,
                  productLogoUrl: product!.logoUrl,
                  courseSlug: c.slug,
                  title: c.title,
                  summary: c.summary,
                  level: c.level,
                  thumbnailUrl: c.thumbnailUrl,
                  estimatedDuration: c.estimatedDuration,
                  lessonCount: c._count.lessons,
                  hasBadge: Boolean(c.badge),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <BookOpen className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Courses for this product are coming soon.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/products/[productSlug]/page.tsx
git commit -m "feat(products): add /products/[productSlug] landing page"
```

---

### Task 8: Update `CourseCard` and `CourseStartPanel` for nested URLs

**Files:**
- Modify: `src/components/course-card.tsx`
- Modify: `src/components/course-start-panel.tsx`

- [ ] **Step 1: Rewrite `src/components/course-card.tsx`**

```typescript
import Link from "next/link";
import Image from "next/image";
import { Clock, BookOpen, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/level-badge";
import { formatDuration } from "@/lib/utils";
import { coursePath, productPath } from "@/lib/paths";
import type { CourseLevel } from "@prisma/client";

export type CourseCardData = {
  productSlug: string;
  productName: string;
  productLogoUrl: string | null;
  courseSlug: string;
  title: string;
  summary: string;
  level: CourseLevel;
  thumbnailUrl: string | null;
  estimatedDuration: number | null;
  lessonCount: number;
  hasBadge: boolean;
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={coursePath(course.productSlug, course.courseSlug)}
      className="group block"
    >
      <Card className="h-full gap-0 overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-primary/15 via-accent to-secondary">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="size-10 text-primary/40" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <LevelBadge level={course.level} />
          </div>
        </div>
        <CardContent className="flex flex-col gap-3 p-5">
          <Link
            href={productPath(course.productSlug)}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            {course.productLogoUrl && (
              <Image
                src={course.productLogoUrl}
                alt={course.productName}
                width={14}
                height={14}
                className="rounded-sm object-contain"
              />
            )}
            {course.productName}
          </Link>
          <h3 className="font-semibold leading-snug tracking-tight group-hover:text-primary">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.summary}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatDuration(course.estimatedDuration)}
            </span>
            {course.hasBadge && (
              <Badge variant="muted">
                <Award />
                Badge
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Update `src/components/course-start-panel.tsx`**

Replace the file with a version that accepts `productSlug` and uses `lessonPath`:

```typescript
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Play, CheckCircle2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startCourse } from "@/app/actions/learn";
import { lessonPath } from "@/lib/paths";

type Props = {
  courseId: string;
  productSlug: string;
  courseSlug: string;
  isAuthed: boolean;
  started: boolean;
  completed: boolean;
  nextLessonId: string | null;
};

export function CourseStartPanel({
  courseId,
  productSlug,
  courseSlug,
  isAuthed,
  started,
  completed,
  nextLessonId,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const lessonHref = (lessonId: string) =>
    lessonPath(productSlug, courseSlug, lessonId);

  async function handleStart() {
    setBusy(true);
    setError(null);
    const res = await startCourse(courseId);
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    if (res.firstLessonId) router.push(lessonHref(res.firstLessonId));
  }

  if (!isAuthed) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-center">
        <Wallet className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Connect your wallet to start</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use "Connect wallet" at the top right to track progress, take
          quizzes, and earn the badge.
        </p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          Course completed
        </div>
        {nextLessonId && (
          <Button variant="outline" className="w-full" asChild>
            <a href={lessonHref(nextLessonId)}>Review lessons</a>
          </Button>
        )}
      </div>
    );
  }

  if (started && nextLessonId) {
    return (
      <Button className="w-full" asChild>
        <a href={lessonHref(nextLessonId)}>
          Continue learning
          <ArrowRight />
        </a>
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleStart} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Play />}
        Start course
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/course-card.tsx src/components/course-start-panel.tsx
git commit -m "feat(components): update CourseCard and CourseStartPanel for nested URLs"
```

---

### Task 9: Add nested course detail page

**Files:**
- Create: `src/app/products/[productSlug]/courses/[courseSlug]/page.tsx`

- [ ] **Step 1: Create the page**

This is the current `src/app/courses/[slug]/page.tsx` adapted for the new route params and calling `getCourseBySlugs` instead of `getCourseBySlug`. The full JSX body is identical — only imports and params change:

```typescript
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  BookOpen,
  Award,
  Wallet,
  CheckCircle2,
  Circle,
  Lock,
  HelpCircle,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/level-badge";
import { CourseStartPanel } from "@/components/course-start-panel";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { formatDuration } from "@/lib/utils";
import { productPath } from "@/lib/paths";
import { getCourseBySlugs, getFinalQuiz, getLearnerCourseState } from "@/lib/courses";
import { getCurrentUser } from "@/lib/session";

type Props = {
  params: Promise<{ productSlug: string; courseSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug, courseSlug } = await params;
  try {
    const course = await getCourseBySlugs(productSlug, courseSlug);
    if (course)
      return {
        title: `${course.title} · ${course.product.name}`,
        description: course.summary,
      };
  } catch {
    /* ignore */
  }
  return { title: "Course" };
}

export default async function CourseDetailPage({ params }: Props) {
  const { productSlug, courseSlug } = await params;

  let course;
  try {
    course = await getCourseBySlugs(productSlug, courseSlug);
  } catch {
    course = null;
  }
  if (!course) notFound();

  const user = await getCurrentUser();
  const finalQuiz = getFinalQuiz(course.quizzes);

  const state = user
    ? await getLearnerCourseState(user.id, course.id, finalQuiz?.id ?? null)
    : null;

  const completedCount = state
    ? course.lessons.filter((l) => state.completedLessonIds.has(l.id)).length
    : 0;
  const totalSteps = course.lessons.length + (finalQuiz ? 1 : 0);
  const doneSteps = completedCount + (state?.finalQuizPassed ? 1 : 0);
  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const nextLesson =
    course.lessons.find((l) => !state?.completedLessonIds.has(l.id)) ??
    course.lessons[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { label: "Products", href: "/products" },
          { label: course.product.name, href: productPath(productSlug) },
          { label: course.title },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <Link
            href={productPath(productSlug)}
            className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            {course.product.name}
          </Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {course.summary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <LevelBadge level={course.level} />
            <Badge variant="muted">
              <Clock />
              {formatDuration(course.estimatedDuration)}
            </Badge>
            <Badge variant="muted">
              <BookOpen />
              {course.lessons.length} lesson
              {course.lessons.length === 1 ? "" : "s"}
            </Badge>
            {course.badge && (
              <Badge variant="default">
                <Award />
                Earns a badge
              </Badge>
            )}
          </div>

          {course.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">About this course</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {course.description}
              </p>
            </div>
          )}

          {course.learningOutcomes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">What you&apos;ll learn</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {course.learningOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-lg font-semibold">Course content</h2>
            <div className="mt-3 overflow-hidden rounded-xl border">
              {course.lessons.map((lesson, i) => {
                const done = state?.completedLessonIds.has(lesson.id);
                const locked = !user;
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    {done ? (
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                    ) : locked ? (
                      <Lock className="size-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 text-sm">
                      <span className="text-muted-foreground">
                        Lesson {i + 1}:{" "}
                      </span>
                      {lesson.title}
                    </span>
                  </div>
                );
              })}
              {finalQuiz && (
                <div className="flex items-center gap-3 bg-muted/40 px-4 py-3">
                  {state?.finalQuizPassed ? (
                    <CheckCircle2 className="size-5 shrink-0 text-success" />
                  ) : (
                    <HelpCircle className="size-5 shrink-0 text-primary" />
                  )}
                  <span className="flex-1 text-sm font-medium">
                    Final quiz
                    <span className="ml-2 font-normal text-muted-foreground">
                      Pass at {finalQuiz.passThreshold}% to complete
                    </span>
                  </span>
                </div>
              )}
              {course.lessons.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Lessons are being prepared for this course.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-primary/15 via-accent to-secondary">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="size-10 text-primary/40" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-5 p-5">
                {state && state.startedAt && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium">Your progress</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                )}

                <CourseStartPanel
                  courseId={course.id}
                  productSlug={productSlug}
                  courseSlug={courseSlug}
                  isAuthed={Boolean(user)}
                  started={Boolean(state?.startedAt)}
                  completed={
                    Boolean(state?.badgeAwarded) ||
                    (totalSteps > 0 && doneSteps === totalSteps)
                  }
                  nextLessonId={nextLesson?.id ?? null}
                />

                <Separator />

                <ul className="space-y-3 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium capitalize">
                      {course.level}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Estimated time
                    </span>
                    <span className="font-medium">
                      {formatDuration(course.estimatedDuration)}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lessons</span>
                    <span className="font-medium">
                      {course.lessons.length}
                    </span>
                  </li>
                  {course.badge && (
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reward</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Award className="size-4 text-primary" />
                        {course.badge.name}
                      </span>
                    </li>
                  )}
                </ul>

                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <Wallet className="mt-0.5 size-4 shrink-0" />
                  <span>
                    A connected Solana wallet is required to track progress,
                    take quizzes, and earn the badge.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/products/[productSlug]/courses/[courseSlug]/page.tsx"
git commit -m "feat(routes): add nested course detail page"
```

---

### Task 10: Add nested lesson page

**Files:**
- Create: `src/app/products/[productSlug]/courses/[courseSlug]/lessons/[lessonId]/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Circle, HelpCircle, ChevronLeft } from "lucide-react";
import { LessonContent } from "@/components/lesson-content";
import { LessonActions } from "@/components/lesson-actions";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { coursePath, lessonPath, quizPath, productPath } from "@/lib/paths";
import { getCourseBySlugs, getFinalQuiz } from "@/lib/courses";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    productSlug: string;
    courseSlug: string;
    lessonId: string;
  }>;
};

export default async function LessonPage({ params }: Props) {
  const { productSlug, courseSlug, lessonId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(coursePath(productSlug, courseSlug));

  let course;
  try {
    course = await getCourseBySlugs(productSlug, courseSlug);
  } catch {
    course = null;
  }
  if (!course) notFound();

  const lessonIndex = course.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) notFound();
  const lesson = course.lessons[lessonIndex];

  const finalQuiz = getFinalQuiz(course.quizzes);

  const progress = await prisma.progress.findMany({
    where: { userId: user.id, courseId: course.id },
    select: { lessonId: true, completed: true },
  });
  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.lessonId)
  );

  const nextLesson = course.lessons[lessonIndex + 1];
  const isLast = lessonIndex === course.lessons.length - 1;

  let nextHref: string;
  let nextLabel: string;
  if (nextLesson) {
    nextHref = lessonPath(productSlug, courseSlug, nextLesson.id);
    nextLabel = "Next lesson";
  } else if (finalQuiz) {
    nextHref = quizPath(productSlug, courseSlug);
    nextLabel = "Go to quiz";
  } else {
    nextHref = coursePath(productSlug, courseSlug);
    nextLabel = "Finish";
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <Breadcrumbs
          className="mb-2"
          crumbs={[
            { label: "Products", href: "/products" },
            { label: course.product.name, href: productPath(productSlug) },
            { label: course.title, href: coursePath(productSlug, courseSlug) },
          ]}
        />
        <nav className="overflow-hidden rounded-xl border">
          {course.lessons.map((l) => {
            const done = completedSet.has(l.id);
            const active = l.id === lessonId;
            return (
              <Link
                key={l.id}
                href={lessonPath(productSlug, courseSlug, l.id)}
                className={cn(
                  "flex items-center gap-2.5 border-b px-3 py-2.5 text-sm transition-colors last:border-b-0",
                  active ? "bg-accent font-medium" : "hover:bg-muted/50"
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="line-clamp-2">{l.title}</span>
              </Link>
            );
          })}
          {finalQuiz && (
            <Link
              href={quizPath(productSlug, courseSlug)}
              className="flex items-center gap-2.5 bg-muted/40 px-3 py-2.5 text-sm font-medium hover:bg-muted/70"
            >
              <HelpCircle className="size-4 shrink-0 text-primary" />
              Final quiz
            </Link>
          )}
        </nav>
      </aside>

      {/* Lesson body */}
      <article className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">
          Lesson {lessonIndex + 1} of {course.lessons.length}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {lesson.title}
        </h1>

        {lesson.mediaUrl && (
          <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl border bg-muted">
            <Image
              src={lesson.mediaUrl}
              alt={lesson.title}
              fill
              sizes="(max-width: 1024px) 100vw, 760px"
              className="object-cover"
            />
          </div>
        )}

        <div className="mt-6">
          <LessonContent content={lesson.content} />
        </div>

        <Separator className="my-8" />

        <div className="flex items-center justify-between gap-4">
          {lessonIndex > 0 ? (
            <Link
              href={lessonPath(
                productSlug,
                courseSlug,
                course.lessons[lessonIndex - 1].id
              )}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Link>
          ) : (
            <span />
          )}
          <LessonActions
            lessonId={lesson.id}
            alreadyComplete={completedSet.has(lesson.id)}
            nextHref={nextHref}
            nextLabel={nextLabel}
          />
        </div>
        {isLast && !finalQuiz && (
          <p className="mt-4 text-right text-xs text-muted-foreground">
            Completing this lesson finishes the course.
          </p>
        )}
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/products/[productSlug]/courses/[courseSlug]/lessons/[lessonId]/page.tsx"
git commit -m "feat(routes): add nested lesson page"
```

---

### Task 11: Add nested quiz page and update `QuizRunner`

**Files:**
- Create: `src/app/products/[productSlug]/courses/[courseSlug]/quiz/page.tsx`
- Modify: `src/components/quiz-runner.tsx`

- [ ] **Step 1: Create the nested quiz page**

```typescript
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, HelpCircle } from "lucide-react";
import { QuizRunner } from "@/components/quiz-runner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { coursePath, productPath } from "@/lib/paths";
import { getCourseBySlugs, getFinalQuiz } from "@/lib/courses";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ productSlug: string; courseSlug: string }>;
};

export default async function QuizPage({ params }: Props) {
  const { productSlug, courseSlug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(coursePath(productSlug, courseSlug));

  let course;
  try {
    course = await getCourseBySlugs(productSlug, courseSlug);
  } catch {
    course = null;
  }
  if (!course) notFound();

  const finalQuizMeta = getFinalQuiz(course.quizzes);
  if (!finalQuizMeta) notFound();

  const quiz = await prisma.quiz.findUnique({
    where: { id: finalQuizMeta.id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, answerOptions: true },
      },
    },
  });
  if (!quiz) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { label: "Products", href: "/products" },
          { label: course.product.name, href: productPath(productSlug) },
          { label: course.title, href: coursePath(productSlug, courseSlug) },
          { label: "Quiz" },
        ]}
      />

      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HelpCircle className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {quiz.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Pass at {quiz.passThreshold}% to complete the course.
          </p>
        </div>
      </div>

      {quiz.questions.length === 0 ? (
        <Alert variant="info">
          <HelpCircle />
          <AlertTitle>Quiz coming soon</AlertTitle>
          <AlertDescription>
            This quiz doesn&apos;t have any questions yet. Check back later.
          </AlertDescription>
        </Alert>
      ) : (
        <QuizRunner
          quizId={quiz.id}
          passThreshold={quiz.passThreshold}
          questions={quiz.questions}
          productSlug={productSlug}
          courseSlug={courseSlug}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `src/components/quiz-runner.tsx`**

Replace `courseSlug: string` in the `Props` type and all uses with `productSlug + courseSlug`:

Change the `Props` type at the top:

```typescript
type Props = {
  quizId: string;
  passThreshold: number;
  questions: Question[];
  productSlug: string;
  courseSlug: string;
};
```

Change the function signature:

```typescript
export function QuizRunner({
  quizId,
  passThreshold,
  questions,
  productSlug,
  courseSlug,
}: Props) {
```

Replace the "Back to course" link in the result view (the only hardcoded course URL inside `quiz-runner.tsx`):

```typescript
// Before
<Link href={`/courses/${courseSlug}`}>Back to course</Link>

// After
import { coursePath } from "@/lib/paths";
// …
<Link href={coursePath(productSlug, courseSlug)}>Back to course</Link>
```

Add `import { coursePath } from "@/lib/paths";` at the top of the file.

- [ ] **Step 3: Commit**

```bash
git add "src/app/products/[productSlug]/courses/[courseSlug]/quiz/page.tsx" src/components/quiz-runner.tsx
git commit -m "feat(routes): add nested quiz page; update QuizRunner for nested URLs"
```

---

### Task 12: Delete the old flat course routes

**Files:**
- Delete: `src/app/courses/[slug]/page.tsx`
- Delete: `src/app/courses/[slug]/lessons/[lessonId]/page.tsx`
- Delete: `src/app/courses/[slug]/quiz/page.tsx`

- [ ] **Step 1: Delete the old pages**

```bash
Remove-Item -Recurse "src/app/courses/[slug]"
```

Or delete the directory `src/app/courses/[slug]` manually in the IDE.

- [ ] **Step 2: Build to confirm no dangling imports**

```bash
pnpm build
```

Expected: build succeeds. Any TypeScript errors indicate an import of the deleted files — fix those by removing or updating the import.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old flat /courses/[slug] routes (now 404)"
```

---

## Phase 3 — Catalog, Homepage, Nav & Footer

### Task 13: Update the `/courses` catalog

**Files:**
- Modify: `src/app/courses/page.tsx`

- [ ] **Step 1: Rewrite the catalog page**

```typescript
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { getPublishedCourses } from "@/lib/courses";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "All official Arcium ecosystem courses on Arcademy.",
};

export default async function CoursesPage() {
  let courses: Awaited<ReturnType<typeof getPublishedCourses>> = [];
  try {
    courses = await getPublishedCourses();
  } catch {
    courses = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
        <p className="mt-2 text-muted-foreground">
          All official courses across the Arcium ecosystem. Browse freely —
          connect a wallet when you&apos;re ready to track progress and earn
          badges.
        </p>
      </header>

      {courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={{
                productSlug: c.product.slug,
                productName: c.product.name,
                productLogoUrl: c.product.logoUrl,
                courseSlug: c.slug,
                title: c.title,
                summary: c.summary,
                level: c.level,
                thumbnailUrl: c.thumbnailUrl,
                estimatedDuration: c.estimatedDuration,
                lessonCount: c._count.lessons,
                hasBadge: Boolean(c.badge),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No courses available yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon — the Arcademy team is preparing the first courses.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/courses/page.tsx
git commit -m "feat(catalog): update /courses with product attribution and nested links"
```

---

### Task 14: Update nav, footer, and homepage

**Files:**
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/site-footer.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add Products link to `site-header.tsx`**

In the `<nav>` block, before the Courses button:

```typescript
<Button variant="ghost" size="sm" asChild>
  <Link href="/products">Products</Link>
</Button>
<Button variant="ghost" size="sm" asChild>
  <Link href="/courses">Courses</Link>
</Button>
```

- [ ] **Step 2: Add Products link to `site-footer.tsx`**

```typescript
<Link href="/products" className="hover:text-foreground">
  Products
</Link>
<Link href="/courses" className="hover:text-foreground">
  Courses
</Link>
```

- [ ] **Step 3: Update `src/app/page.tsx`**

Add an "Explore products" section. The section goes after the value-props section and before "Featured courses". Replace the featured courses card data to use the new `CourseCardData` shape:

Add to imports at the top:
```typescript
import { ProductCard } from "@/components/product-card";
import { getPublishedProducts } from "@/lib/products";
import { Boxes } from "lucide-react";
```

Add after `const featured = courses.slice(0, 3);`:
```typescript
  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  try {
    products = await getPublishedProducts();
  } catch {
    products = [];
  }
  const featuredProducts = products.slice(0, 3);
```

Add the "Explore products" section after the value-props section:
```typescript
      {/* Explore products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Explore products
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ecosystem products with official learning paths.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/products">
                View all
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  slug: p.slug,
                  name: p.name,
                  description: p.description,
                  logoUrl: p.logoUrl,
                  courseCount: p._count.courses,
                }}
              />
            ))}
          </div>
        </section>
      )}
```

Update the `featured.map(…)` CourseCard props:
```typescript
            {featured.map((c) => (
              <CourseCard
                key={c.id}
                course={{
                  productSlug: c.product.slug,
                  productName: c.product.name,
                  productLogoUrl: c.product.logoUrl,
                  courseSlug: c.slug,
                  title: c.title,
                  summary: c.summary,
                  level: c.level,
                  thumbnailUrl: c.thumbnailUrl,
                  estimatedDuration: c.estimatedDuration,
                  lessonCount: c._count.lessons,
                  hasBadge: Boolean(c.badge),
                }}
              />
            ))}
```

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add src/components/site-header.tsx src/components/site-footer.tsx src/app/page.tsx
git commit -m "feat(nav): add Products to header, footer, and homepage"
```

---

### Task 15: Update profile page

**Files:**
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: Update profile page queries to include product slug**

In the `prisma.badgeAward.findMany` call, update the `course` include:

```typescript
    prisma.badgeAward.findMany({
      where: { userId: user.id },
      orderBy: { awardedAt: "desc" },
      include: {
        badge: true,
        course: {
          select: {
            slug: true,
            title: true,
            product: { select: { slug: true } },
          },
        },
      },
    }),
```

In the `prisma.progress.findMany` call, add `product` to the course select:

```typescript
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            product: { select: { slug: true } },
            _count: { select: { lessons: { where: { status: "published" } } } },
            quizzes: { where: { lessonId: null }, select: { id: true } },
          },
        },
```

- [ ] **Step 2: Update the `CourseAgg` type and `byCourse` map to include `productSlug`**

```typescript
  type CourseAgg = {
    slug: string;
    productSlug: string;
    title: string;
    totalLessons: number;
    completedLessons: number;
    finalQuizId: string | null;
    completed: boolean;
  };
```

In `byCourse.set(c.id, agg)`:
```typescript
      agg = {
        slug: c.slug,
        productSlug: c.product.slug,
        title: c.title,
        totalLessons: c._count.lessons,
        completedLessons: 0,
        finalQuizId: c.quizzes[0]?.id ?? null,
        completed: awardedCourseIds.has(c.id),
      };
```

- [ ] **Step 3: Update `CourseProgressRow` to use `coursePath`**

Add import at top of file:
```typescript
import { coursePath } from "@/lib/paths";
```

Update `CourseProgressRow` signature and href:
```typescript
function CourseProgressRow({
  slug,
  productSlug,
  title,
  pct,
  completed,
}: {
  slug: string;
  productSlug: string;
  title: string;
  pct: number;
  completed: boolean;
}) {
  return (
    <Link href={coursePath(productSlug, slug)} className="block">
```

- [ ] **Step 4: Build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/page.tsx
git commit -m "feat(profile): update course links to nested product-scoped URLs"
```

---

## Phase 4 — Admin: Product CRUD & Course Assignment

### Task 16: Add product server actions

**Files:**
- Create: `src/app/actions/admin-products.ts`

- [ ] **Step 1: Create the file**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

async function uniqueProductSlug(
  base: string,
  ignoreId?: string
): Promise<string> {
  const root = slugify(base) || "product";
  let slug = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

async function guard(): Promise<string | null> {
  try {
    await requireStaff();
    return null;
  } catch {
    return "You must be signed in as staff to do this.";
  }
}

const linkSchema = z.object({
  label: z.string().min(1).max(40),
  url: z.string().url("Each link must be a valid URL."),
});

const productSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  description: z.string().min(2, "Description is required").max(4000),
  logoUrl: z.string().optional().nullable(),
  links: z.array(linkSchema).max(10).optional().default([]),
});

export async function createProduct(
  raw: z.input<typeof productSchema>
): Promise<Result<{ id: string }>> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: await uniqueProductSlug(data.name),
      description: data.description,
      logoUrl: data.logoUrl || null,
      links: data.links,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true, id: product.id };
}

export async function updateProduct(
  id: string,
  raw: z.input<typeof productSchema>
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) return { error: "Product not found." };

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug:
        slugify(data.name) === current.slug
          ? current.slug
          : await uniqueProductSlug(data.name, id),
      description: data.description,
      logoUrl: data.logoUrl || null,
      links: data.links,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/products/${current.slug}`);
  revalidatePath("/products");
  return { ok: true };
}

export async function setProductStatus(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };

  await prisma.product.update({ where: { id }, data: { status } });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/products");
  return { ok: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/admin-products.ts
git commit -m "feat(admin): product server actions (create, update, status)"
```

---

### Task 17: Update course server actions

**Files:**
- Modify: `src/app/actions/admin.ts`

- [ ] **Step 1: Replace `partnerName` with `productId` in `courseSchema`**

```typescript
const courseSchema = z.object({
  title: z.string().min(2, "Title is required").max(140),
  productId: z.string().min(1, "Select a product."),
  summary: z.string().min(2, "Summary is required").max(400),
  description: z.string().max(8000).optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  thumbnailUrl: z.string().optional().nullable(),
  estimatedDuration: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  learningOutcomes: z.array(z.string().max(280)).max(20).optional(),
});
```

- [ ] **Step 2: Update `uniqueSlug` to be per-product**

```typescript
async function uniqueSlug(
  base: string,
  productId: string,
  ignoreId?: string
): Promise<string> {
  const root = slugify(base) || "course";
  let slug = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.course.findFirst({
      where: { slug, productId },
    });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}
```

- [ ] **Step 3: Update `createCourse`**

Replace `partnerName` and pass `productId`:

```typescript
export async function createCourse(
  raw: z.input<typeof courseSchema>
): Promise<Result<{ id: string }>> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { slug: true },
  });
  if (!product) return { error: "Product not found." };

  const course = await prisma.course.create({
    data: {
      productId: data.productId,
      title: data.title,
      slug: await uniqueSlug(data.title, data.productId),
      summary: data.summary,
      description: data.description || null,
      level: data.level,
      thumbnailUrl: data.thumbnailUrl || null,
      estimatedDuration: data.estimatedDuration ?? null,
      learningOutcomes: (data.learningOutcomes ?? []).filter(Boolean),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/courses");
  return { ok: true, id: course.id };
}
```

- [ ] **Step 4: Update `updateCourse`**

```typescript
export async function updateCourse(
  id: string,
  raw: z.input<typeof courseSchema>
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const current = await prisma.course.findUnique({
    where: { id },
    include: { product: { select: { slug: true } } },
  });
  if (!current) return { error: "Course not found." };

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { slug: true },
  });
  if (!product) return { error: "Product not found." };

  const newSlug =
    slugify(data.title) === current.slug && data.productId === current.productId
      ? current.slug
      : await uniqueSlug(data.title, data.productId, id);

  await prisma.course.update({
    where: { id },
    data: {
      productId: data.productId,
      title: data.title,
      slug: newSlug,
      summary: data.summary,
      description: data.description || null,
      level: data.level,
      thumbnailUrl: data.thumbnailUrl || null,
      estimatedDuration: data.estimatedDuration ?? null,
      learningOutcomes: (data.learningOutcomes ?? []).filter(Boolean),
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath(`/products/${current.product.slug}/courses/${current.slug}`);
  revalidatePath(`/products/${product.slug}/courses/${newSlug}`);
  revalidatePath("/courses");
  return { ok: true };
}
```

- [ ] **Step 5: Update `setCourseStatus` to enforce product-published guard**

```typescript
export async function setCourseStatus(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<Result> {
  const err = await guard();
  if (err) return { error: err };

  if (status === "published") {
    const course = await prisma.course.findUnique({
      where: { id },
      include: { product: { select: { status: true } } },
    });
    if (!course) return { error: "Course not found." };
    if (course.product.status !== "published") {
      return {
        error:
          "The product this course belongs to must be published before the course can be published.",
      };
    }
    const lessonCount = await prisma.lesson.count({
      where: { courseId: id, status: "published" },
    });
    if (lessonCount === 0) {
      return { error: "Add at least one published lesson before publishing." };
    }
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: { product: { select: { slug: true } } },
  });
  if (!course) return { error: "Course not found." };

  await prisma.course.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath(`/products/${course.product.slug}/courses/${course.slug}`);
  revalidatePath("/courses");
  return { ok: true };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/admin.ts
git commit -m "feat(admin): update course actions — productId, per-product slugs, publish guard"
```

---

### Task 18: Add admin product form and UI

**Files:**
- Create: `src/components/admin/product-form.tsx`
- Create: `src/components/admin/product-status-controls.tsx`
- Create: `src/app/admin/products/page.tsx`
- Create: `src/app/admin/products/new/page.tsx`
- Create: `src/app/admin/products/[id]/page.tsx`

- [ ] **Step 1: Create `src/components/admin/product-status-controls.tsx`**

```typescript
"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setProductStatus } from "@/app/actions/admin-products";
import type { ProductStatus } from "@prisma/client";

export function ProductStatusControls({
  productId,
  status,
}: {
  productId: string;
  status: ProductStatus;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleStatus(next: "draft" | "published" | "archived") {
    setBusy(true);
    setError(null);
    const res = await setProductStatus(productId, next);
    setBusy(false);
    if ("error" in res) setError(res.error);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {status !== "published" && (
          <Button
            size="sm"
            onClick={() => handleStatus("published")}
            disabled={busy}
          >
            {busy ? <Loader2 className="animate-spin" /> : null}
            Publish
          </Button>
        )}
        {status === "published" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatus("draft")}
            disabled={busy}
          >
            Unpublish
          </Button>
        )}
        {status !== "archived" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatus("archived")}
            disabled={busy}
          >
            Archive
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/admin/product-form.tsx`**

```typescript
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { createProduct, updateProduct } from "@/app/actions/admin-products";

type Link = { label: string; url: string };

type Initial = {
  id?: string;
  name: string;
  description: string;
  logoUrl: string | null;
  links: Link[];
};

export function ProductForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
  const [logoUrl, setLogoUrl] = React.useState(initial?.logoUrl ?? "");
  const [links, setLinks] = React.useState<Link[]>(
    initial?.links?.length ? initial.links : [{ label: "", url: "" }]
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLink(i: number, field: keyof Link, value: string) {
    setLinks((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const payload = {
      name,
      description,
      logoUrl: logoUrl || null,
      links: links.filter((l) => l.label && l.url),
    };

    const res =
      isEdit && initial?.id
        ? await updateProduct(initial.id, payload)
        : await createProduct(payload);

    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    if (!isEdit && "id" in res) {
      router.push(`/admin/products/${res.id}`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Arcium"
          required
          maxLength={120}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this product does in plain language."
          rows={4}
          required
          maxLength={4000}
        />
      </div>

      <div className="grid gap-2">
        <Label>Logo</Label>
        <CloudinaryUpload
          value={logoUrl}
          onChange={setLogoUrl}
          resourceType="image"
          label="Upload logo"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Official links</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLink}
            disabled={links.length >= 10}
          >
            <Plus className="size-4" />
            Add link
          </Button>
        </div>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Label (e.g. Website)"
                value={link.label}
                onChange={(e) => updateLink(i, "label", e.target.value)}
                maxLength={40}
                className="w-36 shrink-0"
              />
              <Input
                placeholder="https://…"
                value={link.url}
                onChange={(e) => updateLink(i, "url", e.target.value)}
                type="url"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLink(i)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (
            <Loader2 className="animate-spin" />
          ) : saved ? (
            <Check />
          ) : (
            <Save />
          )}
          {isEdit ? "Save changes" : "Create product"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/products/page.tsx`**

```typescript
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductStatusControls } from "@/components/admin/product-status-controls";
import { prisma } from "@/lib/prisma";
import type { ProductStatus } from "@prisma/client";

const STATUS_VARIANT: Record<
  ProductStatus,
  "success" | "muted" | "secondary"
> = {
  published: "success",
  draft: "secondary",
  archived: "muted",
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { courses: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus />
            New product
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">No products yet.</p>
        )}
        {products.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.name}
                  </Link>
                  <Badge
                    variant={STATUS_VARIANT[p.status]}
                    className="capitalize"
                  >
                    {p.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  /{p.slug} · {p._count.courses} course
                  {p._count.courses === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/products/${p.id}`}>Edit</Link>
                </Button>
                <ProductStatusControls
                  productId={p.id}
                  status={p.status}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/admin/products/new/page.tsx`**

```typescript
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Products
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        New product
      </h1>
      <ProductForm />
    </div>
  );
}
```

- [ ] **Step 5: Create `src/app/admin/products/[id]/page.tsx`**

```typescript
import Link from "next/link";
import { ChevronLeft, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "@/components/admin/product-form";
import { ProductStatusControls } from "@/components/admin/product-status-controls";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/paths";
import type { ProductStatus } from "@prisma/client";

const STATUS_VARIANT: Record<
  ProductStatus,
  "success" | "muted" | "secondary"
> = {
  published: "success",
  draft: "secondary",
  archived: "muted",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const links = (product.links as { label: string; url: string }[]) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Products
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <Badge
              variant={STATUS_VARIANT[product.status]}
              className="capitalize"
            >
              {product.status}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            /products/{product.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {product.status === "published" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={productPath(product.slug)} target="_blank">
                <Eye />
                Preview
              </Link>
            </Button>
          )}
          <ProductStatusControls productId={product.id} status={product.status} />
        </div>
      </div>

      <div className="mt-8">
        <ProductForm
          initial={{
            id: product.id,
            name: product.name,
            description: product.description,
            logoUrl: product.logoUrl,
            links,
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Build**

```bash
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/product-form.tsx src/components/admin/product-status-controls.tsx src/app/admin/products/
git commit -m "feat(admin): product list, create, and edit pages"
```

---

### Task 19: Update course form for product selection

**Files:**
- Modify: `src/components/admin/course-details-form.tsx`
- Modify: `src/app/admin/courses/[id]/page.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Update `src/components/admin/course-details-form.tsx`**

Replace the `partnerName` field with a `productId` select. The form receives a `products` prop:

Change the `Initial` type:
```typescript
type Initial = {
  id?: string;
  productId: string;
  title: string;
  summary: string;
  description: string | null;
  level: CourseLevel;
  thumbnailUrl: string | null;
  estimatedDuration: number | null;
  learningOutcomes: string[];
};
```

Add a `products` prop:
```typescript
export function CourseDetailsForm({
  initial,
  products,
}: {
  initial?: Initial;
  products: { id: string; name: string }[];
}) {
```

Replace the `partnerName` state + field with `productId`:
```typescript
  const [productId, setProductId] = React.useState(
    initial?.productId ?? (products[0]?.id ?? "")
  );
```

In the form JSX, replace the partnerName input with a Select:
```typescript
      <div className="grid gap-2">
        <Label htmlFor="productId">Product</Label>
        <Select
          id="productId"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
```

In `handleSubmit`, replace `partnerName` with `productId` in the payload:
```typescript
    const payload = {
      productId,
      title,
      summary,
      description: description || null,
      level,
      thumbnailUrl: thumbnailUrl || null,
      estimatedDuration: estimatedDuration ? Number(estimatedDuration) : null,
      learningOutcomes: outcomes.map((o) => o.trim()).filter(Boolean),
    };
```

- [ ] **Step 2: Update `src/app/admin/courses/[id]/page.tsx`**

Fetch products and pass them to the editor. Fetch the course with product included:

```typescript
  const [course, products] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        product: { select: { slug: true, name: true } },
        lessons: { orderBy: { order: "asc" } },
        badge: true,
        quizzes: {
          where: { lessonId: null },
          include: { questions: { orderBy: { order: "asc" } } },
        },
      },
    }),
    prisma.product.findMany({
      where: { status: { not: "archived" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
```

Update the preview link:
```typescript
import { coursePath } from "@/lib/paths";
// ...
<Link href={coursePath(course.product.slug, course.slug)} target="_blank">
  <Eye />
  Preview
</Link>
```

Update the path display:
```typescript
<p className="mt-1 font-mono text-xs text-muted-foreground">
  /products/{course.product.slug}/courses/{course.slug}
</p>
```

Pass `products` to `CourseEditorTabs` (which passes them through to `CourseDetailsForm`):
- Update `CourseEditorTabs` to accept and forward `products`.
- Update `CourseDetailsForm` initial to include `productId: course.productId`.

- [ ] **Step 3: Update `src/app/admin/page.tsx`**

Add a Products section link at the top of the admin dashboard, before courses:

```typescript
import Link from "next/link";
// ...
<div className="flex items-center justify-between">
  <h2 className="text-lg font-semibold">Products</h2>
  <Button variant="outline" size="sm" asChild>
    <Link href="/admin/products">Manage products</Link>
  </Button>
</div>
```

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/course-details-form.tsx src/app/admin/courses/ src/app/admin/page.tsx
git commit -m "feat(admin): replace partnerName with product selector; update course editor"
```

---

## Phase 5 — Documentation & Verification

### Task 20: Update PRD and CONTEXT

**Files:**
- Modify: `docs/PRD.md`
- Modify: `CONTEXT.md`
- Modify: `README.md`

- [ ] **Step 1: Add to PRD V1 Scope (under "Build:")**

```markdown
- Public product index (`/products`) and product landing pages (`/products/[productSlug]`).
- Product-scoped course URLs: `/products/[slug]/courses/[slug]/…`
- Staff product CRUD: create, edit, publish, archive, manage logo and labeled links.
- Required course-to-product assignment (replaces `partnerName`).
```

- [ ] **Step 2: Update PRD user journey step 1**

```markdown
1. User visits Arcademy and browses **products** at `/products` or all courses at `/courses`.
2. User opens a **product page** to see what the product is and which courses are available.
3. User views **course overview** at the nested product-scoped URL.
```

- [ ] **Step 3: Add `Product` to PRD Core Data Model**

```markdown
### Product

Represents an ecosystem product (Arcium or a partner app).

Fields:
- `id`
- `name`
- `slug` (globally unique)
- `description`
- `logoUrl`
- `links` (JSON array of `{ label, url }`)
- `status` (`draft`, `published`, `archived`)
- `createdAt` / `updatedAt`
```

- [ ] **Step 4: Note `partnerName` removal and `productId` addition to Course in PRD**

Under the Course model, add: `- productId (required FK to Product)` and note that `partnerName` has been removed.

- [ ] **Step 5: Add to PRD Acceptance Criteria**

```markdown
- A visitor can browse `/products` without a wallet.
- A visitor can open `/products/arcium` and see description, logo, links, and courses.
- A visitor can open `/products/arcium/courses/welcome-to-arcium` without a wallet.
- `/courses` lists all published courses and every card links to the nested URL.
- Staff can create, edit, publish, and archive products.
- Staff can manage product logos and multiple labeled external links.
- Staff cannot publish a course under a draft product.
```

- [ ] **Step 6: Update `CONTEXT.md`**

Add `Product` row to the Core Concepts table:
```
| **Product** | Ecosystem product with a public landing page, logo, official links, and courses. Every course belongs to one product. |
```

Remove or replace the `Partner name` row:
```
| **Partner name** | Removed in V1. Courses belong to a Product instead. |
```

- [ ] **Step 7: Update `README.md`**

Update the routes section to reference `/products` and nested course URLs. Update seed note:
```markdown
pnpm db:seed     # seed Arcium product + two courses + staff admins
```

- [ ] **Step 8: Commit**

```bash
git add docs/PRD.md CONTEXT.md README.md
git commit -m "docs: update PRD, CONTEXT, and README for product pages"
```

---

### Task 21: Final build verification

- [ ] **Step 1: Run a clean build**

```bash
pnpm build
```

Expected:
```
✔ Generated Prisma Client (7.x.x) to .\generated in …ms
✓ Compiled successfully
✓ TypeScript …
Route (app)
  ƒ /products
  ƒ /products/[productSlug]
  ƒ /products/[productSlug]/courses/[courseSlug]
  ƒ /products/[productSlug]/courses/[courseSlug]/lessons/[lessonId]
  ƒ /products/[productSlug]/courses/[courseSlug]/quiz
  ƒ /courses
  …
```

- [ ] **Step 2: Run seed against the real DB**

```bash
pnpm db:seed
```

Expected: Arcium product + both launch courses + staff admin without errors.

- [ ] **Step 3: Manually verify acceptance criteria (in dev server)**

```bash
pnpm dev
```

Walk through:

| Check | URL |
|-------|-----|
| Products index loads | `http://localhost:3000/products` |
| Arcium product page loads | `http://localhost:3000/products/arcium` |
| Course loads under nested URL | `http://localhost:3000/products/arcium/courses/welcome-to-arcium` |
| Old flat URL returns 404 | `http://localhost:3000/courses/welcome-to-arcium` |
| Course catalog shows product attribution | `http://localhost:3000/courses` |
| Products in nav | Any page |
| Products section on homepage | `http://localhost:3000` |
| Admin product list | `http://localhost:3000/admin/products` |
| Create product form | `http://localhost:3000/admin/products/new` |
| Course form shows product select | `http://localhost:3000/admin/courses/new` |

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final verification and cleanup for product pages feature"
git push
```

---

## Self-Review Against Spec

**Spec coverage check:**

| Spec requirement | Covered in task |
|-----------------|----------------|
| `/products` index | Task 6 |
| `/products/[slug]` landing | Task 7 |
| Nested course/lesson/quiz routes | Tasks 9–11 |
| Old flat routes → 404 | Task 12 |
| Products in nav + footer | Task 14 |
| Homepage Explore products section | Task 14 |
| `Product` model + migration | Tasks 1–2 |
| Per-product slug uniqueness | Task 1 + Task 17 |
| `partnerName` removed | Tasks 1, 3, 17, 19 |
| `ProductCard` component | Task 5 |
| `Breadcrumbs` component | Task 5 |
| `paths.ts` helper used everywhere | Tasks 4, 8–11, 14–15, 17–18 |
| Product-scoped `getCourseBySlugs` | Task 4 |
| Admin product CRUD | Tasks 16–18 |
| Publish guard (product must be published first) | Task 17 |
| Profile uses nested URLs | Task 15 |
| Catalog includes product metadata | Task 4 + Task 13 |
| Seed creates Arcium product | Task 3 |
| PRD + CONTEXT + README updated | Task 20 |
| CourseCard updated | Task 8 |
| QuizRunner updated | Task 11 |
| CourseStartPanel updated | Task 8 |

All spec requirements covered.
