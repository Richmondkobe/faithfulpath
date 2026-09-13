import { createSupabaseServerClient } from "@/lib/supabase/server";

// One written question per member per calendar month.
//
// Reads and writes go through the cookie-backed anon client, so RLS on
// auth.uid() scopes them to the member — the count that enforces the limit is
// therefore a count of their own rows and nobody else's.

/** Where a member's question is sent. */
export const QUESTIONS_INBOX = "info@faithfulpathcommunity.com";

export const QUESTION_MAX = 4000;

export type QuestionAllowance = {
  /** This month's question has been used. */
  used: boolean;
  /** When it was asked, if it was. */
  askedAt: string | null;
  /** The first of next month — when the next question opens. */
  opensOn: Date;
};

/** The calendar month a date falls in, in UTC, as [start, nextStart). */
function monthBounds(now = new Date()): { start: Date; next: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, next };
}

export function formatOpensOn(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Whether this member has used their question for the current month. */
export async function getQuestionAllowance(): Promise<QuestionAllowance> {
  const { start, next } = monthBounds();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("member_questions")
    .select("created_at")
    .gte("created_at", start.toISOString())
    .lt("created_at", next.toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(`Could not check your question: ${error.message}`);

  const latest = data?.[0]?.created_at ?? null;
  return { used: Boolean(latest), askedAt: latest, opensOn: next };
}

/** How long to wait on Resend before giving up on a single send. */
const SEND_TIMEOUT_MS = 10_000;

/**
 * Emails the question on to Richmond, with the member's address as reply-to so
 * a reply goes straight back to them rather than into the site.
 *
 * Called from `after()`, so the member is not waiting on it — but a hung
 * request would still pin the serverless invocation until its max duration, so
 * the fetch is given an explicit timeout of its own.
 *
 * Returns whether it actually went. A failure is logged and reported, never
 * thrown: the question is already saved by the time this runs, and losing it
 * because a mail provider was briefly down would be the worse outcome.
 */
export async function sendQuestionEmail({
  memberEmail,
  question,
  askedAt,
}: {
  memberEmail: string;
  question: string;
  askedAt: Date;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set — question saved but not emailed.");
    return false;
  }

  // Must be an address on a domain verified with Resend.
  const from =
    process.env.RESEND_FROM ?? "Faithful Path <questions@faithfulpathcommunity.com>";

  const asked = askedAt.toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  });

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to: [QUESTIONS_INBOX],
        reply_to: memberEmail,
        subject: `Member question from ${memberEmail}`,
        text: `${question}\n\n—\nFrom: ${memberEmail}\nAsked: ${asked} UTC\nReply to this email and it goes straight to them.`,
        html:
          `<p style="white-space:pre-wrap">${escape(question)}</p>` +
          `<hr><p style="color:#6B5F53;font-size:13px">From: ${escape(memberEmail)}<br>` +
          `Asked: ${escape(asked)} UTC<br>` +
          `Reply to this email and it goes straight to them.</p>`,
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    // Includes the abort above: a timeout is a failed send, not a crash.
    console.error("Resend request failed:", err);
    return false;
  }
}
