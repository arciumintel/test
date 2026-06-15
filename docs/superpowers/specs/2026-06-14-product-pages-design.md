# Product Pages And Product-Scoped Courses Design

## Status

Approved design for implementation planning.

## Context

Arcademy currently presents courses through a flat public catalog at `/courses` and course detail pages at `/courses/[slug]`. Courses use `partnerName` as display attribution, but there is no first-class product page or product metadata model.

The new requirement is to organize learning around Arcium and ecosystem products. Each product should have its own public page with a logo, description, official links, and its courses. The course catalog should remain available, but course URLs should become product-scoped.

This remains within V1 scope because staff still curates all content. This does not add partner roles, partner self-service publishing, or partner dashboards.

## Goals

- Add a public product index at `/products`.
- Add public product landing pages at `/products/[productSlug]`.
- Make nested course URLs canonical:
  - `/products/[productSlug]/courses/[courseSlug]`
  - `/products/[productSlug]/courses/[courseSlug]/lessons/[lessonId]`
  - `/products/[productSlug]/courses/[courseSlug]/quiz`
- Keep `/courses` as a redesigned cross-product catalog.
- Require every course to belong to exactly one product.
- Let staff manage products, product logos, descriptions, and flexible official links.
- Preserve the existing wallet-gated learning loop: public browsing, wallet required for progress, quizzes, badges, and profile.

## Non-Goals

- No partner self-service authoring.
- No partner roles.
- No per-product analytics dashboard.
- No product reordering or featured-product management.
- No lesson slugs in URLs.
- No redirects from old flat course routes. Old `/courses/[slug]` routes should return 404.
- No grouped-by-product `/courses` layout in the first implementation; use a flat catalog grid with product attribution.
- No draft product preview flow in V1.

## Information Architecture

### Public Routes

| Route | Purpose |
| --- | --- |
| `/products` | Product index with all published products. |
| `/products/[productSlug]` | Product landing page with metadata, official links, and published courses. |
| `/products/[productSlug]/courses/[courseSlug]` | Course detail page. |
| `/products/[productSlug]/courses/[courseSlug]/lessons/[lessonId]` | Lesson page. |
| `/products/[productSlug]/courses/[courseSlug]/quiz` | Course quiz page. |
| `/courses` | Cross-product catalog. Cards link to nested course URLs. |

### Removed Public Routes

The following routes should no longer exist and should return 404 by absence:

- `/courses/[slug]`
- `/courses/[slug]/lessons/[lessonId]`
- `/courses/[slug]/quiz`

### Navigation

Main navigation should include:

- Products -> `/products`
- Courses -> `/courses`
- My learning -> `/profile` for authenticated learners
- Admin -> `/admin` for staff admins

Footer navigation should mirror Products and Courses.

### Homepage

The homepage should add an "Explore products" section that displays product cards and links to `/products/[slug]`.

The existing "Featured courses" section may remain, but each course card must link to the nested product-scoped course URL and show product attribution.

## Data Model

### Product

Add a first-class `Product` model:

| Field | Purpose |
| --- | --- |
| `id` | Primary key, `cuid`. |
| `name` | Display name, such as `Arcium`. |
| `slug` | Globally unique URL segment. |
| `description` | Public product explanation stored as plain text. |
| `logoUrl` | Optional Cloudinary URL for the product logo. |
| `links` | JSON array of labeled official links. |
| `status` | `ProductStatus`: `draft`, `published`, or `archived`. |
| `createdAt` | Creation timestamp. |
| `updatedAt` | Update timestamp. |

Indexes:

- `slug` is globally unique.
- `status` is indexed for public product queries.

`links` should be validated at the app layer as an ordered array of objects:

```json
[
  { "label": "Website", "url": "https://arcium.io" },
  { "label": "Docs", "url": "https://docs.arcium.io" }
]
```

Validation rules:

- `label` is required and capped at roughly 40 characters.
- `url` is required and must be a valid HTTPS URL.
- Local development may accept `http://localhost` URLs for testing only.
- Max 10 links per product.
- Array order is render order.

### Course

Update `Course`:

- Add required `productId`.
- Add relation to `Product`.
- Remove `partnerName`.
- Replace global `slug @unique` with `@@unique([productId, slug])`.

Course slugs are unique per product. A course can be `/products/arcium/courses/intro` while another product can also have `/products/other-product/courses/intro`.

Existing lesson, quiz, progress, badge, and analytics models stay keyed by `courseId` and do not need structural changes.

## Public UX

### Product Index

`/products` should use the same calm, official page structure as `/courses`:

- Header explaining that these are ecosystem products with official learning paths.
- Responsive grid of product cards.
- Empty state if no published products exist.

Product cards show:

- Logo or fallback initial.
- Product name.
- Short description.
- Published course count.
- Link to `/products/[slug]`.

### Product Landing Page

`/products/[productSlug]` should show:

- Product logo.
- Product name as the page heading.
- Full product description.
- Official links as external link chips or buttons.
- Published courses under that product.

Draft, archived, or unknown products return 404.

If a published product has no published courses, show a learner-safe empty state such as "Courses for this product are coming soon."

### Course Catalog

