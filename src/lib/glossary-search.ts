import Fuse, { type IFuseOptions } from "fuse.js";
import {
  getGlossaryLetter,
  sortGlossaryTerms,
  type GlossaryTerm,
} from "@/lib/glossary";

const fuseOptions: IFuseOptions<GlossaryTerm> = {
  keys: ["term", "definition", "aliases"],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

function filterByLetter(terms: GlossaryTerm[], letter: string): GlossaryTerm[] {
  if (!letter) return terms;
  return terms.filter((term) => getGlossaryLetter(term) === letter);
}

export function filterGlossaryTerms(
  query: string,
  letter: string,
  terms: GlossaryTerm[]
): GlossaryTerm[] {
  const normalizedQuery = query.trim();
  const searchBase = sortGlossaryTerms(terms);

  const matchedTerms = normalizedQuery
    ? new Fuse(searchBase, fuseOptions).search(normalizedQuery).map(
        (result) => result.item
      )
    : searchBase;

  return sortGlossaryTerms(filterByLetter(matchedTerms, letter));
}
