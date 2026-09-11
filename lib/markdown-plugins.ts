// Small remark plugins for documents that are maintained as prose files rather
// than written for a Markdown renderer. Used by the Before You Say Yes
// resources page; article bodies and guide copy do not need them.
//
// Structural node types are declared locally rather than imported from
// @types/mdast, which is only present transitively.

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  url?: string;
};

function eachParent(node: MdNode, visit: (node: MdNode) => void): void {
  if (!node.children) return;
  visit(node);
  for (const child of node.children) eachParent(child, visit);
}

/**
 * Renders a single newline as a line break, the way someone writing a list of
 * helplines one per line expects. CommonMark folds those into a space, which
 * would run every entry of a country list together into one paragraph.
 */
export function remarkHardBreaks() {
  return (tree: MdNode) => {
    eachParent(tree, (node) => {
      const out: MdNode[] = [];

      for (const child of node.children!) {
        if (child.type !== "text" || !child.value?.includes("\n")) {
          out.push(child);
          continue;
        }
        child.value.split("\n").forEach((part, i) => {
          if (i > 0) out.push({ type: "break" });
          if (part !== "") out.push({ type: "text", value: part });
        });
      }

      node.children = out;
    });
  };
}

// Lowercase host of two or more labels ending in a TLD we actually use, plus an
// optional path. Requiring lowercase keeps prose like the service name
// "Lila.help" as text while still linking the address "lila.help" beside it.
const EMAIL = "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}";
const DOMAIN =
  "\\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+" +
  "(?:com|org|net|help|info|ie|ca|uk|au|nz|za|ke|ng|gh|in|ph|sg|th|gov|edu)" +
  "(?:\\.[a-z]{2})?(?:/[^\\s,;·)\\]]*)?";

function splitText(value: string): MdNode[] {
  const re = new RegExp(`(${EMAIL})|(${DOMAIN})`, "g");
  const out: MdNode[] = [];
  let last = 0;

  for (let m = re.exec(value); m !== null; m = re.exec(value)) {
    if (m.index > last) {
      out.push({ type: "text", value: value.slice(last, m.index) });
    }
    const isEmail = Boolean(m[1]);
    out.push({
      type: "link",
      url: isEmail ? `mailto:${m[0]}` : `https://${m[0]}`,
      children: [{ type: "text", value: m[0] }],
    });
    last = m.index + m[0].length;
  }

  if (out.length === 0) return [{ type: "text", value }];
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  return out;
}

/**
 * Turns bare web addresses and email addresses into links. Text already inside
 * a link is left alone, so the tel: links in the source are untouched.
 */
export function remarkAutolink() {
  const walk = (node: MdNode, inLink: boolean): void => {
    if (!node.children) return;

    const out: MdNode[] = [];
    for (const child of node.children) {
      if (child.type === "link") {
        walk(child, true);
        out.push(child);
      } else if (child.type === "text" && !inLink) {
        out.push(...splitText(child.value ?? ""));
      } else {
        walk(child, inLink);
        out.push(child);
      }
    }
    node.children = out;
  };

  return (tree: MdNode) => walk(tree, false);
}

/**
 * Rewrites the relative links the lessons use between each other —
 * `./05-what-a-retreat-can-and-cannot-do` — onto the course's URL space.
 *
 * A browser would resolve these correctly from the lesson URL anyway, but only
 * by accident of the path shape: one stray trailing slash and every link lands
 * a directory out. Making them absolute at render time removes that dependency,
 * and any `.md` suffix with it.
 */
export function remarkRelativeLessonLinks(basePath: string) {
  const base = basePath.replace(/\/$/, "");

  // unified calls the entry in remarkPlugins as the plugin and expects a
  // transformer back, so a parameterised plugin needs this extra level —
  // returning the transformer directly hands unified an undefined tree.
  return () => (tree: MdNode) => {
    const walk = (node: MdNode): void => {
      if (node.type === "link" && typeof node.url === "string") {
        const m = node.url.match(/^\.\/(.+)$/);
        if (m) {
          const [target, tail = ""] = m[1].split(/(?=[#?])/);
          node.url = `${base}/${target.replace(/\.md$/, "")}${tail}`;
        }
      }
      node.children?.forEach((child) => walk(child));
    };
    walk(tree);
  };
}
