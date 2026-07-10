import type { Metadata } from "next";
import { GlossaryCatalog } from "@/components/glossary-catalog";
import { PageHeader } from "@/components/page-header";
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_TERMS,
  getGlossaryDetailTerms,
} from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "A plain-language A-Z glossary for Arcademy and Arcium concepts, with selective deep dives for the terms that deserve more context.",
};

export default function GlossaryPage() {
  const detailTerms = getGlossaryDetailTerms();
  const visualTermCount = detailTerms.filter(
    (term) => term.detailPage?.kind === "visual"
  ).length;

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 pb-12 sm:px-6">
      <PageHeader headingId="glossary-heading" innerClassName="max-w-4xl">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-text-secondary">
          Arcademy reference
        </p>
        <h1
          id="glossary-heading"
          className="mt-3 text-balance text-[2.2rem] font-semibold leading-tight tracking-tight sm:text-[2.75rem]"
        >
          A clearer glossary for Arcium terms
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
          Browse the language behind Arcademy and the broader Arcium ecosystem in
          one place. This index stays quick and scannable, while selected terms
          open into deeper explainers when a one-line definition is not enough.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{GLOSSARY_TERMS.length}</span>{" "}
            total entries
          </span>
          <span>
            <span className="font-medium text-foreground">{detailTerms.length}</span>{" "}
            guided detail pages
          </span>
          <span>
            <span className="font-medium text-foreground">{visualTermCount}</span>{" "}
            visual explainers
          </span>
        </div>
      </PageHeader>

      <GlossaryCatalog
        terms={GLOSSARY_TERMS}
        categories={GLOSSARY_CATEGORIES}
      />
    </div>
  );
}
