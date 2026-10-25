import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/auth";
import { getMemberByEmail, isActive } from "@/lib/members";
import {
  COMMUNITY_HOME,
  COMMUNITY_SIGN_IN,
  GATHERING_GRACE_MINUTES,
  type Announcement,
  type CommunityProfile,
  type Gathering,
  type PrayerRequest,
} from "@/lib/community";

/**
 * Community reads and writes go through the person's own signed-in session,
 * never the service role, so the tables' RLS policies decide what each person
 * may see and change (supabase/migrations/20261026120000_community.sql).
 *
 * The one thing read from the paid side is whether the person has a live
 * membership, so a member is a community member without joining. It is only
 * read; nothing here writes to members.
 */

export type CommunityViewer = {
  supabase: SupabaseClient;
  user: User;
  email: string;
  profile: CommunityProfile | null;
  paidMember: boolean;
  isAdmin: boolean;
  /** May read the wall and the gathering: joined, a paying member, or the admin. */
  inCommunity: boolean;
};

/** True when the migration has not been run yet. */
export function isMissingCommunityTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /(community_|prayer_)\w+/.test(error.message ?? "") && /does not exist|could not find/i.test(error.message ?? "")
  );
}

/** The signed-in person and where they stand in the community, or null if signed out. */
export async function getCommunityViewer(): Promise<CommunityViewer | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const email = user.email.toLowerCase();

  const [profileResult, member] = await Promise.all([
    supabase.from("community_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    getMemberByEmail(email).catch((err) => {
      console.error("Community: could not check membership:", err instanceof Error ? err.message : err);
      return null;
    }),
  ]);
  if (profileResult.error && !isMissingCommunityTable(profileResult.error)) {
    throw new Error(`Could not load your community profile: ${profileResult.error.message}`);
  }

  const profile = (profileResult.data as CommunityProfile | null) ?? null;
  const paidMember = isActive(member);
  const isAdmin = email === ADMIN_EMAIL;
  return { supabase, user, email, profile, paidMember, isAdmin, inCommunity: Boolean(profile) || paidMember || isAdmin };
}

/**
 * For the Prayer Wall and the Gathering. Signed out goes to the community
 * sign-in; signed in but not yet joined goes to the community home, which
 * asks for a first name and country.
 */
export async function requireCommunity(): Promise<CommunityViewer> {
  const viewer = await getCommunityViewer();
  if (!viewer) redirect(COMMUNITY_SIGN_IN);
  if (!viewer.inCommunity) redirect(COMMUNITY_HOME);
  return viewer;
}

/* ------------------------------------------------------------- prayer wall */

export type WallData = {
  approved: PrayerRequest[];
  mine: PrayerRequest[];
  prayed: Set<string>;
  reported: Set<string>;
  postedToday: number;
};

function startOfBangkokDay(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  return new Date(`${ymd}T00:00:00+07:00`);
}

export async function loadWall(viewer: CommunityViewer): Promise<WallData> {
  const db = viewer.supabase;
  const [approved, mine, prayed, reported] = await Promise.all([
    db.from("prayer_requests").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(100),
    db.from("prayer_requests").select("*").eq("user_id", viewer.user.id).neq("status", "approved").order("created_at", { ascending: false }),
    db.from("prayer_prayed").select("request_id").eq("user_id", viewer.user.id),
    db.from("prayer_reports").select("request_id").eq("user_id", viewer.user.id),
  ]);
  for (const r of [approved, mine, prayed, reported]) {
    if (r.error) throw new Error(`Could not load the Prayer Wall: ${r.error.message}`);
  }
  const mineRows = (mine.data ?? []) as PrayerRequest[];
  const approvedRows = (approved.data ?? []) as PrayerRequest[];
  const dayStart = startOfBangkokDay().getTime();
  const postedToday = [...mineRows, ...approvedRows.filter((p) => p.user_id === viewer.user.id)].filter(
    (p) => new Date(p.created_at).getTime() >= dayStart
  ).length;
  return {
    approved: approvedRows,
    mine: mineRows,
    prayed: new Set((prayed.data ?? []).map((r) => r.request_id as string)),
    reported: new Set((reported.data ?? []).map((r) => r.request_id as string)),
    postedToday,
  };
}

/* ----------------------------------------------------------- announcements */

/**
 * Announcements, pinned first then newest first, and when this person last
 * looked (null the first time), for the "New" badge. Looking now counts as
 * seeing them, so the time is moved on after it is read.
 */
export async function loadAnnouncements(
  viewer: CommunityViewer
): Promise<{ announcements: Announcement[]; seenBefore: Date | null }> {
  const db = viewer.supabase;
  const [list, seen] = await Promise.all([
    db
      .from("community_announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
    db.from("community_seen").select("announcements_seen_at").eq("user_id", viewer.user.id).maybeSingle(),
  ]);
  if (list.error) {
    console.error("Announcements not loaded:", list.error.message);
    return { announcements: [], seenBefore: null };
  }
  const { error } = await db
    .from("community_seen")
    .upsert({ user_id: viewer.user.id, announcements_seen_at: new Date().toISOString() });
  if (error) console.error("Announcements seen time not saved:", error.message);
  const at = seen.data?.announcements_seen_at as string | undefined;
  return { announcements: (list.data ?? []) as Announcement[], seenBefore: at ? new Date(at) : null };
}

/* --------------------------------------------------------------- gathering */

/** The next gathering, including one that started in the last 90 minutes. */
export async function nextGathering(db: SupabaseClient): Promise<Gathering | null> {
  const since = new Date(Date.now() - GATHERING_GRACE_MINUTES * 60_000).toISOString();
  const { data, error } = await db
    .from("community_gatherings")
    .select("*")
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not load the gathering: ${error.message}`);
  return (data as Gathering | null) ?? null;
}
