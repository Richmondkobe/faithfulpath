import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OutreachProspect } from "@/lib/outreach";
import { looksLikeEmail } from "@/lib/outreach";

/**
 * Sending an approved outreach email, one site at a time, through Resend.
 *
 * Every limit is checked here on the server, whatever the page shows: the
 * site must be Approved; it must have a contact email; neither it nor any
 * site sharing its domain may ever have been sent to, replied or declined;
 * and no more than DAILY_LIMIT go out in one day. Plain text only, so there
 * is nothing to track opens with, and Resend's click tracking (which rewrites
 * links in HTML) has no HTML to work on.
 */

export const FROM = "Richmond Kobe <info@faithfulpathcommunity.com>";
export const REPLY_TO = "info@faithfulpathcommunity.com";
export const BCC = "info@faithfulpathcommunity.com";
export const DAILY_LIMIT = 10;

/** The marker a Resend send leaves in the notes; the daily count looks for it. */
const SENT_MARKER = "Resend message id:";

/** The start of today in Thailand, where Richmond is (UTC+7 all year). */
function startOfToday(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  return new Date(`${ymd}T00:00:00+07:00`);
}

const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" });

const domainOf = (email: string | null) => email?.split("@")[1]?.toLowerCase() ?? null;

/** How many outreach emails went out through Resend today. */
export async function sentToday(db: SupabaseClient): Promise<number> {
  const { count, error } = await db
    .from("outreach_prospects")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", startOfToday().toISOString())
    .ilike("notes", `%${SENT_MARKER}%`);
  if (error) throw new Error(`Could not count today's sends: ${error.message}`);
  return count ?? 0;
}

/**
 * Why this site may not be emailed, or null when it may. Covers every rule
 * except the daily limit and the status, which are checked at send time.
 */
async function sendBlocker(p: OutreachProspect, db: SupabaseClient): Promise<string | null> {
  if (!p.contact_email || !looksLikeEmail(p.contact_email)) return "This site has no contact email, so it cannot be sent from here.";
  if (!p.draft_subject?.trim() || !p.draft_body?.trim()) return "There is no saved draft to send.";
  if (p.sent_at || p.replied_at) return "This site has been contacted before, so it will not be emailed again.";

  // Any site that has been contacted, has replied or has declined, and that
  // shares this site's domain, its email's domain or its email address,
  // whether as its own domain or as its contact's.
  const domains = new Set([p.domain, domainOf(p.contact_email)].filter(Boolean) as string[]);
  const { data, error } = await db
    .from("outreach_prospects")
    .select("id, site_name, domain, contact_email, status, sent_at, replied_at")
    .or("status.in.(sent,replied,declined),sent_at.not.is.null,replied_at.not.is.null");
  if (error) throw new Error(`Could not check the site's history: ${error.message}`);
  const earlier = (data ?? []).find(
    (r) =>
      r.id !== p.id &&
      (domains.has(r.domain) ||
        domains.has(domainOf(r.contact_email) ?? "") ||
        r.contact_email?.toLowerCase() === p.contact_email!.toLowerCase())
  );
  if (earlier) return `${[...domains].join(" / ")} has been contacted before (${earlier.site_name}), so it will not be emailed again.`;
  return null;
}

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string };

/** Marks a drafted site Approved, ready to send. */
export async function approveProspect(p: OutreachProspect, db: SupabaseClient): Promise<{ ok: true } | { ok: false; error: string }> {
  if (p.status !== "drafted") return { ok: false, error: `Only a Drafted site can be approved; this one is ${p.status}.` };
  if (!p.draft_subject?.trim() || !p.draft_body?.trim()) return { ok: false, error: "There is no saved draft to approve." };
  const { error } = await db.from("outreach_prospects").update({ status: "approved" }).eq("id", p.id).eq("status", "drafted");
  if (error) return { ok: false, error: `Could not approve: ${error.message}` };
  return { ok: true };
}

