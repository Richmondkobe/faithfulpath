import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCategory } from "@/lib/categories";
import { GOAL_LABELS, domainFromUrl, looksLikeEmail, normaliseUrl, type OutreachGoal } from "@/lib/outreach";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The research agent behind "Find sites" on /admin/outreach.
 *
 * Claude searches the web (Anthropic's web search tool, capped per run) and
 * hands back its list through a tool of ours, submit_sites. Nothing it says is
 * saved on its word: every site is checked here first. The address must load,
 * the domain must be new to the list, the suggested page must be one of the
 * articles it was given, and an email is kept only if it appears on a page of
 * that site that this code fetched itself. Otherwise the email is left blank.
 */

export const RESEARCH_MODEL = "claude-sonnet-5-5";
/** Web searches allowed in one run, across every request the run makes. */
export const MAX_SEARCHES = 15;
/** Requests to the API in one run: the first, plus continuations. */
const MAX_REQUESTS = 6;

export const RESEARCH_TOPICS = [
  "burnout-rest-and-retreats",
  "overthinking-and-worry",
  "prayer-and-hearing-god",
  "dating-and-discernment",
  "marriage-and-premarital",
  "church-leadership",
] as const;

const GOAL_BRIEF: Record<OutreachGoal, string> = {
  backlink:
    "Christian blogs, ministry resource pages, church resource lists and directories that link out to helpful articles on this topic, where a link to one of Richmond's articles would genuinely help their readers.",
  review_copy:
    "Christian book reviewers, book bloggers and ministry sites that review Christian books on this topic and invite authors to send review copies.",
  guest_article:
    "Christian blogs and ministry sites that openly accept guest posts or contributor articles on this topic, free of charge (look for 'write for us', 'submissions' or 'contributor guidelines' pages).",
  interview:
    "Christian podcasts and video shows on this topic that interview pastors or authors, and that are still publishing episodes.",
  church_partnership:
    "Churches and ministries running programmes related to this topic (for example marriage, premarital, young adult, prayer, care or leadership programmes) that might share or partner on resources.",
};

export type ResearchSite = {
  site_name: string;
  site_url: string;
  contact_email: string | null;
  email_source_url: string | null;
  contact_page_url: string | null;
  why_relevant: string;
  suggested_page: string;
  country: string | null;
  last_active: string | null;
};

export type ProgressEvent =
  | { type: "progress"; message: string }
  | { type: "site"; outcome: "added" | "skipped"; site: string; reason?: string; note?: string }
  | { type: "done"; summary: ResearchSummary }
  | { type: "error"; message: string };

export type ResearchSummary = {
  found: number;
  added: number;
  skipped: { site: string; reason: string }[];
  agentSkipped: { site: string; reason: string }[];
  searches: number;
  emailsBlanked: number;
  /** Addresses the checker found published on a site when the agent had none. */
  emailsFound: number;
  /** Sites where only a personal or other-domain address was found (it is in the notes). */
  otherAddresses: number;
  /** Sites that turned the checker away. */
  blocked: number;
};

const SUBMIT_TOOL = {
  name: "submit_sites",
  description:
    "Hand back the sites you found, and the ones you rejected. Call this once, at the end, when you have finished searching.",
  input_schema: {
    type: "object",
    properties: {
      sites: {
        type: "array",
        items: {
          type: "object",
          properties: {
            site_name: { type: "string" },
            site_url: { type: "string", description: "The site's home page." },
            contact_email: {
              type: ["string", "null"],
              description: "Only an address you saw published on the site. Never guessed. Null if none.",
            },
            email_source_url: {
              type: ["string", "null"],
              description: "The page on the site where that email address is published.",
            },
            contact_page_url: { type: ["string", "null"], description: "The site's contact or submissions page, if any." },
            why_relevant: { type: "string", description: "One or two sentences." },
            suggested_page: { type: "string", description: "One of the article paths given, e.g. /articles/slug." },
            country: { type: ["string", "null"] },
            last_active: { type: ["string", "null"], description: "Evidence of recent activity, e.g. 'latest post Sept 2026'." },
          },
          required: ["site_name", "site_url", "contact_email", "email_source_url", "contact_page_url", "why_relevant", "suggested_page", "country", "last_active"],
        },
      },
      rejected: {
        type: "array",
        description: "Sites you looked at and decided against, with the reason.",
        items: {
          type: "object",
          properties: { site: { type: "string" }, reason: { type: "string" } },
          required: ["site", "reason"],
        },
      },
    },
    required: ["sites", "rejected"],
  },
} as const;

export type ApiBlock = { type: string; [k: string]: unknown };
export type ApiResponse = {
  content: ApiBlock[];
  stop_reason: string;
  usage?: { server_tool_use?: { web_search_requests?: number } };
  container?: { id?: string } | null;
  error?: { message?: string };
};

export async function callClaude(body: object): Promise<ApiResponse> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set for this site.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as ApiResponse;
  if (!res.ok) {
    // The API's own message, never the request (which holds nothing secret
    // anyway, the key being a header).
    throw new Error(`The Anthropic API refused the request (${res.status}): ${json.error?.message ?? "no detail"}`);
  }
  return json;
}

