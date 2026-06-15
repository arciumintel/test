import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  Wallet,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course-card";
import { ProductCard } from "@/components/product-card";
import { getPublishedCourses } from "@/lib/courses";
import { getPublishedProducts } from "@/lib/products";

export default async function HomePage() {
  let courses: Awaited<ReturnType<typeof getPublishedCourses>> = [];
  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  try {
    [courses, products] = await Promise.all([
      getPublishedCourses(),
      getPublishedProducts(),
    ]);
  } catch {
    courses = [];
    products = [];
  }
  const featured = courses.slice(0, 3);
  const featuredProducts = products.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="default" className="mx-auto mb-6">
              <Sparkles />
              The official Arcium learning platform
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Learn the Arcium ecosystem, one clear step at a time.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
              Structured courses that turn intimidating concepts into something
              you actually understand. Complete lessons, pass a short quiz, and
              earn recognition tied to your Solana wallet.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/courses">
                  Browse courses
                  <ArrowRight />
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                No wallet needed to explore.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "Plain explanations",
              body: "Courses written for newcomers, not insiders. Clear sequencing, no unnecessary jargon.",
            },
            {
              icon: ShieldCheck,
              title: "Trustworthy progress",
              body: "Connect a Solana wallet to track lessons and quizzes. Your progress is saved across sessions.",
            },
            {
              icon: Award,
              title: "Earn recognition",
              body: "Finish a course to earn a badge that lives in your learner profile.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem projects */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Explore ecosystem projects
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with an ecosystem project, then follow its curated courses.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/products">
              View ecosystem projects
              <ArrowRight />
            </Link>
          </Button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  slug: product.slug,
                  name: product.name,
                  description: product.description,
                  logoUrl: product.logoUrl,
                  courseCount: product._count.courses,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <BookOpen className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">
              No published ecosystem projects yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ecosystem project pages will appear here once the team publishes
              them.
            </p>
          </div>
        )}
      </section>

      {/* Featured courses */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Featured courses
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Curated by the Arcademy team.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/courses">
              View all
              <ArrowRight />
            </Link>
          </Button>
        </div>

        {featured.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CourseCard
                key={c.id}
                course={{
                  slug: c.slug,
                  productSlug: c.product.slug,
                  productName: c.product.name,
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
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <Wallet className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No published courses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Once the team publishes a course, it will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
