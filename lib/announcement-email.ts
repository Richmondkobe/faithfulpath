import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Nodes, Root } from "mdast";
import { SITE } from "@/lib/site";
import type { Announcement } from "@/lib/community";

/**
 * An announcement as an email for MailerLite: the Markdown turned into plain,
 * inline-styled HTML, with the link button, a link to the community, and the
 * unsubscribe link MailerLite requires ({$unsubscribe}).
 *
 * The Markdown is rendered here by hand rather than through a full HTML
 * pipeline: an announcement uses paragraphs, headings, bold, italics, links
 * and lists, and raw HTML in the source is escaped, never passed through.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const NAVY = "#1f2d45";
const GOLD = "#d4a24c";
const TEXT = "#2b3445";

/** Links only to http(s), mail and the site's own pages; a relative link is made absolute. */
function safeHref(url: string): string | null {
  if (url.startsWith("/")) return `${SITE.url}${url}`;
  return /^(https?:|mailto:)/i.test(url) ? url : null;
}

function render(node: Nodes): string {
  const kids = () => ("children" in node ? (node.children as Nodes[]).map(render).join("") : "");
  switch (node.type) {
    case "root":
      return kids();
    case "paragraph":
      return `<p style="margin:0 0 16px;line-height:1.6;color:${TEXT}">${kids()}</p>`;
    case "heading":
      return `<h${Math.min(node.depth + 1, 4)} style="margin:24px 0 8px;color:${NAVY};font-family:Georgia,serif;font-weight:500">${kids()}</h${Math.min(node.depth + 1, 4)}>`;
    case "text":
      return esc(node.value);
    case "strong":
      return `<strong>${kids()}</strong>`;
    case "emphasis":
      return `<em>${kids()}</em>`;
    case "delete":
      return `<s>${kids()}</s>`;
    case "inlineCode":
      return `<code>${esc(node.value)}</code>`;
    case "code":
      return `<pre style="white-space:pre-wrap">${esc(node.value)}</pre>`;
    case "break":
      return "<br>";
    case "thematicBreak":
      return `<hr style="border:0;border-top:1px solid #e3d6b8;margin:24px 0">`;
    case "blockquote":
      return `<blockquote style="margin:0 0 16px;padding-left:16px;border-left:3px solid ${GOLD};color:#434b5c">${kids()}</blockquote>`;
    case "list":
      return node.ordered
        ? `<ol style="margin:0 0 16px;padding-left:24px;line-height:1.6;color:${TEXT}">${kids()}</ol>`
        : `<ul style="margin:0 0 16px;padding-left:24px;line-height:1.6;color:${TEXT}">${kids()}</ul>`;
    case "listItem":
      // A list item's paragraphs without their bottom margin.
      return `<li>${(node.children as Nodes[]).map((c) => (c.type === "paragraph" ? (c.children as Nodes[]).map(render).join("") : render(c))).join("")}</li>`;
    case "link": {
      const href = safeHref(node.url);
      return href ? `<a href="${esc(href)}" style="color:#5e4412">${kids()}</a>` : kids();
    }
    case "image":
      return node.alt ? esc(node.alt) : "";
    case "html":
      return esc(node.value);
    default:
      return kids();
  }
}

export function markdownToEmailHtml(markdown: string): string {
  const processor = unified().use(remarkParse).use(remarkGfm);
  return render(processor.runSync(processor.parse(markdown)) as Root);
}

export function announcementEmailHtml(a: Pick<Announcement, "title" | "body" | "link_label" | "link_url">): string {
  const href = a.link_url ? safeHref(a.link_url) : null;
  const button = href
    ? `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:${GOLD};color:#121b30;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none">${esc(a.link_label || "Find out more")}</a></p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;background:#f7f1e3;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">
<div style="background:${NAVY};border-radius:16px 16px 0 0;padding:20px 24px;color:#f3e7c9;font-family:Georgia,serif;font-size:20px">Faithful Path Community</div>
<div style="background:#fffaf0;border-radius:0 0 16px 16px;padding:24px">
<h1 style="margin:0 0 16px;color:${NAVY};font-family:Georgia,serif;font-weight:400;font-size:26px">${esc(a.title)}</h1>
${markdownToEmailHtml(a.body)}
${button}
<p style="margin:24px 0 0;line-height:1.6;color:${TEXT}">Pastor Richmond Kobe</p>
</div>
<p style="font-size:13px;line-height:1.6;color:#434b5c;padding:16px 8px">You are receiving this because you joined the Faithful Path Community. <a href="${SITE.url}/community/home" style="color:#5e4412">Go to the community</a> · <a href="{$unsubscribe}" style="color:#5e4412">Unsubscribe</a></p>
</div>
</body></html>`;
}