/** Published articles in a category, as path and title. Read only. */
async function articlesIn(category: string): Promise<{ path: string; title: string }[]> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("slug, title")
    .eq("published", true)
    .eq("category", category)
    .order("published_at", { ascending: false });
  if (error) throw new Error(`Could not read the articles: ${error.message}`);
  return (data ?? []).map((a) => ({ path: `/articles/${a.slug}`, title: a.title as string }));
}

function prompt(goal: OutreachGoal, topicLabel: string, topicDescription: string, count: number, articles: { path: string; title: string }[], known: string[]) {
  const today = new Date().toISOString().slice(0, 10);
  return `You are helping Pastor Richmond Kobe of Faithful Path Community (https://faithfulpathcommunity.com) find sites for respectful, personal outreach. Today is ${today}.

Goal: ${GOAL_LABELS[goal]} — ${GOAL_BRIEF[goal]}
Topic: ${topicLabel} — ${topicDescription}
Find: ${count} sites.

Stay strictly on this topic. Every search and every site must be about ${topicLabel} itself. Some of the articles below touch other subjects (for example social media or retreats); do not search for those subjects, and do not choose a site because it matches one of them.

Richmond's published articles on this topic (choose the best fit for each site as suggested_page, using the path exactly as written):
${articles.map((a) => `- ${a.path} — ${a.title}`).join("\n")}

What to look for:
- Real, active, English-language Christian blogs, ministry sites, church resource pages, podcasts or directories. Prefer the US, Canada, the UK and Australia.
- Active means something published in the last 12 months. Say what you saw in last_active.

Skip, and list in "rejected" with the reason:
- Sites that sell links, charge for guest posts or sponsored posts, or exist to sell placements.
- Link farms, content mills, spammy or AI-generated sites, and sites inactive for more than a year.
- Big platforms where outreach would go nowhere (Wikipedia, Amazon, large news sites).
- Social media of any kind: Facebook, Instagram, X/Twitter, TikTok, YouTube channels, Pinterest, LinkedIn, Threads, Reddit, and blogs about social media or church marketing.
- These domains, which are already in Richmond's list: ${known.length ? known.join(", ") : "(none yet)"}.

Contact details — this matters most:
- Only give a contact_email that you actually saw published on that site, and put the page where you saw it in email_source_url. Never guess, construct or "complete" an address (no info@ or hello@ unless you saw it written).
- If you did not see an address, set contact_email to null and give the contact or submissions page in contact_page_url if there is one.

You have at most ${MAX_SEARCHES} web searches, so search efficiently. When you are done, call submit_sites once with up to ${count} sites and the rejected list. Do not write a long answer in text.`;
}

/** Plain-language host checks for addresses that came from the model. */
export function publicUrl(raw: string | null | undefined): URL | null {
  const n = raw ? normaliseUrl(raw) : null;
  if (!n) return null;
  const u = new URL(n);
  const h = u.hostname.toLowerCase();
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(":") || h === "localhost" || /\.(local|internal|localhost)$/.test(h)) return null;
  return u;
}

const sameSite = (u: URL, domain: string) => {
  const h = u.hostname.toLowerCase().replace(/^www\./, "");
  return h === domain || h.endsWith("." + domain);
};

/** A page's text, or null when it could not be loaded. Capped in time and size. */
export async function fetchPage(url: URL): Promise<{ status: number; html: string; url: URL } | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; FaithfulPathOutreach/1.0; +https://faithfulpathcommunity.com)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const dec = new TextDecoder();
      while (html.length < 1_500_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += dec.decode(value, { stream: true });
      }
      reader.cancel().catch(() => {});
    }
    return { status: res.status, html, url: new URL(res.url || url.toString()) };
  } catch {
    return null;
  }
}

