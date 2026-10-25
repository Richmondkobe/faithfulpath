// Types and limits for the free community — safe to import from Client
// Components. Queries live in lib/community-db.ts.
//
// A community account is not a membership. Nothing in this file, or anything
// that imports it, opens a course: those check the members table or a
// Following Jesus purchase, never "signed in".

export const PRAYER_MAX = 1000;
export const ANSWER_MAX = 500;
export const PRAYERS_PER_DAY = 3;
export const FULL_NAME_MAX = 80;
export const FIRST_NAME_MAX = 40;
export const COUNTRY_MAX = 60;
export const PHONE_MAX = 30;
export const JOIN_MESSAGE_MAX = 500;
export const JOIN_MESSAGE_LABEL = "Tell us a little about yourself and why you’d like to join";

/** A gathering is shown as "next" until this long after it starts. */
export const GATHERING_GRACE_MINUTES = 90;
/** Used for the calendar file; the admin form has no end time. */
export const GATHERING_MINUTES = 60;

export const COMMUNITY_HOME = "/community/home";
export const COMMUNITY_JOIN = "/community/join";
export const COMMUNITY_SIGN_IN = "/community/sign-in";

/** A yes/no cookie: this browser's person has joined, so the footer stops inviting them. */
export const JOINED_COOKIE = "fp_community";

export type CommunityProfile = {
  user_id: string;
  email: string;
  full_name: string;
  first_name: string;
  country: string;
  phone: string | null;
  join_message: string;
  joined_at: string;
  is_banned: boolean;
  mailerlite_synced_at: string | null;
  mailerlite_error: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  link_label: string | null;
  link_url: string | null;
  pinned: boolean;
  emailed_at: string | null;
  email_error: string | null;
  created_at: string;
  updated_at: string;
};

/** The part of a full name shown on the Prayer Wall: its first word. */
export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0]?.slice(0, FIRST_NAME_MAX) ?? "";
}

export type PrayerStatus = "pending" | "approved" | "rejected";

export type PrayerRequest = {
  id: string;
  user_id: string;
  body: string;
  show_name: boolean;
  display_name: string | null;
  status: PrayerStatus;
  reported_at: string | null;
  report_count: number;
  prayed_count: number;
  answered_at: string | null;
  answer_note: string | null;
  approved_at: string | null;
  created_at: string;
};

export type Gathering = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  zoom_url: string;
  /** Shown again one week later after it ends, until deleted or replaced. */
  repeats_weekly: boolean;
  /** Bangkok dates (YYYY-MM-DD) a repeating gathering does not take place. */
  skipped_dates: string[];
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------- repeating gatherings */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const GRACE_MS = GATHERING_GRACE_MINUTES * 60_000;

/** A moment's date in Bangkok, as YYYY-MM-DD. */
export function bangkokDate(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(iso));
}

export type Occurrence = { gathering: Gathering; start: string; skipped: boolean };

/**
 * When a repeating gathering stops: at the start of the first gathering added
 * after it, and starting after it began ("unless I add a different one").
 * Null while it carries on.
 */
function seriesEnd(g: Gathering, all: Gathering[]): number | null {
  const later = all
    .filter((o) => o.id !== g.id && o.created_at > g.created_at && o.starts_at > g.starts_at)
    .map((o) => new Date(o.starts_at).getTime());
  return later.length ? Math.min(...later) : null;
}

/**
 * A gathering's coming dates, from the one now on or next (one that started
 * less than 90 minutes ago still counts) — only one for a one-off. Bangkok
 * has no summer time, so "the same Bangkok time a week later" is exactly
 * seven days on.
 */
export function upcomingOccurrences(g: Gathering, all: Gathering[], now: number, count: number): Occurrence[] {
  const first = new Date(g.starts_at).getTime();
  const end = g.repeats_weekly ? seriesEnd(g, all) : null;
  const out: Occurrence[] = [];
  let k = g.repeats_weekly && now - GRACE_MS > first ? Math.ceil((now - GRACE_MS - first) / WEEK_MS) : 0;
  for (; out.length < count; k++) {
    const t = first + k * WEEK_MS;
    if (!g.repeats_weekly && k > 0) break;
    if (end !== null && t >= end) break;
    if (t + GRACE_MS <= now) continue;
    const start = new Date(t).toISOString();
    out.push({ gathering: g, start, skipped: g.repeats_weekly && g.skipped_dates.includes(bangkokDate(start)) });
  }
  return out;
}

/**
 * The next gathering that takes place, across all of them, and any skipped
 * weeks before it (so the page can say "no gathering on 15 November").
 */
export function nextOccurrence(all: Gathering[], now: number): { next: Occurrence | null; skippedBefore: Occurrence[] } {
  const coming = all
    .flatMap((g) => upcomingOccurrences(g, all, now, 8))
    .sort((a, b) => a.start.localeCompare(b.start));
  const i = coming.findIndex((o) => !o.skipped);
  return i === -1 ? { next: null, skippedBefore: coming } : { next: coming[i], skippedBefore: coming.slice(0, i) };
}

/** Whether a start time is a real, not-skipped date of this gathering (for the calendar file). */
export function isOccurrenceOf(g: Gathering, all: Gathering[], start: string, now: number): boolean {
  return upcomingOccurrences(g, all, now, 60).some((o) => o.start === start && !o.skipped);
}

/** "Sarah" or "Anonymous", as the wall shows it. */
export function prayerName(p: Pick<PrayerRequest, "show_name" | "display_name">): string {
  return p.show_name && p.display_name ? p.display_name : "Anonymous";
}

/** A date as the wall shows it, e.g. "25 October 2026". */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
}
