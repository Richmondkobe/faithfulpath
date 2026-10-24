// Types and pure helpers for backlink outreach — safe to import from Client
// Components. Queries live in lib/outreach-db.ts.

export const OUTREACH_STATUSES = [
  "new",
  "drafted",
  "approved",
  "sent",
  "replied",
  "declined",
  "skipped",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const STATUS_LABELS: Record<OutreachStatus, string> = {
  new: "New",
  drafted: "Drafted",
  approved: "Approved",
  sent: "Sent",
  replied: "Replied",
  declined: "Declined",
  skipped: "Skipped",
};

export const OUTREACH_GOALS = [
  "backlink",
  "review_copy",
  "guest_article",
  "interview",
  "church_partnership",
] as const;

export type OutreachGoal = (typeof OUTREACH_GOALS)[number];

export const GOAL_LABELS: Record<OutreachGoal, string> = {
  backlink: "Backlink",
  review_copy: "Review copy",
  guest_article: "Guest article",
  interview: "Interview",
  church_partnership: "Church partnership",
};

export function isOutreachGoal(s: string): s is OutreachGoal {
  return (OUTREACH_GOALS as readonly string[]).includes(s);
}

export function isOutreachStatus(s: string): s is OutreachStatus {
  return (OUTREACH_STATUSES as readonly string[]).includes(s);
}

export type OutreachProspect = {
  id: string;
  site_name: string;
  site_url: string;
  domain: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_page_url: string | null;
  why_relevant: string | null;
  goal: OutreachGoal;
  suggested_page: string | null;
  draft_subject: string | null;
  draft_body: string | null;
  status: OutreachStatus;
  notes: string | null;
  sent_at: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * A web address as typed, made whole: "example.org/blog" becomes
 * "https://example.org/blog". Null when it is not an http(s) address at all.
 */
export function normaliseUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** The site a URL belongs to: "https://www.Example.org/blog" -> "example.org". */
export function domainFromUrl(raw: string): string | null {
  const url = normaliseUrl(raw);
  if (!url) return null;
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

/** A loose check that catches typing slips, not a full address validator. */
export function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
