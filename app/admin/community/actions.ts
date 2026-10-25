"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syncCommunityMember } from "@/lib/community-sync";
import { sendWelcomeEmail } from "@/lib/community-welcome";
import { emailCommunityGroup, removeFromCommunityGroup } from "@/lib/mailerlite-community";
import { emailQuestionAnswered, emailQuestionDeclined } from "@/lib/community-email";
import { announcementEmailHtml } from "@/lib/announcement-email";
import type { Announcement, CommunityProfile } from "@/lib/community";

/**
 * The admin's community actions. Each checks requireAdmin() (a server action
 * can be posted to directly) and then goes through the admin's own session,
 * so the tables' admin policies authorise the change as well.
 */

const BACK = "/admin/community";

async function db() {
  await requireAdmin();
  return createSupabaseServerClient();
}

function done(note: string, anchor = ""): never {
  revalidatePath(BACK);
  revalidatePath("/community/prayer");
  revalidatePath("/community/gathering");
  revalidatePath("/community/home");
  revalidatePath("/community/questions");
  redirect(`${BACK}?done=${encodeURIComponent(note)}${anchor}`);
}

function failed(what: string, message: string): never {
  console.error(`Admin community: ${what} failed:`, message);
  redirect(`${BACK}?error=${encodeURIComponent(`${what} did not work: ${message}`)}`);
}

/* ------------------------------------------------------------ prayer wall */

export async function approvePrayer(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("prayer_requests")
    .update({ status: "approved", approved_at: new Date().toISOString(), reported_at: null })
    .eq("id", id);
  if (error) failed("Approving", error.message);
  done("Approved. It is on the Prayer Wall.", "#review");
}

export async function rejectPrayer(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("prayer_requests").update({ status: "rejected", reported_at: null }).eq("id", id);
  if (error) failed("Rejecting", error.message);
  done("Rejected. It is not shown on the wall.", "#review");
}

export async function deletePrayer(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "yes") redirect(`${BACK}?delete=${encodeURIComponent(id)}#r-${id}`);
  const { error } = await supabase.from("prayer_requests").delete().eq("id", id);
  if (error) failed("Deleting", error.message);
  done("Deleted.");
}

/** A praise update or an answered prayer: approve it, hide it from the page, or show it again. */
export async function setAnswerStatus(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["approved", "hidden"].includes(status)) failed("Changing the answered prayer", "that is not a choice");
  const { error } = await supabase
    .from("prayer_answers")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("request_id", id);
  if (error) failed("Changing the answered prayer", error.message);
  revalidatePath("/community/answered");
  done(status === "approved" ? "Approved. It is on the Answered Prayers page." : "Hidden from the Answered Prayers page.", "#answered");
}

/** Banning stops posting and reporting. The person can still read and pray. */
export async function setBanned(formData: FormData) {
  const supabase = await db();
  const userId = String(formData.get("user_id") ?? "");
  const banned = formData.get("banned") === "yes";
  const { error } = await supabase.from("community_profiles").update({ is_banned: banned }).eq("user_id", userId);
  if (error) failed(banned ? "Banning" : "Unbanning", error.message);
  done(banned ? "Banned from posting." : "Posting allowed again.", "#people");
}

/* --------------------------------------------------------------- gathering */

/** "2026-11-02T19:00", typed as Bangkok time, as a moment in time. */
function bangkokToIso(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const d = new Date(`${local}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function saveGathering(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").replace(/\r\n/g, "\n").trim();
  const startsAt = bangkokToIso(String(formData.get("starts_at") ?? ""));
  const zoomUrl = String(formData.get("zoom_url") ?? "").trim();

  if (!title) failed("Saving the gathering", "it needs a title");
  if (!startsAt) failed("Saving the gathering", "it needs a date and time");
  if (!/^https:\/\/\S+$/.test(zoomUrl)) failed("Saving the gathering", "the Zoom link must start with https://");

  const repeats = formData.get("repeats_weekly") === "on";
  const fields = { title, description: description || null, starts_at: startsAt, zoom_url: zoomUrl, repeats_weekly: repeats };
  const { error } = id
    ? await supabase.from("community_gatherings").update(fields).eq("id", id)
    : await supabase.from("community_gatherings").insert(fields);
  if (error) failed("Saving the gathering", error.message);
  done("Gathering saved.", "#gatherings");
}

/** "Skip one week", or undo it: one Bangkok date, the series carries on. */
export async function toggleSkipWeek(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) failed("Skipping a week", "that date is not valid");
  const { data, error } = await supabase.from("community_gatherings").select("skipped_dates").eq("id", id).single();
  if (error) failed("Skipping a week", error.message);
  const current = (data.skipped_dates ?? []) as string[];
  const skipping = !current.includes(date);
  const next = skipping ? [...current, date].sort() : current.filter((d) => d !== date);
  const { error: saveError } = await supabase.from("community_gatherings").update({ skipped_dates: next }).eq("id", id);
  if (saveError) failed("Skipping a week", saveError.message);
  done(skipping ? "That week is skipped. The series carries on the week after." : "That week is back on.", `#g-${id}`);
}

export async function deleteGathering(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "yes") redirect(`${BACK}?deleteGathering=${encodeURIComponent(id)}#g-${id}`);
  const { error } = await supabase.from("community_gatherings").delete().eq("id", id);
  if (error) failed("Deleting the gathering", error.message);
  done("Gathering deleted.", "#gatherings");
}