/** Social platforms: never outreach targets, whatever the agent says. */
const SOCIAL = /(^|\.)(facebook|instagram|twitter|x|tiktok|youtube|youtu|pinterest|linkedin|threads|reddit|snapchat)\.(com|be|net)$/;

/** Addresses on a page that say "contact", or are where a site takes submissions. */
const CONTACT_WORDS = /contact|get-?in-?touch|reach-?us|write-?for-?us|submi(t|ssion)|contribut|guest-?post|connect-?with/i;
const ABOUT_WORDS = /\babout\b|about-?us|our-?team|staff|leadership-?team/i;

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&commat;/gi, "@")
    .replace(/&period;/gi, ".")
    .replace(/&amp;/gi, "&");
}

export function pageTitle(html: string): string {
  return decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
}

/** Whether a page is a contact (or, failing that, about) page, from its address and title. */
function contactKind(url: URL, title: string): "contact" | "about" | null {
  const where = url.pathname + " " + title;
  if (CONTACT_WORDS.test(where)) return "contact";
  if (ABOUT_WORDS.test(where)) return "about";
  return null;
}

/** Same-site links on a page whose address or text says contact (or about), best first. */
function contactLinks(html: string, base: URL, domain: string): URL[] {
  const found: { url: URL; score: number }[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u: URL;
    try { u = new URL(decodeEntities(m[1]), base); } catch { continue; }
    if ((u.protocol !== "https:" && u.protocol !== "http:") || !sameSite(u, domain)) continue;
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, " ")).trim();
    const where = u.pathname + " " + text;
    const score = CONTACT_WORDS.test(where) ? 2 : ABOUT_WORDS.test(where) ? 1 : 0;
    if (score && !found.some((f) => f.url.href === u.href)) found.push({ url: u, score });
  }
  return found.sort((a, b) => b.score - a.score).map((f) => f.url);
}

/** Email addresses published on a page: mailto links first, then plain text. */
function publishedEmails(html: string): string[] {
  const out: string[] = [];
  const add = (raw: string) => {
    const e = raw.trim().toLowerCase().replace(/^mailto:/, "").split("?")[0];
    if (!looksLikeEmail(e)) return;
    // Not addresses: image names ("logo@2x.png"), tracking and placeholder ones.
    if (/\.(png|jpe?g|gif|svg|webp|css|js)$/.test(e)) return;
    if (/(no-?reply|example\.(com|org)|sentry|wixpress|domain\.com|email\.com|yourname|@2x)/.test(e)) return;
    if (!out.includes(e)) out.push(e);
  };
  for (const m of html.matchAll(/href\s*=\s*["']mailto:([^"']+)["']/gi)) add(decodeEntities(m[1]));
  const text = decodeEntities(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " "));
  for (const m of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) add(m[0]);
  return out;
}

/** The best published address for outreach: on the site's own domain, and a general one if there is one. */
/** Whether an address belongs to the site itself: its domain or a subdomain of it. */
const onDomain = (email: string, domain: string) => {
  const d = email.split("@")[1] ?? "";
  return d === domain || d.endsWith("." + domain);
};

/** The best address on the site's own domain, a general one if there is one. */
function pickEmail(emails: string[], domain: string): string | null {
  const own = emails.filter((e) => onDomain(e, domain));
  return own.find((e) => /^(info|hello|contact|editor|editors|office|admin|team|connect|media|press)@/.test(e)) ?? own[0] ?? null;
}

