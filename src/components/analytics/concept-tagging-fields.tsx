"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getContentConceptTagIds,
  listConceptsForTagging,
  setLessonConceptTags,
  setQuestionConceptTags,
} from "@/app/actions/analytics-profile";
import { cn } from "@/lib/utils";

type ConceptOption = {
  id: string;
  name: string;
  importance: string;
};

type ConceptTaggingFieldsProps = {
  productId: string;
  target: { type: "lesson"; lessonId: string } | { type: "question"; questionId: string };
  className?: string;
};

/**
 * Manager+ content tagging hook for lessons and questions.
 * Loads concepts and current tags for the product.
 */
export function ConceptTaggingFields({
  productId,
  target,
  className,
}: ConceptTaggingFieldsProps) {
  const [concepts, setConcepts] = React.useState<ConceptOption[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [canEdit, setCanEdit] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const targetKey =
    target.type === "lesson" ? target.lessonId : target.questionId;

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [conceptRes, tagRes] = await Promise.all([
        listConceptsForTagging(productId),
        getContentConceptTagIds(productId, target),
      ]);
      if (cancelled) return;
      if ("error" in conceptRes) {
        setError(conceptRes.error);
        setLoading(false);
        return;
      }
      setConcepts(conceptRes.concepts);
      setCanEdit(conceptRes.canEditTags);
      if (!("error" in tagRes)) {
        setSelected(tagRes.conceptIds);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when target identity changes
  }, [productId, target.type, targetKey]);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function save() {
    setBusy(true);
    setError(null);
    const res =
      target.type === "lesson"
        ? await setLessonConceptTags(productId, target.lessonId, {
            conceptIds: selected,
          })
        : await setQuestionConceptTags(productId, target.questionId, {
            conceptIds: selected,
          });
    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSaved(true);
  }

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground",
          className
        )}
      >
        <Loader2 className="size-3.5 animate-spin" />
        Loading concepts…
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed p-3 text-sm text-muted-foreground",
          className
        )}
      >
        No concepts yet. Add concepts under Analytics → Settings to enable
        tagging.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border bg-background/60 p-3",
        className
      )}
    >
      <div>
        <Label>Concepts</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tag this {target.type} for concept mastery analytics.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {concepts.map((concept) => {
          const active = selected.includes(concept.id);
          return (
            <li key={concept.id}>
              <button
                type="button"
                disabled={!canEdit || busy}
                onClick={() => toggle(concept.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                  (!canEdit || busy) && "opacity-60"
                )}
              >
                {concept.name}
              </button>
            </li>
          );
        })}
      </ul>
      {canEdit && (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={save}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save tags
          </Button>
          {saved && (
            <span className="text-xs text-muted-foreground">Tags saved.</span>
          )}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
