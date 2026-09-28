/**
 * A small HTML reader for the Lead Before You're Ready preview pages.
 *
 * Those twelve files are the reviewed, final source, so the site reads them
 * rather than a transcription of them: there is no second copy of the wording
 * to drift, and "do not reorder or reword" is enforced by there being nothing
 * to reword. What this does not do is hand the markup to the browser — the
 * courses here render through components, not dangerouslySetInnerHTML, so the
 * markup is parsed into nodes and React builds the page from those.
 *
 * It understands exactly the tags these files use and throws on anything else.
 * A parser that skipped what it did not recognise would drop a paragraph from a
 * lesson and look like it had worked.
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "em"; c: Inline[] }
  | { t: "strong"; c: Inline[] }
  | { t: "small"; c: Inline[] }
  | { t: "a"; href: string; c: Inline[] };

export type Block =
  | { t: "p"; cls: string | null; c: Inline[] }
  | { t: "h"; level: 1 | 2 | 3; c: Inline[] }
  | { t: "list"; ordered: boolean; cls: string | null; items: Block[][] }
  | { t: "dl"; items: { term: Inline[]; desc: Block[] }[] }
  | { t: "table"; head: Inline[][]; rows: Inline[][][] }
  | { t: "details"; summary: Inline[]; body: Block[] }
  | { t: "label"; c: Inline[] }
  | { t: "ref"; c: Inline[] }
  /** A bolded term followed by its description — the "parts" and "flow" cards. */
  | { t: "term"; cls: string | null; term: Inline[]; body: Block[] };

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  mdash: "—", ndash: "–", hellip: "…", middot: "·",
  times: "×", copy: "©", reg: "®", deg: "°",
  eacute: "é", pound: "£", euro: "€",
};

export function decode(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, name: string) => {
    if (name.startsWith("#x") || name.startsWith("#X")) {
      return String.fromCodePoint(parseInt(name.slice(2), 16));
    }
    if (name.startsWith("#")) return String.fromCodePoint(Number(name.slice(1)));
    const hit = ENTITIES[name];
    if (hit === undefined) throw new Error(`lbyr-html: unknown entity &${name};`);
    return hit;
  });
}

const attr = (tag: string, name: string): string | null => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? decode(m[1]) : null;
};

/** Inline markup inside a paragraph, heading or cell. */
export function parseInline(html: string): Inline[] {
  const out: Inline[] = [];
  let rest = html;
  while (rest.length) {
    const open = rest.match(/<(em|strong|b|small|a)\b([^>]*)>/i);
    if (!open || open.index === undefined) {
      if (rest.trim()) out.push({ t: "text", v: decode(rest) });
      break;
    }
    if (open.index > 0) {
      const before = rest.slice(0, open.index);
      if (before) out.push({ t: "text", v: decode(before) });
    }
    const name = open[1].toLowerCase();
    const close = `</${name}>`;
    const end = rest.toLowerCase().indexOf(close, open.index + open[0].length);
    if (end < 0) throw new Error(`lbyr-html: <${name}> is never closed`);
    const inner = rest.slice(open.index + open[0].length, end);
    const children = parseInline(inner);
    if (name === "a") {
      out.push({ t: "a", href: attr(open[2], "href") ?? "#", c: children });
    } else if (name === "b") {
      out.push({ t: "strong", c: children });          // <b> is <strong> here
    } else {
      out.push({ t: name as "em" | "strong" | "small", c: children });
    }
    rest = rest.slice(end + close.length);
  }
  return out;
}

/** Everything between two markers of the same tag, honouring nesting. */
function sliceElement(html: string, from: number, tag: string): { inner: string; end: number } {
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  const closeRe = new RegExp(`</${tag}>`, "gi");
  const first = html.slice(from).match(new RegExp(`<${tag}\\b[^>]*>`, "i"));
  if (!first) throw new Error(`lbyr-html: expected <${tag}>`);
  let i = from + html.slice(from).indexOf(first[0]) + first[0].length;
  let depth = 1;
  while (depth > 0) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const o = openRe.exec(html);
    const c = closeRe.exec(html);
    if (!c) throw new Error(`lbyr-html: <${tag}> is never closed`);
    if (o && o.index < c.index) { depth++; i = o.index + o[0].length; }
    else { depth--; i = c.index + c[0].length; if (depth === 0) return { inner: html.slice(from + first[0].length + html.slice(from).indexOf(first[0]), c.index), end: i }; }
  }
  throw new Error(`lbyr-html: <${tag}> is never closed`);
}

