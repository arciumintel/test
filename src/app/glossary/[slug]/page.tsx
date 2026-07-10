import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GlossaryTermVisual } from "@/components/glossary-term-visual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getGlossaryDetailTerms,
  getGlossaryRelatedTerms,
  getGlossaryTermBySlug,
  type GlossaryTerm,
} from "@/lib/glossary";

export async function generateStaticParams() {
  return getGlossaryDetailTerms().map((term) => ({ slug: term.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = getGlossaryTermBySlug(slug);
  if (!term?.detailPage) {
    return { title: "Glossary term" };
  }

  return {
    title: `${term.term} glossary guide`,
    description: term.definition,
  };
}

function RelatedTermLink({ term }: { term: GlossaryTerm }) {
  const href = term.detailPage ? `/glossary/${term.slug}` : `/glossary#${term.slug}`;

  return (
    <Link
      href={href}
      className="rounded-2xl border bg-background px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-secondary"
    >
      <p className="font-medium text-foreground">{term.term}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{term.definition}</p>
    </Link>
  );
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = getGlossaryTermBySlug(slug);

  if (!term?.detailPage) {
    notFound();
  }

  const relatedTerms = getGlossaryRelatedTerms(term);
  const detailPage = term.detailPage;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Glossary", href: "/glossary" },
          { label: term.term, href: `/glossary/${term.slug}` },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant="official">{detailPage.eyebrow ?? "Glossary guide"}</Badge>
            {detailPage.kind === "visual" ? (
              <Badge variant="premium">Visual explainer</Badge>
            ) : null}
          </div>

          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {term.term}
          </h1>
          <p className="mt-4 max-w-3xl text-pretty text-base leading-7 text-muted-foreground">
            {term.definition}
          </p>
          <p className="mt-4 max-w-3xl text-pretty text-[15px] leading-7 text-muted-foreground">
            {detailPage.intro}
          </p>

          <div className="mt-8 space-y-4">
            {detailPage.sections.map((section) => (
              <Card key={section.title} className="rounded-[1.75rem]">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
                  <p className="mt-3 text-pretty text-[15px] leading-7 text-muted-foreground">
                    {section.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          {detailPage.kind === "visual" ? (
            <GlossaryTermVisual
              visualId={detailPage.visualId}
              activeSlug={term.slug}
            />
          ) : term.imageUrl ? (
            <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
              <div className="relative aspect-[4/3]">
                <Image
                  src={term.imageUrl}
                  alt={term.imageAlt ?? `${term.term} illustration`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}

          <Card className="rounded-[1.75rem]">
            <CardContent className="p-6">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="size-4 text-muted-foreground" aria-hidden />
                Key takeaways
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                {(detailPage.keyTakeaways ?? [term.definition]).map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-border-strong" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {term.aliases?.length ? (
                <div className="mt-5 border-t pt-5">
                  <p className="text-sm font-medium text-foreground">Also called</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {term.aliases.join(", ")}
                  </p>
                </div>
              ) : null}

              {term.docsHref ? (
                <Button variant="outline" className="mt-5 w-full justify-between" asChild>
                  <Link href={term.docsHref} target="_blank" rel="noopener noreferrer">
                    Read the official Arcium docs
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      {relatedTerms.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Related terms</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedTerms.map((relatedTerm) => (
              <RelatedTermLink key={relatedTerm.slug} term={relatedTerm} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
