import Link from "next/link";
import { ArrowUpRight, MoveRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { hasGlossaryDetailPage, type GlossaryTerm } from "@/lib/glossary";
import { cn } from "@/lib/utils";
import { getGlossaryCategoryBadgeVariant } from "@/lib/badge-colors";

type GlossaryTermCardProps = {
  term: GlossaryTerm;
  categoryTitle: string;
  className?: string;
};

export function GlossaryTermCard({
  term,
  categoryTitle,
  className,
}: GlossaryTermCardProps) {
  const detailHref = hasGlossaryDetailPage(term) ? `/glossary/${term.slug}` : null;

  return (
    <div
      id={term.slug}
      className={cn(
        "scroll-mt-24 border-t border-border/60 pt-4 first:border-t-0 first:pt-0",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {detailHref ? (
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              <Link
                href={detailHref}
                className="inline-flex items-center gap-2 underline-offset-4 hover:text-primary hover:underline"
              >
                {term.term}
                <MoveRight className="size-4" aria-hidden />
              </Link>
            </h3>
          ) : (
            <h3 className="text-base font-semibold tracking-tight text-foreground">{term.term}</h3>
          )}

          {term.aliases?.length ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Also seen as {term.aliases.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant={getGlossaryCategoryBadgeVariant(term.categoryId)}>
            {categoryTitle}
          </Badge>
          {term.detailPage?.kind === "visual" ? (
            <Badge variant="muted" className="text-xs">
              Visual guide
            </Badge>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">{term.definition}</p>

      {(detailHref || term.docsHref) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {detailHref ? (
            <Link
              href={detailHref}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Explore this term
            </Link>
          ) : null}
          {term.docsHref ? (
            <Link
              href={term.docsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Official docs
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