/** Block-level content: the body of a section, a list item or an accordion. */
export function parseBlocks(html: string): Block[] {
  const out: Block[] = [];
  let i = 0;
  const source = html;

  while (i < source.length) {
    const next = source.slice(i).match(/<(p|h1|h2|h3|ul|ol|dl|table|details|span|div)\b([^>]*)>/i);
    if (!next || next.index === undefined) {
      const tail = source.slice(i).replace(/<\/?(div|section|span)[^>]*>/gi, "");
      if (tail.trim()) throw new Error(`lbyr-html: loose text outside a block: ${tail.trim().slice(0, 60)}`);
      break;
    }
    const between = source.slice(i, i + next.index).replace(/<\/?(div|section|span|i)[^>]*>/gi, "");
    if (between.trim()) throw new Error(`lbyr-html: loose text between blocks: ${between.trim().slice(0, 60)}`);

    const tag = next[1].toLowerCase();
    const tagAttrs = next[2];
    const start = i + next.index;
    const cls = attr(tagAttrs, "class");

    if (tag === "div" || tag === "span") {
      const { inner, end } = sliceElement(source, start, tag);
      i = end;
      if (tag === "span" && cls === "label") { out.push({ t: "label", c: parseInline(inner) }); continue; }
      if (tag === "span" && cls === "ref") { out.push({ t: "ref", c: parseInline(inner) }); continue; }

      // A div that opens with a bolded term is a term and its description —
      // the three "parts" on Start Here, and the four "How each lesson works"
      // cards. Rendered as a pair rather than flattened into loose text.
      const lead = inner.match(/^\s*<(b|strong)\b[^>]*>/i);
      if (lead) {
        const term = sliceElement(inner, 0, lead[1]);
        const restHtml = inner.slice(term.end).trim();
        out.push({
          t: "term",
          cls,
          term: parseInline(term.inner),
          body: /<(p|ul|ol|table|details|h[1-3]|div)\b/i.test(restHtml)
            ? parseBlocks(restHtml)
            : restHtml
              ? [{ t: "p", cls: null, c: parseInline(restHtml) }]
              : [],
        });
        continue;
      }

      // A wrapper holding only inline content — a <span> around a tick-box
      // label, say — is a paragraph. One holding blocks is just a wrapper.
      if (!/<(p|h[1-3]|ul|ol|dl|table|details|div)\b/i.test(inner)) {
        if (inner.trim()) out.push({ t: "p", cls, c: parseInline(inner) });
        continue;
      }
      out.push(...parseBlocks(inner));
      continue;
    }

    const { inner, end } = sliceElement(source, start, tag);
    i = end;

    switch (tag) {
      case "p":
        out.push({ t: "p", cls, c: parseInline(inner) });
        break;
      case "h1":
      case "h2":
      case "h3":
        out.push({
          t: "h",
          level: tag === "h1" ? 1 : tag === "h2" ? 2 : 3,
          c: parseInline(inner),
        });
        break;
      case "ul":
      case "ol": {
        const items: Block[][] = [];
        const li = /<li\b[^>]*>/gi;
        let m: RegExpExecArray | null;
        const marks: number[] = [];
        while ((m = li.exec(inner))) marks.push(m.index);
        for (const at of marks) {
          const slice = sliceElement(inner, at, "li");
          const content = slice.inner.trim();
          // A list item is usually inline text; sometimes it holds blocks.
          items.push(
            /<(p|ul|ol|table|details|h[1-3])\b/i.test(content)
              ? parseBlocks(content)
              : [{ t: "p", cls: null, c: parseInline(content) }]
          );
        }
        out.push({ t: "list", ordered: tag === "ol", cls, items });
        break;
      }
      case "dl": {
        const items: { term: Inline[]; desc: Block[] }[] = [];
        const dt = /<dt\b[^>]*>/gi;
        let m: RegExpExecArray | null;
        const marks: number[] = [];
        while ((m = dt.exec(inner))) marks.push(m.index);
        for (const at of marks) {
          const term = sliceElement(inner, at, "dt");
          const descAt = inner.slice(term.end).search(/<dd\b[^>]*>/i);
          if (descAt < 0) throw new Error("lbyr-html: <dt> with no <dd>");
          const desc = sliceElement(inner, term.end + descAt, "dd");
          const descHtml = desc.inner.trim();
          items.push({
            term: parseInline(term.inner),
            desc: /<(p|ul|ol|table|details|h[1-3]|div)\b/i.test(descHtml)
              ? parseBlocks(descHtml)
              : [{ t: "p", cls: null, c: parseInline(descHtml) }],
          });
        }
        out.push({ t: "dl", items });
        break;
      }
      case "table": {
        const head: Inline[][] = [];
        const rows: Inline[][][] = [];
        const trRe = /<tr\b[^>]*>/gi;
        let m: RegExpExecArray | null;
        const marks: number[] = [];
        while ((m = trRe.exec(inner))) marks.push(m.index);
        for (const at of marks) {
          const tr = sliceElement(inner, at, "tr");
          const cells: Inline[][] = [];
          let isHead = false;
          const cellRe = /<(th|td)\b[^>]*>/gi;
          let c: RegExpExecArray | null;
          const cellMarks: { at: number; tag: string }[] = [];
          while ((c = cellRe.exec(tr.inner))) cellMarks.push({ at: c.index, tag: c[1].toLowerCase() });
          for (const cm of cellMarks) {
            if (cm.tag === "th") isHead = true;
            cells.push(parseInline(sliceElement(tr.inner, cm.at, cm.tag).inner));
          }
          if (isHead && head.length === 0) head.push(...cells);
          else rows.push(cells);
        }
        out.push({ t: "table", head, rows });
        break;
      }
      case "details": {
        const sumAt = inner.search(/<summary\b[^>]*>/i);
        if (sumAt < 0) throw new Error("lbyr-html: <details> with no <summary>");
        const sum = sliceElement(inner, sumAt, "summary");
        out.push({
          t: "details",
          summary: parseInline(sum.inner),
          body: parseBlocks(inner.slice(sum.end)),
        });
        break;
      }
      default:
        throw new Error(`lbyr-html: unhandled block <${tag}>`);
    }
  }
  return out;
}

/** The inner HTML of the nth <section> with the given class. */
export function section(html: string, cls: string, nth = 0): string | null {
  const re = new RegExp(`<section\\b[^>]*class="${cls}"[^>]*>`, "gi");
  let m: RegExpExecArray | null;
  let seen = 0;
  while ((m = re.exec(html))) {
    if (seen++ === nth) return sliceElement(html, m.index, "section").inner;
  }
  return null;
}

/** Plain text of some inline nodes, for a heading comparison or an aria label. */
export function inlineText(nodes: Inline[]): string {
  return nodes
    .map((n) => (n.t === "text" ? n.v : inlineText(n.c)))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