/** Sends one approved site's saved draft. The page cannot change what is sent: it is read from the row. */
export async function sendProspect(id: string, db: SupabaseClient): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set for this site, so nothing was sent." };

  const { data: row, error: loadError } = await db.from("outreach_prospects").select("*").eq("id", id).maybeSingle();
  if (loadError) return { ok: false, error: `Could not load the site: ${loadError.message}` };
  const p = row as OutreachProspect | null;
  if (!p) return { ok: false, error: "That site is not in the list." };
  if (p.status !== "approved") return { ok: false, error: `Only an Approved site can be sent; this one is ${p.status}.` };

  const blocker = await sendBlocker(p, db);
  if (blocker) return { ok: false, error: blocker };
  const count = await sentToday(db);
  if (count >= DAILY_LIMIT) return { ok: false, error: `${count} of ${DAILY_LIMIT} sent today, the daily limit. Try again tomorrow.` };

  // Claim the row: Approved to Sent, only if it is still Approved. A second
  // click, or a second tab, finds it no longer Approved and stops here.
  const { data: claimed, error: claimError } = await db
    .from("outreach_prospects")
    .update({ status: "sent" })
    .eq("id", id)
    .eq("status", "approved")
    .select("id");
  if (claimError) return { ok: false, error: `Could not start the send: ${claimError.message}` };
  if (!claimed?.length) return { ok: false, error: "This site is no longer Approved, so nothing was sent." };

  const release = (why: string) =>
    db.from("outreach_prospects").update({ status: "approved" }).eq("id", id).eq("status", "sent").is("sent_at", null).then(() => ({
      ok: false as const,
      error: why,
    }));

  let messageId: string;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // The same email to the same address is sent once by Resend, even if
        // this request is repeated after a timeout (Resend keeps the key a day).
        "Idempotency-Key": `outreach-${id}-${createHash("sha256").update(`${p.contact_email}\n${p.draft_subject}\n${p.draft_body}`).digest("hex").slice(0, 24)}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [p.contact_email],
        reply_to: REPLY_TO,
        bcc: [BCC],
        subject: p.draft_subject!.trim(),
        text: p.draft_body!.replace(/\r\n/g, "\n").trim(),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok || !json.id) {
      return await release(`Resend did not send it (${res.status}): ${json.message ?? json.name ?? "no detail"}. The site is still Approved.`);
    }
    messageId = json.id;
  } catch (err) {
    return await release(
      `The send did not complete (${err instanceof Error ? err.message : "network error"}). The site is still Approved. Check the BCC copy in info@ before trying again.`
    );
  }

  const notes = `${p.notes ? p.notes + " " : ""}Sent by email on ${today()} to ${p.contact_email} (${SENT_MARKER} ${messageId}).`;
  const { error: saveError } = await db
    .from("outreach_prospects")
    .update({ status: "sent", sent_at: new Date().toISOString(), notes })
    .eq("id", id);
  if (saveError) {
    // It went; only the record failed. Say so plainly rather than inviting a resend.
    return { ok: false, error: `The email WAS sent (Resend message id ${messageId}), but saving that here failed: ${saveError.message}. Do not send again.` };
  }
  return { ok: true, messageId };
}

/** For a site with only a contact page: Richmond sent it himself, so record it. */
export async function markSentByHand(p: OutreachProspect, db: SupabaseClient): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!["drafted", "approved"].includes(p.status)) return { ok: false, error: `Only a Drafted or Approved site can be marked sent; this one is ${p.status}.` };
  if (!p.draft_body?.trim()) return { ok: false, error: "There is no saved draft." };
  const notes = `${p.notes ? p.notes + " " : ""}Sent by hand${p.contact_page_url ? " through the contact page" : ""} on ${today()}.`;
  const { error } = await db
    .from("outreach_prospects")
    .update({ status: "sent", sent_at: new Date().toISOString(), notes })
    .eq("id", p.id)
    .in("status", ["drafted", "approved"]);
  if (error) return { ok: false, error: `Could not mark it sent: ${error.message}` };
  return { ok: true };
}
