import * as React from "react";
import {
  LESSON_INLINE_PATTERN,
  LESSON_LINK_PATTERN,
  parseLessonBlocks,
} from "@/lib/lesson-markdown";

/** Renders inline **bold**, *italic*, `code`, and [links](url). */
function renderLessonInline(
  text: string,
  keyPrefix: string
): React.ReactNode[] {
  const tokens = text.split(LESSON_INLINE_PATTERN);
  return tokens.filter(Boolean).map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    const linkMatch = LESSON_LINK_PATTERN.exec(tok);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      if (url.startsWith("javascript:")) {
        return <React.Fragment key={key}>{label}</React.Fragment>;
      }
      return (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2"
        >
          {label}
        </a>
      );
    }
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return (
        <code
          key={key}
          className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith("*") && tok.endsWith("*")) {
      return <em key={key}>{tok.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{tok}</React.Fragment>;
  });
}

/** Renders lesson markdown: headings, lists, links, code blocks, blockquotes. */
export function LessonContent({ content }: { content: string }) {
  const blocks = parseLessonBlocks(content);

  return (
    <div className="break-words text-[0.95rem]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "h1":
            return (
              <h1 key={key} className="mt-8 mb-3 text-2xl font-semibold">
                {renderLessonInline(block.text, key)}
              </h1>
            );
          case "h2":
            return (
              <h2 key={key} className="mt-8 mb-3 text-xl font-semibold">
                {renderLessonInline(block.text, key)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={key} className="mt-6 mb-2 text-lg font-semibold">
                {renderLessonInline(block.text, key)}
              </h3>
            );
          case "p":
            return (
              <p key={key} className="my-4 leading-7 text-foreground/90">
                {renderLessonInline(block.text, key)}
              </p>
            );
          case "ul":
            return (
              <ul key={key} className="my-4 list-disc space-y-1.5 pl-6">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>
                    {renderLessonInline(item, `${key}-li-${itemIndex}`)}
                  </li>
                ))}
              </ul>
            );
          case "blockquote":
            return (
              <blockquote
                key={key}
                className="my-4 border-l-4 border-border-strong pl-4 italic text-muted-foreground"
              >
                {renderLessonInline(block.text, key)}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={key}
                className="my-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm"
              >
                <code>{block.code}</code>
              </pre>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