/* ------------------------------------------------------------- MailerLite */

/** Tries again to add one member, or everyone whose last try failed, to the MailerLite group. */
export async function retryMailerLite(formData: FormData) {
  const supabase = await db();
  const userId = String(formData.get("user_id") ?? "");
  let query = supabase.from("community_profiles").select("*");
  query = userId ? query.eq("user_id", userId) : query.is("mailerlite_synced_at", null);
  const { data, error } = await query.limit(100);
  if (error) failed("Retrying MailerLite", error.message);
  const people = (data ?? []) as CommunityProfile[];
  let failures = 0;
  for (const p of people) {
    const e = await syncCommunityMember({ userId: p.user_id, email: p.email, fullName: p.full_name, country: p.country });
    if (e) failures++;
  }
  if (failures) failed("Adding to MailerLite", `${failures} of ${people.length} still failed; the reason is shown next to each`);
  done(people.length === 1 ? "Added to MailerLite." : `${people.length} added to MailerLite.`, "#mailerlite");
}

/** Sends (or sends again) one member's welcome email. */
export async function resendWelcome(formData: FormData) {
  const supabase = await db();
  const userId = String(formData.get("user_id") ?? "");
  const { data, error } = await supabase.from("community_profiles").select("email, full_name").eq("user_id", userId).single();
  if (error) failed("Sending the welcome email", error.message);
  const e = await sendWelcomeEmail({ userId, email: data.email, fullName: data.full_name });
  if (e) failed("Sending the welcome email", e);
  done(`Welcome email sent to ${data.email}.`, `#m-${userId}`);
}

/* ----------------------------------------------------------- announcements */

async function sendAnnouncementEmail(supabase: Awaited<ReturnType<typeof db>>, a: Announcement): Promise<string | null> {
  const e = await emailCommunityGroup({ subject: a.title, html: announcementEmailHtml(a) });
  const { error } = await supabase
    .from("community_announcements")
    .update(e ? { email_error: e } : { emailed_at: new Date().toISOString(), email_error: null })
    .eq("id", a.id);
  if (error) console.error("Announcement email status not saved:", error.message);
  return e;
}

export async function saveAnnouncement(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const linkLabel = String(formData.get("link_label") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const pinned = formData.get("pinned") === "on";
  const email = formData.get("email") === "on";

  if (!title) failed("Saving the announcement", "it needs a title");
  if (!body) failed("Saving the announcement", "it needs a message");
  if (linkUrl && !/^(https:\/\/\S+|\/\S*)$/.test(linkUrl)) {
    failed("Saving the announcement", "the button link must start with https:// or with / for a page on this site");
  }
  if (linkLabel && !linkUrl) failed("Saving the announcement", "the button has text but no link");

  const fields = { title, body, link_label: linkLabel || null, link_url: linkUrl || null, pinned };
  const { data, error } = id
    ? await supabase.from("community_announcements").update(fields).eq("id", id).select("*").single()
    : await supabase.from("community_announcements").insert(fields).select("*").single();
  if (error) failed("Saving the announcement", error.message);
  const saved = data as Announcement;

  if (email && !saved.emailed_at) {
    const e = await sendAnnouncementEmail(supabase, saved);
    if (e) failed("Emailing the announcement", `it is saved and on the community home, but the email was not sent: ${e}`);
    done("Announcement saved, and emailed to the community through MailerLite.", "#announcements");
  }
  done("Announcement saved.", "#announcements");
}

export async function retryAnnouncementEmail(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const { data, error } = await supabase.from("community_announcements").select("*").eq("id", id).single();
  if (error) failed("Emailing the announcement", error.message);
  const a = data as Announcement;
  if (a.emailed_at) done("That announcement was already emailed.", "#announcements");
  const e = await sendAnnouncementEmail(supabase, a);
  if (e) failed("Emailing the announcement", e);
  done("Announcement emailed to the community.", "#announcements");
}

export async function deleteAnnouncement(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "yes") redirect(`${BACK}?deleteAnnouncement=${encodeURIComponent(id)}#a-${id}`);
  const { error } = await supabase.from("community_announcements").delete().eq("id", id);
  if (error) failed("Deleting the announcement", error.message);
  done("Announcement deleted.", "#announcements");
}

