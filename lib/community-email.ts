import { SITE } from "@/lib/site";

/**
 * Tells Richmond a prayer request is waiting for him: a new one, or one a
 * member has reported. Sent from after(), so the member is not kept waiting,
 * and it never throws — the request is already saved by the time this runs.
 */

const INBOX = "info@faithfulpathcommunity.com";
const SEND_TIMEOUT_MS = 10_000;

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function notifyPrayerForReview({
  kind,
  body,
  shownAs,
  fromEmail,
}: {
  kind: "new" | "reported" | "praise";
  body: string;
  shownAs: string;
  fromEmail: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set — prayer request saved but not emailed.");
    return false;
  }
  const from = process.env.RESEND_FROM ?? "Faithful Path <questions@faithfulpathcommunity.com>";
  const review = `${SITE.url}/admin/community`;
  const subject =
    kind === "new" ? "New prayer request to review" : kind === "praise" ? "New answered prayer to review" : "A prayer request was reported";
  const lead =
    kind === "new"
      ? `A new prayer request is waiting for your approval. It will be shown as "${shownAs}".`
      : kind === "praise"
        ? `A member has marked their prayer request answered and written a praise update. It is waiting for your approval before it appears. It is shown as "${shownAs}".`
        : `A member reported this prayer request, so it is off the wall and back in your review list. It is shown as "${shownAs}".`;
  const footer = kind === "reported" ? `Reported by: ${fromEmail}` : `Posted by: ${fromEmail}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from,
        to: [INBOX],
        subject,
        text: `${lead}\n\n${body}\n\n—\n${footer}\nReview it: ${review}`,
        html:
          `<p>${escape(lead)}</p>` +
          `<p style="white-space:pre-wrap;border-left:3px solid #d4a24c;padding-left:12px">${escape(body)}</p>` +
          `<hr><p style="color:#6B5F53;font-size:13px">${escape(footer)}<br>` +
          `<a href="${review}">Review it in the admin</a></p>`,
      }),
    });
    if (!res.ok) {
      console.error("Resend error (prayer request):", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend request failed (prayer request):", err);
    return false;
  }
}

/**
 * Tells Richmond someone has joined, with what they wrote, so he can welcome
 * them himself. Reply-to is the new member, so a reply goes straight to them.
 * Like the prayer email: sent from after(), never throws.
 */
export async function notifyNewMember(m: {
  fullName: string;
  email: string;
  country: string;
  phone: string | null;
  message: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set — new community member saved but not emailed.");
    return false;
  }
  const from = process.env.RESEND_FROM ?? "Faithful Path <questions@faithfulpathcommunity.com>";
  const admin = `${SITE.url}/admin/community#people`;
  const details = [`Name: ${m.fullName}`, `Email: ${m.email}`, `Country: ${m.country}`, `Phone: ${m.phone ?? "not given"}`];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from,
        to: [INBOX],
        reply_to: m.email,
        subject: `New community member: ${m.fullName}`,
        text: `${m.fullName} has joined the Faithful Path Community.\n\n${details.join("\n")}\n\nWhy they'd like to join:\n${m.message}\n\n—\nReply to this email and it goes straight to them.\nAll members: ${admin}`,
        html:
          `<p>${escape(m.fullName)} has joined the Faithful Path Community.</p>` +
          `<p>${details.map(escape).join("<br>")}</p>` +
          `<p><strong>Why they'd like to join:</strong></p>` +
          `<p style="white-space:pre-wrap;border-left:3px solid #d4a24c;padding-left:12px">${escape(m.message)}</p>` +
          `<hr><p style="color:#6B5F53;font-size:13px">Reply to this email and it goes straight to them.<br>` +
          `<a href="${admin}">See all members in the admin</a></p>`,
      }),
    });
    if (!res.ok) {
      console.error("Resend error (new community member):", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend request failed (new community member):", err);
    return false;
  }
}

/* ------------------------------------------------------ ask pastor richmond */

async function send(payload: Record<string, unknown>, what: string): Promise<string | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "RESEND_API_KEY is not set for this site.";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      console.error(`Resend error (${what}):`, res.status, body.message);
      return `Resend ${res.status}: ${body.message ?? "no detail"}`;
    }
    return null;
  } catch (err) {
    console.error(`Resend request failed (${what}):`, err);
    return `Resend did not answer: ${err instanceof Error ? err.message : "network error"}`;
  }
}