`/courses` remains a cross-product catalog. For V1, keep it as a flat grid rather than grouping by product.

Each course card should show:

- Product logo and product name as attribution.
- Course title, summary, level, duration, lesson count, and badge availability.
- Link to `/products/[productSlug]/courses/[courseSlug]`.

### Nested Course Pages

The existing course, lesson, and quiz behavior should move under the product-scoped routes.

Each nested learner page should include breadcrumbs:

`Products -> Product name -> Course title`

Lesson and quiz pages extend the breadcrumb with the current step.

Course detail should show product attribution in the hero, linking back to the product landing page.

Wallet gating remains unchanged:

- Product index, product page, catalog, and course detail are public.
- Starting a course, saving progress, taking quizzes, earning badges, and viewing profile require wallet authentication.

## Admin UX

### Product Admin Routes

Add staff-only product management routes:

| Route | Purpose |
| --- | --- |
| `/admin/products` | Product list with status and course count. |
| `/admin/products/new` | Create product. |
| `/admin/products/[id]` | Edit product details, logo, links, and status. |

The admin dashboard should include a Products section or link alongside course management.

### Product Form

Staff can manage:

- Name.
- Slug, auto-generated from name and editable.
- Description.
- Logo via Cloudinary upload.
- Flexible labeled official links.
- Status: `draft`, `published`, `archived`.

Draft products are not visible publicly.

### Course Form Changes

Replace `partnerName` with required product selection.

When creating or editing a course:

- Staff must select a product.
- The course slug is checked for uniqueness within that product.
- Changing a course's product changes its canonical public URL.

The admin course preview link must point to the nested public route.

### Publish Rules

- A course cannot be published unless its parent product is published.
- Archiving or unpublishing a product does not mutate its courses.
- Public queries must filter out courses whose parent product is not published.

## Server And Routing Architecture

Add a centralized path helper so URLs are not hardcoded throughout the app:

- `productPath(productSlug)`
- `coursePath(productSlug, courseSlug)`
- `lessonPath(productSlug, courseSlug, lessonId)`
- `quizPath(productSlug, courseSlug)`

Use this helper in:

- Course cards.
- Product pages.
- Profile links.
- Lesson navigation.
- Quiz runner links.
- Admin preview links.
- Server action `revalidatePath` calls.
- Auth redirects.

Data access should move from course-only lookup to product-scoped lookup:

- `getPublishedProducts()`
- `getProductBySlug(productSlug)`
- `getCourseBySlugs(productSlug, courseSlug)`
- Catalog queries should include product metadata.

## Documentation Updates

### PRD

Patch the PRD to add:

- Product index and product landing pages.
- Product-scoped course URLs.
- Redesigned cross-product catalog.
- Staff product CRUD.
- Required course-to-product relation.
- Product acceptance criteria.

Clarify that partner self-service remains out of scope.

### CONTEXT.md

Add `Product` as a core concept:

> Ecosystem product, including Arcium itself. A product has a public landing page, logo, official links, and courses.

Remove `Partner name` as a durable concept and state that courses belong to products.

### README

Update route descriptions and setup notes:

- `/products`
- `/products/[productSlug]`
- Nested course URLs.
- Seed creates an Arcium product and assigns launch courses.

## Data Migration

Migration sequence:

1. Add `Product` model and `ProductStatus` enum.
2. Add nullable `productId` to `Course`.
3. Create an `Arcium` product row.
4. Backfill existing courses to the Arcium product.
5. Make `productId` required.
6. Remove `partnerName`.
7. Replace global course slug uniqueness with `@@unique([productId, slug])`.

Seed data should create:

- Product `arcium`, status `published`.
- Official Arcium links.
- Existing launch courses assigned to the Arcium product.

## Acceptance Criteria

### Products

- A visitor can browse `/products` without a wallet.
- A visitor can open `/products/arcium` and see product description, logo, official links, and courses.
- Draft and archived products are hidden from public routes.

### Nested Courses

- A visitor can open `/products/arcium/courses/welcome-to-arcium` without a wallet.
- Lesson and quiz flows work at nested URLs.
- Old `/courses/[slug]` routes return 404.

### Catalog

- `/courses` lists all published courses across published products.
- Every catalog card shows product attribution.
- Every catalog card links to the correct nested course URL.

### Navigation

- Products appears in the main nav and footer.
- Homepage shows an Explore products section.

### Admin

- Staff can create, edit, publish, and archive products.
- Staff can manage product logos and multiple labeled external links.
- Staff must assign a product when creating a course.
- Staff cannot publish a course under a draft or archived product.
- Admin preview opens the nested learner URL.

### Regression

- Wallet gating is unchanged.
- Course progress, quiz attempts, badge awards, and learner profile links still work.
- Existing staff course, lesson, quiz, badge, and analytics workflows continue to work after replacing partner attribution with products.

## Implementation Planning Notes

The implementation should be split into reviewable phases:

1. Schema, seed, and data access changes.
2. Public product routes and nested course routes.
3. Course catalog, homepage, nav, footer, and shared path helpers.
4. Admin product CRUD and course product assignment.
5. Documentation updates and final verification.

Each phase should preserve the app's ability to build and should avoid unrelated UI or architecture refactors.