/* ------------------------------------------------------ ask pastor richmond */

/** Publishes (or re-publishes) a question with Richmond's answer, and emails the member the first time. */
export async function publishAnswer(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const answer = String(formData.get("answer") ?? "").replace(/\r\n/g, "\n").trim();
  if (answer.length < 2) failed("Publishing the answer", "write the answer first");
  const { data: before, error: readError } = await supabase.from("community_questions").select("user_id, body, published_at").eq("id", id).single();
  if (readError) failed("Publishing the answer", readError.message);
  const { error } = await supabase
    .from("community_questions")
    .update({ status: "published", answer, published_at: before.published_at ?? new Date().toISOString(), reported_at: null })
    .eq("id", id);
  if (error) failed("Publishing the answer", error.message);

  let note = "Answer published.";
  if (!before.published_at) {
    const { data: who } = await supabase.from("community_profiles").select("email, first_name").eq("user_id", before.user_id).maybeSingle();
    if (who) {
      const e = await emailQuestionAnswered({ email: who.email, firstName: who.first_name, questionId: id, body: before.body });
      note = e ? `Answer published, but the email to the member did not go: ${e}` : `Answer published, and ${who.email} has been emailed.`;
    }
  }
  revalidatePath("/community/questions");
  done(note, "#questions");
}

/** Declines a question: never shown. An optional private note is emailed to the member. */
export async function declineQuestion(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("decline_note") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 2000);
  const { data: q, error: readError } = await supabase.from("community_questions").select("user_id, body").eq("id", id).single();
  if (readError) failed("Declining the question", readError.message);
  const { error } = await supabase
    .from("community_questions")
    .update({ status: "declined", decline_note: note || null, reported_at: null })
    .eq("id", id);
  if (error) failed("Declining the question", error.message);
  let msg = "Question declined. It will not be shown.";
  if (note) {
    const { data: who } = await supabase.from("community_profiles").select("email, first_name").eq("user_id", q.user_id).maybeSingle();
    if (who) {
      const e = await emailQuestionDeclined({ email: who.email, firstName: who.first_name, body: q.body, note });
      msg = e ? `Question declined, but your note did not go: ${e}` : `Question declined, and your note was emailed to ${who.email}.`;
    }
  }
  revalidatePath("/community/questions");
  done(msg, "#questions");
}

/** Takes a published answer off the board, back to the review list. */
export async function unpublishQuestion(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("community_questions").update({ status: "pending" }).eq("id", id);
  if (error) failed("Taking the question down", error.message);
  revalidatePath("/community/questions");
  done("Taken off the board. It is back in your review list.", "#review");
}

export async function deleteQuestion(formData: FormData) {
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "yes") redirect(`${BACK}?deleteQuestion=${encodeURIComponent(id)}#cq-${id}`);
  const { error } = await supabase.from("community_questions").delete().eq("id", id);
  if (error) failed("Deleting the question", error.message);
  revalidatePath("/community/questions");
  done("Question deleted.", "#questions");
}

/* --------------------------------------------------------- remove member */

/**
 * "Remove member": deletes their community profile and posts and stops the
 * same address joining again (community_remove_member in the database). Only
 * community tables are touched; a membership, purchase or gift is never read
 * or changed. Their MailerLite community group entry is removed too.
 */
export async function removeMember(formData: FormData) {
  const supabase = await db();
  const userId = String(formData.get("user_id") ?? "");
  if (formData.get("confirm") !== "yes") redirect(`${BACK}?removeMember=${encodeURIComponent(userId)}#m-${userId}`);
  const { data: email, error } = await supabase.rpc("community_remove_member", { target: userId });
  if (error) failed("Removing the member", error.message);
  const ml = await removeFromCommunityGroup(String(email));
  revalidatePath("/community/prayer");
  revalidatePath("/community/questions");
  revalidatePath("/community/answered");
  done(
    ml
      ? `${email} has been removed and cannot rejoin. Their MailerLite entry was not changed (${ml}); remove them from the group there.`
      : `${email} has been removed from the community and cannot rejoin.`,
    "#people"
  );
}
