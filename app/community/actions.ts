"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/stripe";
import { maySendSignInCode } from "@/lib/sign-in-gate";
import { checkFormStamp } from "@/lib/form-stamp";
import { getCommunityViewer } from "@/lib/community-db";
import { notifyNewMember, notifyPrayerForReview } from "@/lib/community-email";
import { syncCommunityMember } from "@/lib/community-sync";
import { removeFromCommunityGroup } from "@/lib/mailerlite-community";
import { sendWelcomeEmail } from "@/lib/community-welcome";
import {
  ANSWER_MAX,
  COMMUNITY_HOME,
  COUNTRY_MAX,
  FULL_NAME_MAX,
  JOINED_COOKIE,
  JOIN_MESSAGE_LABEL,
  JOIN_MESSAGE_MAX,
  PHONE_MAX,
  PRAYER_MAX,
  firstNameOf,
  prayerName,
} from "@/lib/community";

/* ----------------------------------------------------------------- details */

/** What someone gives on joining. Phone is optional; the message is required. */
export type JoinDetails = { fullName: string; country: string; phone: string; message: string };

const cleanName = (v: FormDataEntryValue | null) => String(v ?? "").trim().replace(/\s+/g, " ");

function readDetails(formData: FormData): JoinDetails {
  return {
    fullName: cleanName(formData.get("full_name")),
    country: cleanName(formData.get("country")),
    phone: cleanName(formData.get("phone")),
    message: String(formData.get("join_message") ?? "").replace(/\r\n/g, "\n").trim(),
  };
}

/** The first thing wrong with the details, or null. `withJoining` adds the phone and message. */
function detailsProblem(d: JoinDetails, withJoining: boolean): string | null {
  if (!d.fullName) return "Enter your full name.";
  if (d.fullName.length > FULL_NAME_MAX) return `Keep your name under ${FULL_NAME_MAX} characters.`;
  if (d.country.length < 2) return "Enter the country you live in.";
  if (d.country.length > COUNTRY_MAX) return `Keep the country under ${COUNTRY_MAX} characters.`;
  if (d.phone && (d.phone.length > PHONE_MAX || !/^\+?[\d\s().-]{5,}$/.test(d.phone))) {
    return "That phone number does not look right. Use only numbers, spaces and + ( ) -, or leave it empty.";
  }
  if (withJoining) {
    if (d.message.length < 2) return `Please fill in “${JOIN_MESSAGE_LABEL}”.`;
    if (d.message.length > JOIN_MESSAGE_MAX) return `Please keep your message under ${JOIN_MESSAGE_MAX} characters.`;
  }
  return null;
}

/**
 * Saves a new profile through the person's own session, then, once the
 * response has gone, adds them to MailerLite (name and country only) and
 * emails Richmond their details and message. Returns false if it was not
 * saved; an existing profile (23505) is left as it is.
 */
async function createProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  email: string,
  d: JoinDetails
): Promise<boolean> {
  const { error } = await supabase.from("community_profiles").insert({
    user_id: userId,
    email,
    full_name: d.fullName,
    first_name: firstNameOf(d.fullName),
    country: d.country,
    phone: d.phone || null,
    join_message: d.message,
  });
  if (error) {
    if (error.code !== "23505") console.error("Community profile not saved:", error.message);
    return error.code === "23505";
  }
  // Only here, where a new profile has just been saved, so the welcome email
  // goes once and never on a later sign-in.
  after(async () => {
    await Promise.allSettled([
      syncCommunityMember({ userId, email, fullName: d.fullName, country: d.country }),
      notifyNewMember({ fullName: d.fullName, email, country: d.country, phone: d.phone || null, message: d.message }),
      sendWelcomeEmail({ userId, email, fullName: d.fullName }),
    ]);
  });
  revalidatePath("/admin/community");
  return true;
}

/* ----------------------------------------------------------------- sign in */

export type CommunityCodeSendState = {
  error: string | null;
  sent: string | null;
  /** As typed, so the form can show it again after an error. */
  email: string;
  details: JoinDetails;
};
export type CommunityCodeState = { error: string | null };

/**
 * Sends the same 6-digit sign-in code as the membership sign-in, for the
 * community. Two forms use it:
 *
 *   * "join" (/community/join): full name, email, country, an optional phone
 *     and a required message. Open to anyone, which the membership sign-in is
 *     not, so it is guarded by a hidden field robots fill and a signed stamp
 *     that shows the form was opened by a browser a few seconds earlier
 *     (lib/form-stamp.ts).
 *   * "sign-in" (/community/sign-in): email only, for someone who has already
 *     joined. A code goes only to an address with a community profile, or one
 *     the membership sign-in would send to anyway.
 *
 * Either way the reply is the same "check your email", so neither form says
 * who has joined or paid. Nothing about how the membership sign-in sends its
 * codes is changed.
 */
