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

/** A gathering is shown as "next" until this long after it starts. */
export const GATHERING_GRACE_MINUTES = 90;
/** Used for the calendar file; the admin form has no end time. */
export const GATHERING_MINUTES = 60;

export const COMMUNITY_HOME = "/community/home";
export const COMMUNITY_JOIN = "/community/join";
export const COMMUNITY_SIGN_IN = "/community/sign-in";

export type CommunityProfile = {
  user_id: string;
  email: string;
  full_name: string;
  first_name: string;
  country: string;
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
  created_at: string;
  updated_at: string;
};

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
