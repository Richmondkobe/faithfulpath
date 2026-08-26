// A deliberately small markdown parser: headings, paragraphs, bullet lists,
// bold and italic. It produces a block list that callers render themselves, so
// guide descriptions and article bodies can share the parsing while keeping
// their own typography. No raw HTML is ever parsed, so there is nothing to
// sanitise downstream.

export type MdBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "p"; text: string };

export type MdSpan = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

export function parseInline(text: string): MdSpan[] {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return { text: part.slice(2, -2), bold: true };
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return { text: part.slice(1, -1), italic: true };
      }
      return { text: part };
    });
}

export function parseMarkdown(source: string): MdBlock[] {
  return source
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .filter((block) => block.trim() !== "")
    .map((block): MdBlock => {
      const lines = block.split("\n");

      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        return {
          type: "list",
          items: lines.map((line) => line.replace(/^\s*[-*]\s+/, "")),
        };
      }

      const heading = block.match(/^(#{2,3})\s+(.*)$/);
      if (heading) {
        return {
          type: heading[1].length === 2 ? "h2" : "h3",
          text: heading[2],
        };
      }

      return { type: "p", text: block };
    });
}
