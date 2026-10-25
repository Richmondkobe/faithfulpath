import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site";
import { firstNameOf, nextOccurrence, type Gathering } from "@/lib/community";

/**
 * The welcome email to someone who has just joined the community (Richmond's
 * wording, 26 October 2026). Sent once, from createProfile in
 * app/community/actions.ts, which runs only when a new profile is saved:
 * signing in again never sends it.
 *
 * Plain, like the site's other emails. No Zoom link: members find it on the
 * Gathering page once signed in.
 */

const FROM = "Pastor Richmond Kobe <questions@faithfulpathcommunity.com>";
const REPLY_TO = "info@faithfulpathcommunity.com";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** "Saturday 7 November, 8:00 PM Eastern (Sunday 8:00 AM Bangkok)". */
export function gatheringWhen(iso: string): string {
  const d = new Date(iso);
  const day = (timeZone: string) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone });
  const time = (timeZone: string) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone });
  const bangkokDay = d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "Asia/Bangkok" });
  return `${day("America/New_York")}, ${time("America/New_York")} Eastern (${bangkokDay} ${time("Asia/Bangkok")} Bangkok)`;
}

/** When the next gathering is, as the email words it, or null if none is set. */
async function nextGatheringWhen(): Promise<string | null> {
  const { data, error } = await supabaseAdmin.from("community_gatherings").select("*");
  if (error) {
    console.error("Welcome email: could not read the gathering:", error.message);
    return null;
  }
  const { next } = nextOccurrence((data ?? []) as Gathering[], Date.now());
  return next ? gatheringWhen(next.start) : null;
}

export function welcomeEmail(firstName: string, when: string | null) {
  const prayer = `${SITE.url}/community/prayer`;
  const gathering = `${SITE.url}/community/gathering`;
  const gatheringLine = when
    ? `Join our weekly gathering on Zoom for prayer and Bible study. The next one is ${when}.`
    : "Join our weekly gathering on Zoom for prayer and Bible study.";

  const subject = `Welcome to the Faithful Path Community, ${firstName}`;
  const text = [
    `Dear ${firstName},`,
    "",
    "Welcome! I'm so glad you've joined us. Thank you for telling me a little about yourself. I read every message personally.",
    "",
    "Here are three simple ways to begin:",
    "",
    `1. Share a prayer request on the Prayer Wall, and pray for others.\n   ${prayer}`,
    `2. ${gatheringLine}\n   ${gathering}`,
    "3. Reply to this email if you'd like to tell me more or ask a question.",
    "",
    "You don't have to walk with God alone. We're glad you're here.",
    "",
    "Grace and peace,",
    "Pastor Richmond Kobe",
    "Faithful Path Community",
  ].join("\n");

  const p = (s: string) => `<p style="margin:0 0 16px;line-height:1.6">${s}</p>`;
  const link = (href: string, label: string) => `<a href="${href}" style="color:#5e4412">${label}</a>`;
  const html =
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#2b3445;max-width:560px">` +
    p(`Dear ${escape(firstName)},`) +
    p("Welcome! I&rsquo;m so glad you&rsquo;ve joined us. Thank you for telling me a little about yourself. I read every message personally.") +
    p("Here are three simple ways to begin:") +
    `<ol style="margin:0 0 16px;padding-left:24px;line-height:1.6">` +
    `<li style="margin-bottom:8px">Share a prayer request on the ${link(prayer, "Prayer Wall")}, and pray for others.</li>` +
    `<li style="margin-bottom:8px">Join our ${link(gathering, "weekly gathering")} on Zoom for prayer and Bible study.${
      when ? ` The next one is ${escape(when)}.` : ""
    }</li>` +
    `<li>Reply to this email if you&rsquo;d like to tell me more or ask a question.</li>` +
    `</ol>` +
    p("You don&rsquo;t have to walk with God alone. We&rsquo;re glad you&rsquo;re here.") +
    `<p style="margin:0;line-height:1.6">Grace and peace,<br>Pastor Richmond Kobe<br>Faithful Path Community</p>` +
    `</div>`;

  return { subject, text, html };
}

/** Sends the welcome email. Never throws: the person has already joined. */
export async function sendWelcomeEmail(p: { email: string; fullName: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set — new community member not sent a welcome email.");
    return false;
  }
  const firstName = firstNameOf(p.fullName) || "friend";
  const { subject, text, html } = welcomeEmail(firstName, await nextGatheringWhen());
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to: [p.email], reply_to: REPLY_TO, subject, text, html }),
    });
    if (!res.ok) {
      console.error("Resend error (welcome email):", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend request failed (welcome email):", err);
    return false;
  }
}