export async function sendCommunityCode(
  _prev: CommunityCodeSendState,
  formData: FormData
): Promise<CommunityCodeSendState> {
  const mode = formData.get("mode") === "sign-in" ? "sign-in" : "join";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const details = readDetails(formData);

  if (mode === "join") {
    const problem = detailsProblem(details, true);
    if (problem) return { error: problem, sent: null, email, details };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter your email address.", sent: null, email, details };
  }

  const looksFine = { error: null, sent: email, email, details };
  if (String(formData.get("website") ?? "") !== "") return looksFine;
  if (!checkFormStamp(String(formData.get("stamp") ?? ""))) return looksFine;

  if (mode === "sign-in") {
    let allowed = true;
    try {
      const { count, error } = await supabaseAdmin
        .from("community_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("email", email);
      if (error) throw new Error(error.message);
      allowed = Boolean(count) || (await maySendSignInCode(email));
    } catch (err) {
      // As on the membership sign-in: a real person locked out is worse than
      // one robot getting through.
      console.error("Community sign-in check failed; sending the code:", err instanceof Error ? err.message : err);
    }
    if (!allowed) return looksFine;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(COMMUNITY_HOME)}`,
      shouldCreateUser: true,
      // Kept on a brand-new account only, so the community home can fill in
      // the name if the emailed link is used instead of the code.
      ...(mode === "join" ? { data: { full_name: details.fullName, country: details.country } } : {}),
    },
  });
  if (error) {
    if (error.status === 429 || /rate limit|only request this after|seconds/i.test(error.message)) return looksFine;
    console.error("Community sign-in code failed:", error.message);
    return { error: "Could not send the code just now. Please try again in a moment.", sent: null, email, details };
  }
  return looksFine;
}

/** Exchanges the code for a session and, on joining, saves the profile. */
export async function verifyCommunityCode(
  _prev: CommunityCodeState,
  formData: FormData
): Promise<CommunityCodeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\D/g, "");
  const details = readDetails(formData);

  if (!email.includes("@")) return { error: "Start again below and we will send a fresh code." };
  if (token.length !== 6) return { error: "Enter the 6-digit code from your email." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.user) {
    console.error("Community code sign-in failed:", error?.message);
    return { error: "That code did not work. It may have expired or been used already — ask for a new one." };
  }

  // From the join form only (the sign-in form sends no details). If this
  // fails, the community home asks for the details again.
  if (!detailsProblem(details, true)) await createProfile(supabase, data.user.id, email, details);

  redirect(COMMUNITY_HOME);
}

export async function communitySignOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/community");
}

/* ----------------------------------------------------------------- profile */

export type ProfileState = { error: string | null; saved: boolean };

/**
 * Joining from the community home (someone who used the emailed link, or a
 * paying member adding their details), or changing name, country or phone
 * later. The joining message is asked for only the first time.
 */
export async function saveCommunityProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const viewer = await getCommunityViewer();
  if (!viewer) redirect("/community/sign-in");

  const d = readDetails(formData);
  const problem = detailsProblem(d, !viewer.profile);
  if (problem) return { error: problem, saved: false };

  if (!viewer.profile) {
    const ok = await createProfile(viewer.supabase, viewer.user.id, viewer.email, d);
    if (!ok) return { error: "That could not be saved just now. Please try again.", saved: false };
    revalidatePath(COMMUNITY_HOME);
    return { error: null, saved: true };
  }

  const { error } = await viewer.supabase
    .from("community_profiles")
    .update({ full_name: d.fullName, first_name: firstNameOf(d.fullName), country: d.country, phone: d.phone || null })
    .eq("user_id", viewer.user.id);
  if (error) {
    console.error("Community profile save failed:", error.message);
    return { error: "That could not be saved just now. Please try again.", saved: false };
  }
  // A changed name or country: MailerLite is brought up to date.
  const { id: userId } = viewer.user;
  const { email } = viewer;
  after(() => syncCommunityMember({ userId, email, fullName: d.fullName, country: d.country }).then(() => undefined));
  revalidatePath(COMMUNITY_HOME);
  revalidatePath("/admin/community");
  return { error: null, saved: true };
}

/** Removes the profile, prayer requests, taps and reports. Not the sign-in, and never a membership. */
export async function leaveCommunity(formData: FormData) {
  const viewer = await getCommunityViewer();
  if (!viewer) redirect("/community/sign-in");
  if (formData.get("confirm") !== "yes") redirect(`${COMMUNITY_HOME}?leave=confirm`);
  const { error } = await viewer.supabase.rpc("community_leave");
  if (error) {
    console.error("Leaving the community failed:", error.message);
    redirect(`${COMMUNITY_HOME}?leave=failed`);
  }
  // Out of the community's MailerLite group too (the newsletter, if they get
  // it, is left alone). A failure is logged; Richmond can remove them there.
  const { email } = viewer;
  after(() =>
    removeFromCommunityGroup(email).then((e) => {
      if (e) console.error(`MailerLite: could not remove a member who left the community: ${e}`);
    })
  );
  // The footer may invite them again.
  (await cookies()).delete(JOINED_COOKIE);
  revalidatePath("/community/prayer");
  redirect("/community?left=1");
}

/* ------------------------------------------------------------- prayer wall */

export type PrayerPostState = { error: string | null; posted: boolean };

/**
 * A new prayer request. The database makes it pending, copies the first name
 * in if asked, and refuses a banned member or a fourth request in a day; the
 * checks here only give a clearer message first.
 */
export async function postPrayerRequest(_prev: PrayerPostState, formData: FormData): Promise<PrayerPostState> {
  const viewer = await getCommunityViewer();
  if (!viewer) redirect("/community/sign-in");
  if (!viewer.profile) return { error: "Add your name and country on the community home before posting.", posted: false };
  if (viewer.profile.is_banned) return { error: "Posting is closed on this account.", posted: false };

  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const showName = formData.get("show_name") === "name";
  if (body.length < 3) return { error: "Write your prayer request first.", posted: false };
  if (body.length > PRAYER_MAX) return { error: `Please keep it under ${PRAYER_MAX.toLocaleString("en-GB")} characters.`, posted: false };

  const { error } = await viewer.supabase
    .from("prayer_requests")
    .insert({ user_id: viewer.user.id, body, show_name: showName });
  if (error) {
    if (error.code === "P0001") return { error: error.message, posted: false };
    console.error("Prayer request not saved:", error.message);
    return { error: "That could not be shared just now. Please try again.", posted: false };
  }

  const shownAs = prayerName({ show_name: showName, display_name: viewer.profile.first_name });
  after(() => notifyPrayerForReview({ kind: "new", body, shownAs, fromEmail: viewer.email }).then(() => undefined));

  revalidatePath("/community/prayer");
  revalidatePath("/admin/community");
  return { error: null, posted: true };
}

export async function prayForRequest(formData: FormData) {
  const viewer = await getCommunityViewer();
  if (!viewer?.inCommunity) redirect("/community/sign-in");
  const id = String(formData.get("id") ?? "");
  const { error } = await viewer.supabase.from("prayer_prayed").insert({ request_id: id, user_id: viewer.user.id });
  // 23505: already prayed for it — one per member, and nothing to say.
  if (error && error.code !== "23505") console.error("I prayed not saved:", error.message);
  revalidatePath("/community/prayer");
}

export async function reportPrayerRequest(formData: FormData) {
  const viewer = await getCommunityViewer();
  if (!viewer?.inCommunity) redirect("/community/sign-in");
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "yes") redirect(`/community/prayer?report=${encodeURIComponent(id)}#p-${id}`);

  const { data: request } = await viewer.supabase.from("prayer_requests").select("body, show_name, display_name").eq("id", id).maybeSingle();
  const { error } = await viewer.supabase.from("prayer_reports").insert({ request_id: id, user_id: viewer.user.id });
  if (error && error.code !== "23505") {
    console.error("Prayer report not saved:", error.message);
    redirect("/community/prayer?reported=failed");
  }
  if (!error && request) {
    after(() =>
      notifyPrayerForReview({ kind: "reported", body: request.body, shownAs: prayerName(request), fromEmail: viewer.email }).then(() => undefined)
    );
  }
  revalidatePath("/community/prayer");
  revalidatePath("/admin/community");
  redirect("/community/prayer?reported=1");
}

export async function markPrayerAnswered(formData: FormData) {
  const viewer = await getCommunityViewer();
  if (!viewer) redirect("/community/sign-in");
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("answer_note") ?? "").trim().slice(0, ANSWER_MAX);
  const { error } = await viewer.supabase
    .from("prayer_requests")
    .update({ answered_at: new Date().toISOString(), answer_note: note || null })
    .eq("id", id)
    .eq("user_id", viewer.user.id);
  if (error) console.error("Answered not saved:", error.message);
  revalidatePath("/community/prayer");
  redirect(`/community/prayer#p-${id}`);
}

export async function deleteOwnPrayerRequest(formData: FormData) {
  const viewer = await getCommunityViewer();
  if (!viewer) redirect("/community/sign-in");
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "yes") redirect(`/community/prayer?remove=${encodeURIComponent(id)}#p-${id}`);
  const { error } = await viewer.supabase.from("prayer_requests").delete().eq("id", id).eq("user_id", viewer.user.id);
  if (error) console.error("Own prayer request not deleted:", error.message);
  revalidatePath("/community/prayer");
  revalidatePath("/admin/community");
  redirect("/community/prayer");
}
