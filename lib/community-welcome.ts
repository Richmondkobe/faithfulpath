import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site";
import { firstNameOf, nextOccurrence, type Gathering } from "@/lib/community";
import { GATHERING_ON } from "@/lib/gathering-switch";

/**
 * The welcome email to someone who has just joined the community (Richmond's
 * wording, 26 October 2026). Sent once, from createProfile in
 * app/community/actions.ts, which runs only when a new profile is saved:
 * signing in again never sends it.
 *
 * Plain, like the site's other emails. No Zoom link: members find it on the
 * Gathering page once signed in. The gathering line is left out while the
 * gathering is on hold (lib/gathering-switch.ts).
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
  const questions = `${SITE.url}/community/questions`;
  const link = (href: string, label: string) => `<a href="${href}" style="color:#5e4412">${label}</a>`;

  // Each way to begin, as plain text and as HTML.
  const ways: { text: string; html: string }[] = [
    {
      text: `Share a prayer request on the Prayer Wall, and pray for others.\n   ${prayer}`,
      html: `Share a prayer request on the ${link(prayer, "Prayer Wall")}, and pray for others.`,
    },
    ...(GATHERING_ON
      ? [
          {
            text: `Join our weekly gathering on Zoom for prayer and Bible study.${when ? ` The next one is ${when}.` : ""}\n   ${gathering}`,
            html: `Join our ${link(gathering, "weekly gathering")} on Zoom for prayer and Bible study.${
              when ? ` The next one is ${escape(when)}.` : ""
            }`,
          },
        ]
      : []),
    {
      text: `Ask me a question about faith, the Bible or following Jesus on the community Q&A board, with your first name or anonymously. I answer there for everyone to read.\n   ${questions}`,
      html: `Ask me a question about faith, the Bible or following Jesus on the community ${link(questions, "Q&amp;A board")}, with your first name or anonymously. I answer there for everyone to read.`,
    },
    {
      text: "Reply to this email if you'd like to tell me a little more about yourself.",
      html: "Reply to this email if you&rsquo;d like to tell me a little more about yourself.",
    },
  ];
  const count = ["one", "two", "three", "four", "five"][ways.length - 1] ?? String(ways.length);

  const subject = `Welcome to the Faithful Path Community, ${firstName}`;
  const text = [
    `Dear ${firstName},`,
    "",
    "Welcome! I'm so glad you've joined us. Thank you for telling me a little about yourself. I read every message personally.",
    "",
    `Here are ${count} simple ways to begin:`,
    "",
    ...ways.map((w, i) => `${i + 1}. ${w.text}`),
    "",
    "You don't have to walk with God alone. We're glad you're here.",
    "",
    "Grace and peace,",
    "Pastor Richmond Kobe",
    "Faithful Path Community",
  ].join("\n");

  const p = (s: string) => `<p style="margin:0 0 16px;line-height:1.6">${s}</p>`;
  const html =
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#2b3445;max-width:560px">` +
    p(`Dear ${escape(firstName)},`) +
    p("Welcome! I&rsquo;m so glad you&rsquo;ve joined us. Thank you for telling me a little about yourself. I read every message personally.") +
    p(`Here are ${count} simple ways to begin:`) +
    `<ol style="margin:0 0 16px;padding-left:24px;line-height:1.6">` +
    ways.map((w, i) => `<li${i < ways.length - 1 ? ' style="margin-bottom:8px"' : ""}>${w.html}</li>`).join("") +
    `</ol>` +
    p("You don&rsquo;t have to walk with God alone. We&rsquo;re glad you&rsquo;re here.") +
    `<p style="margin:0;line-height:1.6">Grace and peace,<br>Pastor Richmond Kobe<br>Faithful Path Community</p>` +
    `</div>`;

  return { subject, text, html };
}

/**
 * Sends the welcome email and records on the profile whether it went, for
 * Admin -> Community. Never throws: the person has already joined. Returns the
 * error, or null when it was sent.
 *
 * The record is written with the service-role client, as the MailerLite one
 * is: this runs after the response, with no cookie jar to refresh a session
 * into. It writes only the two welcome columns of this one profile.
 */
export async function sendWelcomeEmail(p: { userId: string; email: string; fullName: string }): Promise<string | null> {
  const error = await deliver(p);
  if (error) console.error(`Welcome email not sent: ${error}`);
  const { error: saveError } = await supabaseAdmin
    .from("community_profiles")
    .update(error ? { welcome_error: error } : { welcome_sent_at: new Date().toISOString(), welcome_error: null })
    .eq("user_id", p.userId);
  if (saveError) console.error("Welcome email status not saved:", saveError.message);
  return error;
}

async function deliver(p: { email: string; fullName: string }): Promise<string | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "RESEND_API_KEY is not set for this site.";
  const firstName = firstNameOf(p.fullName) || "friend";
  const { subject, text, html } = welcomeEmail(firstName, GATHERING_ON ? await nextGatheringWhen() : null);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to: [p.email], reply_to: REPLY_TO, subject, text, html }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return `Resend ${res.status}: ${body.message ?? "no detail"}`;
    }
    return null;
  } catch (err) {
    return `Resend did not answer: ${err instanceof Error ? err.message : "network error"}`;
  }
}
