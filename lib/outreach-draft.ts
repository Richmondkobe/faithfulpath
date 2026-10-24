import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GOAL_LABELS, type OutreachGoal, type OutreachProspect } from "@/lib/outreach";
import {
  RESEARCH_MODEL,
  callClaude,
  decodeEntities,
  fetchPage,
  pageTitle,
  publicUrl,
} from "@/lib/outreach-research";

/**
 * The email writer behind "Draft email" and "Draft all" on /admin/outreach.
 *
 * Claude writes from what it is given and nothing else: the text of the site's
 * own page, fetched here; Richmond's suggested article; and a fixed list of
 * facts about him. It must quote the one thing it mentions about the site, and
 * the quote is checked against the page before the draft is kept. The
 * signature and the last line are added here, word for word, rather than left
 * to the model. Nothing is sent.
 */

const SITE = "https://faithfulpathcommunity.com";

export const SIGN_OFF = `Richmond Kobe
Pastor, Faithful Path Community
${SITE}`;
export const OPT_OUT = "If you'd prefer not to hear from me again, just reply and let me know.";

const ABOUT_RICHMOND = [
  "A pastor for over twenty years, across ten countries.",
  "A Master's in Theology from Trinity Western University.",
  "The author of the Faithful Path books.",
  "Offers pastoral and premarital counselling.",
];

const MAX_WORDS = 150;

