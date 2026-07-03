"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Search, Sparkles, X } from "lucide-react";
import { GlossaryTermCard } from "@/components/glossary-term-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getGlossaryLetters,
  groupGlossaryTermsByLetter,
  hasGlossaryDetailPage,
  type GlossaryCategory,
  type GlossaryTerm,
} from "@/lib/glossary";
import { filterGlossaryTerms } from "@/lib/glossary-search";
import { cn } from "@/lib/utils";

const alphabet = Array.from({ length: 26 }, (_, index) =>
  String.fromCharCode(65 + index)
);

function FilterChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-45",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted/60"
      )}
    >
      {children}
    </button>
  );
}

type GlossaryCatalogProps = {
  terms: GlossaryTerm[];
  categories: GlossaryCategory[];
};

export function GlossaryCatalog({
  terms,
  categories,
}: GlossaryCatalogProps) {
  const [query, setQuery] = React.useState("");
  const [activeLetter, setActiveLetter] = React.useState("");

  const searchMatches = React.useMemo(
    () => filterGlossaryTerms(query, "", terms),
    [query, terms]
  );
  const availableLetters = React.useMemo(
    () => new Set(getGlossaryLetters(searchMatches)),
    [searchMatches]
  );
  const selectedLetter =
    activeLetter && availableLetters.has(activeLetter) ? activeLetter : "";

  const filteredTerms = React.useMemo(
    () => filterGlossaryTerms(query, selectedLetter, terms),
    [query, selectedLetter, terms]
  );
  const groupedTerms = React.useMemo(
    () => groupGlossaryTermsByLetter(filteredTerms),
    [filteredTerms]
  );
  const categoryTitleById = React.useMemo(
    () =>
      new Map(categories.map((category) => [category.id, category.title] as const)),
    [categories]
  );
  const detailCount = React.useMemo(
    () => terms.filter((term) => hasGlossaryDetailPage(term)).length,
    [terms]
  );
  const visualCount = React.useMemo(
    () => terms.filter((term) => term.detailPage?.kind === "visual").length,
    [terms]
  );

  const hasActiveFilters = Boolean(query.trim() || selectedLetter);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border bg-card/70 p-5 shadow-sm sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{terms.length}</span> core
                terms
              </span>
              <span>
                <span className="font-medium text-foreground">{detailCount}</span> deeper
                guides
              </span>
              <span>
                <span className="font-medium text-foreground">{visualCount}</span> visual
                explainers
              </span>
            </div>

            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search terms, acronyms, or definitions…"
                aria-label="Search glossary terms"
                className="pl-9"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  aria-label="Clear search"
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Use search when you know the term, or jump by letter if you are
              browsing. Entries with a guide open into a fuller explanation, while
              shorter terms stay as quick definitions here on the index.
            </p>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 text-sm dark:bg-primary/[0.08]">
            <p className="font-medium text-foreground">Need a full walkthrough first?</p>
            <p className="mt-2 max-w-sm text-pretty leading-6 text-muted-foreground">
              Start with the guided Arcium introduction, then come back here when
              you need a quick refresher on specific terms.
            </p>
            <Link
              href="/start"
              className="mt-3 inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
            >
              Start with Arcium
              <Sparkles className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-[2rem] border bg-background/70">
        <div className="border-b px-4 py-3 sm:px-6">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{filteredTerms.length}</span>{" "}
            term{filteredTerms.length === 1 ? "" : "s"}
            {hasActiveFilters ? " matching your filters" : ""}.
          </p>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          <nav
            aria-label="Filter glossary by first letter"
            className="flex flex-wrap items-center gap-2"
          >
            <FilterChip
              active={!selectedLetter}
              onClick={() => setActiveLetter("")}
            >
              All
            </FilterChip>
            {alphabet.map((letter) => (
              <FilterChip
                key={letter}
                active={selectedLetter === letter}
                disabled={!availableLetters.has(letter)}
                onClick={() => setActiveLetter(letter)}
              >
                {letter}
              </FilterChip>
            ))}
          </nav>
        </div>
      </div>

      {filteredTerms.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">No glossary terms match your filters</p>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Try a different keyword, acronym, or letter.
          </p>
          {hasActiveFilters ? (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQuery("");
                setActiveLetter("");
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}

      {groupedTerms.length > 0 ? (
        <div className="space-y-6">
          {groupedTerms.map((group) => (
            <section
              key={group.letter}
              id={`letter-${group.letter}`}
              aria-labelledby={`glossary-letter-${group.letter}`}
              className="scroll-mt-24 rounded-[2rem] border bg-card/60 px-4 py-5 shadow-sm sm:px-6 sm:py-6"
            >
              <div className="grid gap-6 md:grid-cols-[72px_minmax(0,1fr)] md:items-start">
                <div className="border-b border-border/60 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-5">
                  <h2
                    id={`glossary-letter-${group.letter}`}
                    className="text-4xl font-semibold tracking-tight text-primary/90 sm:text-5xl"
                  >
                    {group.letter}
                  </h2>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {group.terms.length} term{group.terms.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
                  {group.terms.map((term) => (
                    <GlossaryTermCard
                      key={term.slug}
                      term={term}
                      categoryTitle={categoryTitleById.get(term.categoryId) ?? "Glossary"}
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
