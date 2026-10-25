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