/** How each fact about Richmond shows up in a draft, to count how many it uses. */
const FACT_MARKERS = [/twenty years|ten countries/i, /trinity western|master'?s in theology/i, /faithful path books|author/i, /counsell?ing/i];
const MAX_FACTS = 2;

/** Mailbox names that are roles, not people. */
const ROLE_NAMES = new Set(
  "info hello contact contacts editor editors office admin administrator team connect media press support mail email webmaster web ministry ministries church pastor pastors general enquiries inquiries help hi news newsletter submissions events care prayer reception staff the".split(" ")
);

/**
 * The greeting: "Hello Cyndee," when the contact's name, or the contact email,
 * clearly shows a first name; otherwise "Hello,". An address counts only when
 * its first part is a plain word of letters that is not a role (info, editor…)
 * and not part of the site's own name.
 */
export function greetingFor(p: Pick<OutreachProspect, "contact_name" | "contact_email" | "domain">): string {
  const cap = (n: string) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
  // A name with a title first ("Rev. Mark Hall") is greeted by the first name.
  const fromName = (p.contact_name ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}'-]/gu, ""))
    .find((w) => w.length >= 2 && !/^(mr|mrs|ms|miss|dr|rev|revd|reverend|pastor|fr|father|pr|bishop)$/i.test(w));
  if (fromName) return `Hello ${cap(fromName)},`;
  const local = p.contact_email?.split("@")[0]?.toLowerCase() ?? "";
  const first = local.split(/[._-]/)[0];
  const siteWords = p.domain.split(".")[0].toLowerCase();
  // An initial run into a surname ("jsmith") is not a first name: names start
  // with a vowel or with a consonant pair English words can start with.
  const nameLike = /^([aeiouy]|[bcdfghjklmnpqrstvwxz]([aeiouy]|[hlr])|s[cklmnptw]|tw|wh|wr)/.test(first);
  // "pastorjohn", "infochurch": a role run into something else.
  const rolePrefix = /^(pastor|rev|father|brother|sister|info|admin|church|ministry|office|team|contact|hello)./.test(first);
  if (/^[a-z]{3,12}$/.test(first) && nameLike && !rolePrefix && !ROLE_NAMES.has(first) && !siteWords.includes(first) && (first === local || /^[a-z]+[._-][a-z]+$/.test(local))) {
    return `Hello ${cap(first)},`;
  }
  return "Hello,";
}

const GOAL_ASK: Record<OutreachGoal, string> = {
  backlink:
    "Offer the suggested article, with its full address, as a resource their readers might find helpful. Never mention SEO, backlinks, links, rankings or traffic.",
  review_copy:
    "Offer a free ebook copy of the one Faithful Path book from the list that best matches their site, for an honest review, with no obligation.",
  guest_article:
    "Offer to write an original article for them, with two or three short topic ideas that fit their site and Richmond's writing.",
  interview:
    "Offer to be a guest on their podcast or blog, with two or three short topic ideas.",
  church_partnership:
    "Offer the course and resources from the list that best fit their church's people (for premarital or marriage ministries, Talk Before You Marry), for them to use freely or point people to.",
};

/** Courses on the site, for the church partnership ask. */
const COURSES = [
  "Talk Before You Marry: fifteen lessons for couples before marriage (with the membership, /membership)",
  "Before You Say Yes: discernment in dating and the decision to marry (with the membership, /membership)",
  "The Christian Spiritual Reset: a guided retreat at home for burnout and spiritual dryness (with the membership, /membership)",
  "When Your Mind Won't Rest: overthinking, worry and fear (with the membership, /membership)",
  "Lead Before You're Ready: for your first years of leading in a church (with the membership, /membership)",
  "Following Jesus: four video courses from new life in Christ to helping others follow Jesus, with a Leader's Guide for groups (/courses/following-jesus)",
];

const DRAFT_TOOL = {
  name: "save_draft",
  description: "Save the email draft.",
  input_schema: {
    type: "object",
    properties: {
      subject: { type: "string", description: "Short, plain subject line. No exclamation marks." },
      body: {
        type: "string",
        description:
          "The email from the greeting to the last sentence before the sign-off. Do not include the sign-off, Richmond's name, the web address line or the unsubscribe line: those are added after.",
      },
      site_detail_quote: {
        type: "string",
        description: "The exact words, copied from the site's page text, of the one specific thing the email mentions about them (5 to 25 words).",
      },
    },
    required: ["subject", "body", "site_detail_quote"],
  },
} as const;

/** The readable text of a page: no scripts, styles or tags, single spaces, capped. */
function pageText(html: string): string {
  const meta = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ?? "";
  const body = html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(`${meta} ${body}`).replace(/\s+/g, " ").trim().slice(0, 9000);
}

/** For comparing a quote with the page: lower case, plain quotes and dashes, single spaces. */
const squash = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

/** The article's title and first real paragraph, as plain text. Read only. */
async function articleSummary(path: string | null): Promise<{ url: string; title: string; firstParagraph: string } | null> {
  const slug = path?.match(/^\/articles\/([a-z0-9-]+)$/)?.[1];
  if (!slug) return null;
  const { data } = await supabaseAdmin
    .from("articles")
    .select("title, body_md")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!data) return null;
  const para =
    (data.body_md as string)
      .replace(/\r/g, "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !/^(#|>|\||-|\*|!|\d+\.|<)/.test(p) && p.length > 60) ?? "";
  const plain = para
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { url: SITE + path, title: data.title as string, firstParagraph: plain };
}

/** Published books, for the review copy ask. Read only. */
async function books(): Promise<string[]> {
  const { data } = await supabaseAdmin.from("products").select("slug, title, subtitle").eq("published", true);
  return (data ?? []).map((b) => `${b.title}${b.subtitle ? `: ${b.subtitle}` : ""} (${SITE}/guides/${b.slug})`);
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Problems with a draft that the rules forbid, in plain words. Empty when it passes. */
function problems(d: { subject: string; body: string; site_detail_quote: string }, text: string, goal: OutreachGoal, greeting: string): string[] {
  const out: string[] = [];
  if (!d.body.startsWith(greeting)) out.push(`It must begin with exactly "${greeting}".`);
  const facts = FACT_MARKERS.filter((m) => m.test(d.body)).length;
  if (facts > MAX_FACTS) out.push(`It uses ${facts} facts about Richmond; use only the one or two that fit best, in one sentence.`);
  const full = `${d.body}\n\n${SIGN_OFF}\n\n${OPT_OUT}`;
  if (words(full) >= MAX_WORDS) out.push(`The whole email is ${words(full)} words with the sign-off; it must be under ${MAX_WORDS}, so the body must be shorter.`);
  if (/!/.test(d.subject + d.body)) out.push("It uses an exclamation mark; use none.");
  if (d.subject.length > 70 || words(d.subject) > 10) out.push("The subject line is too long; keep it short and plain.");
  if (/\b(seo|backlinks?|link ?building|link juice|domain authority|rankings?|traffic)\b/i.test(d.subject + d.body)) {
    out.push("It mentions SEO, links, rankings or traffic; it must not.");
  }
  if (/richmond kobe\s*$/i.test(d.body.trim()) || /faithfulpathcommunity\.com\s*$/i.test(d.body.trim()) || /prefer not to hear/i.test(d.body)) {
    out.push("It includes the sign-off or the last line; leave those out, they are added after.");
  }
  const q = squash(d.site_detail_quote);
  if (words(q) < 4 || !squash(text).includes(q)) {
    out.push("The site detail quote is not exact words from the site's page text. Copy a phrase exactly as it appears there, and mention only that in the email.");
  }
  if (goal === "backlink" && !d.body.includes(SITE + "/articles/")) out.push("It does not include the article's full address.");
  return out;
}

export type DraftResult = { ok: true; subject: string; body: string } | { ok: false; error: string };

/**
 * Drafts the email for one prospect and saves it, setting the status to
 * Drafted. The row is left as it was if anything fails.
 */
export async function draftProspectEmail(p: OutreachProspect, db: SupabaseClient): Promise<DraftResult> {
  if (["sent", "replied", "declined", "skipped"].includes(p.status)) {
    return { ok: false, error: `This site is marked ${p.status}, so it was not drafted.` };
  }

  // The page the agent found, then the home page if that one cannot be read.
  let source: { url: string; title: string; text: string } | null = null;
  let blockedStatus: number | null = null;
  const tried = new Set<string>();
  for (const raw of [p.site_url, p.site_url ? new URL(p.site_url).origin + "/" : null]) {
    const u = publicUrl(raw);
    if (!u || tried.has(u.href)) continue;
    tried.add(u.href);
    const page = await fetchPage(u);
    if (page && page.status < 400) {
      const text = pageText(page.html);
      if (text.length > 200) {
        source = { url: page.url.href, title: pageTitle(page.html), text };
        break;
      }
    } else if (page) blockedStatus = page.status;
  }
  if (!source) {
    return {
      ok: false,
      error: blockedStatus
        ? `Their site turned the checker away (status ${blockedStatus}), so nothing on it could be read. Write this one yourself, so it only says what is true.`
        : "Their site could not be read, so there is nothing true to mention. Write this one yourself.",
    };
  }

  const article = await articleSummary(p.suggested_page);
  if (!article && p.goal === "backlink") return { ok: false, error: "The suggested page is not a published article. Choose one first." };
  const bookList = p.goal === "review_copy" ? await books() : [];

  const greeting = greetingFor(p);
  const prompt = `Write a short outreach email from Pastor Richmond Kobe of Faithful Path Community to ${p.site_name}.

Goal: ${GOAL_LABELS[p.goal]}. The one ask: ${GOAL_ASK[p.goal]}
The greeting, exactly: "${greeting}"

About Richmond: introduce him in ONE sentence, using only the one or two of these facts that fit their site best (not the whole list), and nothing else about him:
${ABOUT_RICHMOND.map((f) => `- ${f}`).join("\n")}

${article ? `Richmond's suggested article: "${article.title}" — ${article.url}\nIts first paragraph: ${article.firstParagraph}\n` : ""}${bookList.length ? `Faithful Path books (offer only one of these):\n${bookList.map((b) => `- ${b}`).join("\n")}\n` : ""}${p.goal === "church_partnership" ? `Faithful Path courses (offer only from these, by name; addresses are on ${SITE}):\n${COURSES.map((c) => `- ${c}`).join("\n")}\n` : ""}
Their site (${source.url}${source.title ? `, "${source.title}"` : ""}). This is the only thing you know about them. Choose ONE specific, real thing from this text, and do not say anything else about them, their ministry or their readers that this text does not say:
"""
${source.text}
"""

How it must read:
- The order: the greeting; then an opening of one or two sentences that connects the real thing on their site to why the article (or offer) fits their readers, in your own words (do not simply quote a line back to them); then Richmond's one-sentence introduction; then the ask; then the closing.
- Warm, humble, pastoral, plain English. Canadian spelling (counselling, centre, honour, favour).
- Under ${MAX_WORDS - words(SIGN_OFF) - words(OPT_OUT) - 5} words in the body. A short subject line, no clickbait.
- No exclamation marks. No flattery beyond one sincere sentence. No pressure, no deadlines, no mention of following up.
- One clear, gentle ask, as above.
- End the body with a short closing such as "With thanks," or "Grace and peace,". Do not write the signature or any unsubscribe line; those are added after.

Call save_draft with the subject, the body and the exact words from their page that your one specific mention is based on (the quote is for checking; the email itself should put it in your own words).`;

  let feedback: string[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await callClaude({
      model: RESEARCH_MODEL,
      max_tokens: 1500,
      tools: [DRAFT_TOOL],
      messages: [
        {
          role: "user",
          content: feedback.length
            ? `${prompt}\n\nYour last draft broke these rules; fix them:\n${feedback.map((f) => `- ${f}`).join("\n")}`
            : prompt,
        },
      ],
    });
    const call = res.content.find((b) => b.type === "tool_use" && b.name === "save_draft");
    const d = call?.input as { subject?: string; body?: string; site_detail_quote?: string } | undefined;
    if (!d?.subject || !d.body || !d.site_detail_quote) {
      feedback = ["Do not answer in text: call the save_draft tool, with all three fields."];
      continue;
    }
    // The one Canadian spelling the rules name, made certain.
    const fix = (s: string) => s.replace(/\b([Cc])ounsel(ing|or|ors)\b/g, "$1ounsell$2");
    const draft = { subject: fix(d.subject.trim()), body: fix(d.body.trim()), site_detail_quote: d.site_detail_quote.trim() };
    feedback = problems(draft, source.text, p.goal, greeting);
    if (feedback.length) continue;

    const body = `${draft.body}\n\n${SIGN_OFF}\n\n${OPT_OUT}`;
    const { error } = await db
      .from("outreach_prospects")
      .update({ draft_subject: draft.subject, draft_body: body, status: "drafted" })
      .eq("id", p.id);
    if (error) return { ok: false, error: `Could not save the draft: ${error.message}` };
    return { ok: true, subject: draft.subject, body };
  }
  return { ok: false, error: `No draft passed the checks after three tries (${feedback.join(" ")}). Nothing was saved.` };
}