/** Whether an address is written on the page, allowing the usual ways of hiding it from spam bots. */
function pageShowsEmail(html: string, email: string): boolean {
  const text = html
    .replace(/&#64;|&#x40;|&commat;/gi, "@")
    .replace(/&#46;|&#x2e;|&period;/gi, ".")
    .replace(/\s*[\[(]\s*at\s*[\])]\s*/gi, "@")
    .replace(/\s*[\[(]\s*dot\s*[\])]\s*/gi, ".")
    .toLowerCase();
  return text.includes(email.toLowerCase());
}

export async function runResearch(
  opts: { goal: OutreachGoal; category: string; count: number; db: SupabaseClient },
  emit: (e: ProgressEvent) => void
): Promise<ResearchSummary> {
  const topic = getCategory(opts.category);
  if (!topic) throw new Error("Unknown topic.");

  emit({ type: "progress", message: `Reading your published articles in ${topic.label}…` });
  const articles = await articlesIn(opts.category);
  if (articles.length === 0) throw new Error(`There are no published articles in ${topic.label} to suggest.`);
  const allowedPaths = new Set(articles.map((a) => a.path));

  emit({ type: "progress", message: "Checking the sites already in your list…" });
  const { data: knownRows, error: knownErr } = await opts.db.from("outreach_prospects").select("domain");
  if (knownErr) throw new Error(`Could not read the outreach list: ${knownErr.message}`);
  const known = new Set((knownRows ?? []).map((r) => r.domain as string));

  // ----- the agent -----
  const messages: { role: "user" | "assistant"; content: unknown }[] = [
    { role: "user", content: prompt(opts.goal, topic.label, topic.description, opts.count, articles, [...known]) },
  ];
  let searches = 0;
  type Submitted = { sites?: ResearchSite[]; rejected?: { site: string; reason: string }[] };
  let submitted = null as Submitted | null;
  let container: string | undefined;

  emit({ type: "progress", message: `Searching the web (up to ${MAX_SEARCHES} searches; usually two to four minutes)…` });

  for (let i = 0; i < MAX_REQUESTS && !submitted; i++) {
    const remaining = MAX_SEARCHES - searches;
    const res = await callClaude({
      model: RESEARCH_MODEL,
      max_tokens: 16000,
      messages,
      ...(container ? { container } : {}),
      // max_uses counts per request, so each continuation gets only what is left.
      tools: [{ type: "web_search_20260318", name: "web_search", max_uses: Math.max(1, remaining) }, SUBMIT_TOOL],
    });
    container = res.container?.id ?? container;
    searches += res.usage?.server_tool_use?.web_search_requests ?? 0;

    const queries = res.content
      .filter((b) => b.type === "server_tool_use" && b.name === "web_search")
      .map((b) => (b.input as { query?: string })?.query)
      .filter(Boolean);
    if (queries.length) emit({ type: "progress", message: `Searched: ${queries.map((q) => `“${q}”`).join(", ")}` });
    emit({ type: "progress", message: `${Math.min(searches, MAX_SEARCHES)} of ${MAX_SEARCHES} searches used.` });

    const submit = res.content.find((b) => b.type === "tool_use" && b.name === "submit_sites");
    if (submit) {
      submitted = submit.input as Submitted;
      break;
    }
    messages.push({ role: "assistant", content: res.content });
    if (res.stop_reason === "pause_turn") continue;
    // It finished without handing the list back: ask once more, and make it.
    // It finished without handing the list back. This model cannot be made
    // to call a tool, so it is asked, plainly, with no more searching.
    messages.push({ role: "user", content: "Do not search again. Call submit_sites now with what you have found." });
  }

  if (!submitted) throw new Error("The research agent did not hand back a list. Nothing was added; try again.");

  const sites = (submitted.sites ?? []).slice(0, opts.count);
  const summary: ResearchSummary = {
    found: sites.length,
    added: 0,
    skipped: [],
    agentSkipped: (submitted.rejected ?? []).slice(0, 30),
    searches: Math.min(searches, MAX_SEARCHES),
    emailsBlanked: 0,
    emailsFound: 0,
    otherAddresses: 0,
    blocked: 0,
  };

  // ----- checking each site before it is saved -----
  const stamp = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  for (const s of sites) {
    const name = (s.site_name ?? "").trim() || s.site_url;
    const skip = (reason: string) => {
      summary.skipped.push({ site: name, reason });
      emit({ type: "site", outcome: "skipped", site: name, reason });
    };
    emit({ type: "progress", message: `Checking ${name}…` });

    const home = publicUrl(s.site_url);
    const domain = home ? domainFromUrl(home.toString()) : null;
    if (!home || !domain) { skip("its web address was not usable"); continue; }
    if (known.has(domain)) { skip(`${domain} is already in your list`); continue; }

    const page = await fetchPage(home);
    if (!page || page.status === 404 || page.status === 410 || page.status >= 500) {
      skip(`${domain} did not load${page ? ` (status ${page.status})` : ""}`);
      continue;
    }
    // Sites that turn automated visitors away (401, 403, 429): the site is
    // there, but nothing on it can be read, so its contacts cannot be checked.
    const blocked = new Set<number>();
    if (page.status >= 400) blocked.add(page.status);

    if (SOCIAL.test(domain)) { skip(`${domain} is a social media site`); continue; }

    // A contact page is kept only if it is on the same site, loads, and is
    // really a contact page (or, failing that, an about page): by its address
    // or its title. The agent's suggestion is tried first, then the contact
    // links on the home page.
    let note = "";
    const pages: { url: URL; html: string; kind: "contact" | "about" }[] = [];
    const tryPage = async (u: URL | null) => {
      if (!u || !sameSite(u, domain) || pages.some((p) => p.url.href === u.href)) return;
      const c = await fetchPage(u);
      if (c && [401, 403, 429].includes(c.status)) blocked.add(c.status);
      if (!c || c.status >= 400) return;
      const kind = contactKind(c.url, pageTitle(c.html)) ?? contactKind(u, "");
      if (kind) pages.push({ url: c.url, html: c.html, kind });
    };
    const agentPage = publicUrl(s.contact_page_url);
    await tryPage(agentPage);
    if (agentPage && pages.length === 0) note += " The page the agent gave as the contact page was not one, so it was not used.";
    if (!pages.some((p) => p.kind === "contact")) {
      for (const link of contactLinks(page.html, page.url, domain).slice(0, 2)) await tryPage(link);
    }
    const contactPage = pages.find((p) => p.kind === "contact") ?? pages.find((p) => p.kind === "about") ?? null;

    // The email is kept only if this code saw it on the site, and only if it
    // is on the site's own domain. A personal or other-domain address seen on
    // the site goes in the notes for Richmond to check instead.
    const others: string[] = [];
    let email = (s.contact_email ?? "").trim().toLowerCase() || null;
    if (email) {
      let seen = false;
      if (looksLikeEmail(email)) {
        const sources: string[] = [page.html, ...pages.map((p) => p.html)];
        const src = publicUrl(s.email_source_url);
        if (src && sameSite(src, domain) && ![home.href, ...pages.map((p) => p.url.href)].includes(src.href)) {
          const p = await fetchPage(src);
          if (p && [401, 403, 429].includes(p.status)) blocked.add(p.status);
          if (p) sources.push(p.html);
        }
        seen = sources.some((h) => pageShowsEmail(h, email!));
      }
      if (!seen) {
        summary.emailsBlanked++;
        note += ` The agent gave an email address (${email}) that could not be found on the site, so it was not used.`;
        email = null;
      } else if (!onDomain(email, domain)) {
        others.push(email);
        email = null;
      }
    }
    // None from the agent: an address published on the contact page, the
    // about page or the home page, in that order.
    if (!email) {
      for (const src of [...pages.filter((p) => p.kind === "contact"), ...pages.filter((p) => p.kind === "about"), { url: page.url, html: page.html }]) {
        const all = publishedEmails(src.html);
        const found = pickEmail(all, domain);
        if (found) {
          email = found;
          summary.emailsFound++;
          note += ` Email found by the checker on ${src.url.href}.`;
          break;
        }
        for (const o of all) if (!others.includes(o)) others.push(o);
      }
    }
    if (others.length) {
      summary.otherAddresses++;
      note += ` Other address found: ${others.slice(0, 3).join(", ")} (check before using).`;
    }
    if (blocked.size) {
      summary.blocked++;
      note += ` The site blocked the automatic checker (status ${[...blocked].join(", ")}), so its contact details could not be checked. Find them on the site yourself.`;
    }

    const suggested = allowedPaths.has(s.suggested_page) ? s.suggested_page : articles[0].path;
    const why = (s.why_relevant ?? "").trim().slice(0, 600) || null;
    const extra = [s.country && `Country: ${s.country}.`, s.last_active && `Activity: ${s.last_active}.`].filter(Boolean).join(" ");

    const { error } = await opts.db.from("outreach_prospects").insert({
      site_name: name.slice(0, 200),
      site_url: home.toString(),
      domain,
      contact_email: email,
      contact_page_url: contactPage?.url.href ?? null,
      why_relevant: why,
      suggested_page: suggested,
      goal: opts.goal,
      status: "new",
      notes: `Found by research agent on ${stamp}.${extra ? " " + extra : ""}${note}`,
    });
    if (error) {
      skip(error.code === "23505" ? `${domain} is already in your list` : `could not be saved: ${error.message}`);
      continue;
    }
    known.add(domain);
    summary.added++;
    emit({ type: "site", outcome: "added", site: name, note: email ? `email ${email}` : contactPage ? "contact page" : "no contact found" });
  }

  return summary;
}
