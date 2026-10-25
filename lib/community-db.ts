import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/auth";
import { getMemberByEmail, isActive } from "@/lib/members";
import {
  COMMUNITY_HOME,
  COMMUNITY_SIGN_IN,
  nextOccurrence,
  type Announcement,
  type AnsweredPrayer,
  type CommunityProfile,
  type CommunityQuestion,
  type Gathering,
  type PrayerAnswer,
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
  /** Removed from the community by Richmond: nothing of the community is open to them. */
  removed: boolean;
  /** Joined before the Community Guidelines and has not agreed to them yet. */
  needsAgreement: boolean;
  /** May read the wall and the gathering: joined, a paying member, or the admin (and not removed). */
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

  const [profileResult, member, removedResult] = await Promise.all([
    supabase.from("community_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    getMemberByEmail(email).catch((err) => {
      console.error("Community: could not check membership:", err instanceof Error ? err.message : err);
      return null;
    }),
    supabase.rpc("community_is_removed"),
  ]);
  if (profileResult.error && !isMissingCommunityTable(profileResult.error)) {
    throw new Error(`Could not load your community profile: ${profileResult.error.message}`);
  }

  const profile = (profileResult.data as CommunityProfile | null) ?? null;
  const paidMember = isActive(member);
  const isAdmin = email === ADMIN_EMAIL;
  const removed = !isAdmin && removedResult.data === true;
  return {
    supabase,
    user,
    email,
    profile,
    paidMember,
    isAdmin,
    removed,
    needsAgreement: Boolean(profile) && !profile?.guidelines_agreed_at && !isAdmin,
    inCommunity: !removed && (Boolean(profile) || paidMember || isAdmin),
  };
}

/**
 * For the Prayer Wall and the Gathering. Signed out goes to the community
 * sign-in; signed in but not yet joined goes to the community home, which
 * asks for a first name and country.
 */
export async function requireCommunity(): Promise<CommunityViewer> {
  const viewer = await getCommunityViewer();
  if (!viewer) redirect(COMMUNITY_SIGN_IN);
  // Not joined, removed, or yet to agree to the guidelines: the community
  // home says which and what to do.
  if (!viewer.inCommunity || viewer.needsAgreement) redirect(COMMUNITY_HOME);
  return viewer;
}

/* ------------------------------------------------------------- prayer wall */

export type WallData = {
  approved: PrayerRequest[];
  mine: PrayerRequest[];
  prayed: Set<string>;
  reported: Set<string>;
  /** Answers this person may see: approved ones, and their own however they stand. */
  answers: Map<string, PrayerAnswer>;
  postedToday: number;
};

function startOfBangkokDay(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  return new Date(`${ymd}T00:00:00+07:00`);
}

export async function loadWall(viewer: CommunityViewer): Promise<WallData> {
  const db = viewer.supabase;
  const [approved, mine, prayed, reported, answers] = await Promise.all([
    db.from("prayer_requests").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(100),
    db.from("prayer_requests").select("*").eq("user_id", viewer.user.id).neq("status", "approved").order("created_at", { ascending: false }),
    db.from("prayer_prayed").select("request_id").eq("user_id", viewer.user.id),
    db.from("prayer_reports").select("request_id").eq("user_id", viewer.user.id),
    // RLS returns only what this person may see.
    db.from("prayer_answers").select("*").limit(500),
  ]);
  for (const r of [approved, mine, prayed, reported, answers]) {
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
    answers: new Map(((answers.data ?? []) as PrayerAnswer[]).map((a) => [a.request_id, a])),
    postedToday,
  };
}

/* -------------------------------------------------------- answered prayers */

/**
 * Answered prayers shared on the Answered Prayers page, newest answer first:
 * approved, shared, and still on the wall (RLS leaves out the rest).
 */
export async function loadAnswered(viewer: CommunityViewer, limit = 100): Promise<AnsweredPrayer[]> {
  const { data, error } = await viewer.supabase
    .from("prayer_answers")
    .select("*, request:prayer_requests(*)")
    .eq("status", "approved")
    .eq("share", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Answered prayers not loaded:", error.message);
    return [];
  }
  return ((data ?? []) as AnsweredPrayer[]).filter((a) => a.request?.status === "approved" && a.request.answered_at);
}

/* ------------------------------------------------------ ask pastor richmond */

/** Published questions, newest answer first, and this member's own that are not published. */
export async function loadQuestions(viewer: CommunityViewer): Promise<{
  published: CommunityQuestion[];
  mine: CommunityQuestion[];
  reported: Set<string>;
  askedThisWeek: number;
}> {
  const db = viewer.supabase;
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [published, mine, reported] = await Promise.all([
    db.from("community_questions").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(300),
    db.from("community_questions").select("*").eq("user_id", viewer.user.id).order("created_at", { ascending: false }),
    db.from("community_question_reports").select("question_id").eq("user_id", viewer.user.id),
  ]);
  for (const r of [published, mine, reported]) {
    if (r.error) throw new Error(`Could not load the questions: ${r.error.message}`);
  }
  const own = (mine.data ?? []) as CommunityQuestion[];
  return {
    published: (published.data ?? []) as CommunityQuestion[],
    mine: own.filter((q) => q.status !== "published"),
    reported: new Set((reported.data ?? []).map((r) => r.question_id as string)),
    askedThisWeek: own.filter((q) => q.created_at >= weekAgo).length,
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

/** Every gathering. A handful at most: the repeats are worked out, not stored. */
export async function listGatherings(db: SupabaseClient): Promise<Gathering[]> {
  const { data, error } = await db.from("community_gatherings").select("*").order("starts_at", { ascending: true });
  if (error) throw new Error(`Could not load the gathering: ${error.message}`);
  return (data ?? []) as Gathering[];
}

/** The next gathering that takes place (one that started in the last 90 minutes counts). */
export async function nextGathering(db: SupabaseClient) {
  return nextOccurrence(await listGatherings(db), Date.now());
}
