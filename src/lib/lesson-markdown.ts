export type LessonBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "code"; code: string };

/** Parses lesson markdown into render blocks. */
export function parseLessonBlocks(content: string): LessonBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: LessonBlock[] = [];
  let listItems: string[] = [];
  let codeLines: string[] | null = null;

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: "ul", items: [...listItems] });
    listItems = [];
  };

  const flushCode = () => {
    if (codeLines === null) return;
    blocks.push({ type: "code", code: codeLines.join("\n") });
    codeLines = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (codeLines !== null) {
      if (trimmed === "```") {
        flushCode();
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushList();
      codeLines = [];
      continue;
    }

    if (trimmed === "") {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push({ type: "h3", text: trimmed.slice(4) });
    } else if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push({ type: "h2", text: trimmed.slice(3) });
    } else if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push({ type: "h1", text: trimmed.slice(2) });
    } else if (trimmed.startsWith("> ")) {
      flushList();
      blocks.push({ type: "blockquote", text: trimmed.slice(2) });
    } else if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ""));
    } else {
      flushList();
      blocks.push({ type: "p", text: line });
    }
  }

  flushList();
  if (codeLines !== null) {
    blocks.push({ type: "code", code: codeLines.join("\n") });
  }

  return blocks;
}

export const LESSON_INLINE_PATTERN =
  /(\[[^\]]+\]\((https?:\/\/[^\s)]+)\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

export const LESSON_LINK_PATTERN = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/;