/** Tells Richmond a new question is waiting for his answer. */
export async function notifyNewQuestion(q: { body: string; shownAs: string; fromEmail: string }): Promise<void> {
  const from = process.env.RESEND_FROM ?? "Faithful Path <questions@faithfulpathcommunity.com>";
  const review = `${SITE.url}/admin/community#questions`;
  await send(
    {
      from,
      to: [INBOX],
      subject: "New question for Ask Pastor Richmond",
      text: `A member has asked a question. It will be shown as "${q.shownAs}" once you answer it.\n\n${q.body}\n\n—\nAsked by: ${q.fromEmail}\nAnswer it: ${review}`,
      html:
        `<p>A member has asked a question. It will be shown as &ldquo;${escape(q.shownAs)}&rdquo; once you answer it.</p>` +
        `<p style="white-space:pre-wrap;border-left:3px solid #d4a24c;padding-left:12px">${escape(q.body)}</p>` +
        `<hr><p style="color:#6B5F53;font-size:13px">Asked by: ${escape(q.fromEmail)}<br><a href="${review}">Answer it in the admin</a></p>`,
    },
    "new question"
  );
}

const MEMBER_FROM = "Pastor Richmond Kobe <questions@faithfulpathcommunity.com>";

/** Tells the member their question has been answered, with a link to it. */
export async function emailQuestionAnswered(m: { email: string; firstName: string; questionId: string; body: string }): Promise<string | null> {
  const link = `${SITE.url}/community/questions#q-${m.questionId}`;
  const short = m.body.length > 200 ? `${m.body.slice(0, 200).trimEnd()}…` : m.body;
  return send(
    {
      from: MEMBER_FROM,
      to: [m.email],
      reply_to: INBOX,
      subject: "Pastor Richmond has answered your question",
      text: `Dear ${m.firstName},\n\nThank you for your question. I have answered it on Ask Pastor Richmond:\n\n"${short}"\n\nRead my answer: ${link}\n\nGrace and peace,\nPastor Richmond Kobe\nFaithful Path Community`,
      html:
        `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#2b3445;max-width:560px">` +
        `<p>Dear ${escape(m.firstName)},</p>` +
        `<p>Thank you for your question. I have answered it on Ask Pastor Richmond:</p>` +
        `<p style="white-space:pre-wrap;border-left:3px solid #d4a24c;padding-left:12px">${escape(short)}</p>` +
        `<p><a href="${link}" style="color:#5e4412">Read my answer</a></p>` +
        `<p>Grace and peace,<br>Pastor Richmond Kobe<br>Faithful Path Community</p></div>`,
    },
    "question answered"
  );
}

/** Tells the member Pastor Richmond has replied under their prayer request, with the reply. */
export async function emailPrayerReply(m: { email: string; firstName: string; requestId: string; reply: string }): Promise<string | null> {
  const link = `${SITE.url}/community/prayer#p-${m.requestId}`;
  return send(
    {
      from: MEMBER_FROM,
      to: [m.email],
      reply_to: INBOX,
      subject: "Pastor Richmond replied to your prayer request",
      text: `Dear ${m.firstName},\n\nI have replied to your prayer request on the Prayer Wall:\n\n${m.reply}\n\nSee it on the Prayer Wall: ${link}\n\nGrace and peace,\nPastor Richmond Kobe\nFaithful Path Community`,
      html:
        `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#2b3445;max-width:560px">` +
        `<p>Dear ${escape(m.firstName)},</p>` +
        `<p>I have replied to your prayer request on the Prayer Wall:</p>` +
        `<p style="white-space:pre-wrap;border-left:3px solid #d4a24c;padding-left:12px">${escape(m.reply)}</p>` +
        `<p><a href="${link}" style="color:#5e4412">See it on the Prayer Wall</a></p>` +
        `<p>Grace and peace,<br>Pastor Richmond Kobe<br>Faithful Path Community</p></div>`,
    },
    "prayer reply"
  );
}

/** A private note to the member about a question Richmond is not answering on the board. */
export async function emailQuestionDeclined(m: { email: string; firstName: string; body: string; note: string }): Promise<string | null> {
  const short = m.body.length > 200 ? `${m.body.slice(0, 200).trimEnd()}…` : m.body;
  return send(
    {
      from: MEMBER_FROM,
      to: [m.email],
      reply_to: INBOX,
      subject: "About your question for Pastor Richmond",
      text: `Dear ${m.firstName},\n\nThank you for your question:\n\n"${short}"\n\nI will not be answering it on the board, but I wanted to write to you personally:\n\n${m.note}\n\nGrace and peace,\nPastor Richmond Kobe\nFaithful Path Community`,
      html:
        `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#2b3445;max-width:560px">` +
        `<p>Dear ${escape(m.firstName)},</p><p>Thank you for your question:</p>` +
        `<p style="white-space:pre-wrap;border-left:3px solid #d4a24c;padding-left:12px">${escape(short)}</p>` +
        `<p>I will not be answering it on the board, but I wanted to write to you personally:</p>` +
        `<p style="white-space:pre-wrap">${escape(m.note)}</p>` +
        `<p>Grace and peace,<br>Pastor Richmond Kobe<br>Faithful Path Community</p></div>`,
    },
    "question declined"
  );
}
