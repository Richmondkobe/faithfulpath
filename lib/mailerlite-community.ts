/**
 * The community's MailerLite group, "Faithful Path Community": joining adds
 * the person (full name and country, nothing else), leaving takes them out of
 * the group, and an announcement can be emailed to it.
 *
 * The same MAILERLITE_API_KEY as the newsletter sign-up (app/api/subscribe).
 * Nothing here throws: every function returns an error message or null, so a
 * MailerLite problem can never stop someone joining. The caller keeps the
 * message for the admin page, which can retry.
 */

export const COMMUNITY_GROUP = "Faithful Path Community";
const API = "https://connect.mailerlite.com/api";
const TIMEOUT_MS = 15_000;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

async function call<T>(path: string, init: RequestInit = {}): Promise<Result<T>> {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) return { ok: false, error: "MAILERLITE_API_KEY is not set for this site." };
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        ...init.headers,
      },
    });
    const text = await res.text();
    let json = {} as T & { message?: string };
    try {
      if (text) json = JSON.parse(text);
    } catch {
      // Not JSON; the raw text goes in the error below.
    }
    if (!res.ok) return { ok: false, error: `MailerLite ${res.status}: ${(json.message ?? text.slice(0, 200)) || "no detail"}` };
    return { ok: true, value: json };
  } catch (err) {
    return { ok: false, error: `MailerLite did not answer: ${err instanceof Error ? err.message : "network error"}` };
  }
}

let cachedGroupId: string | null = null;

/** The group's id, creating the group the first time it is needed. */
async function groupId(): Promise<Result<string>> {
  if (cachedGroupId) return { ok: true, value: cachedGroupId };
  const found = await call<{ data?: { id: string; name: string }[] }>(
    `/groups?filter[name]=${encodeURIComponent(COMMUNITY_GROUP)}&limit=50`
  );
  if (!found.ok) return found;
  // The filter matches loosely, so confirm the exact name.
  const group = found.value.data?.find((g) => g.name.trim().toLowerCase() === COMMUNITY_GROUP.toLowerCase());
  if (group) {
    cachedGroupId = group.id;
    return { ok: true, value: group.id };
  }
  const made = await call<{ data?: { id: string } }>("/groups", { method: "POST", body: JSON.stringify({ name: COMMUNITY_GROUP }) });
  if (!made.ok) return made;
  if (!made.value.data?.id) return { ok: false, error: "MailerLite did not return the new group's id." };
  cachedGroupId = made.value.data.id;
  return { ok: true, value: cachedGroupId };
}

/** Adds (or updates) the person in the group. Returns an error message, or null when it worked. */
export async function addToCommunityGroup(p: { email: string; fullName: string; country: string }): Promise<string | null> {
  const group = await groupId();
  if (!group.ok) return group.error;
  const res = await call("/subscribers", {
    method: "POST",
    body: JSON.stringify({
      email: p.email,
      // As the newsletter sign-up does: the whole name in "name".
      fields: { name: p.fullName, country: p.country },
      groups: [group.value],
    }),
  });
  return res.ok ? null : res.error;
}

/** Takes the person out of the group (not out of MailerLite: they may also get the newsletter). */
export async function removeFromCommunityGroup(email: string): Promise<string | null> {
  const group = await groupId();
  if (!group.ok) return group.error;
  const sub = await call<{ data?: { id: string } }>(`/subscribers/${encodeURIComponent(email)}`);
  if (!sub.ok) return sub.error.startsWith("MailerLite 404") ? null : sub.error;
  if (!sub.value.data?.id) return null;
  const res = await call(`/subscribers/${sub.value.data.id}/groups/${group.value}`, { method: "DELETE" });
  return res.ok || res.error.startsWith("MailerLite 404") ? null : res.error;
}

/** Sends an email to everyone in the group, now. Returns an error message, or null when it was sent. */
export async function emailCommunityGroup(p: { subject: string; html: string }): Promise<string | null> {
  const group = await groupId();
  if (!group.ok) return group.error;
  const campaign = await call<{ data?: { id: string } }>("/campaigns", {
    method: "POST",
    body: JSON.stringify({
      name: `Community announcement: ${p.subject}`.slice(0, 255),
      type: "regular",
      emails: [
        {
          subject: p.subject,
          from_name: "Pastor Richmond Kobe",
          from: "info@faithfulpathcommunity.com",
          content: p.html,
        },
      ],
      groups: [group.value],
    }),
  });
  if (!campaign.ok) return campaign.error;
  const id = campaign.value.data?.id;
  if (!id) return "MailerLite did not return the campaign's id.";
  const sent = await call(`/campaigns/${id}/schedule`, { method: "POST", body: JSON.stringify({ delivery: "instant" }) });
  return sent.ok ? null : `The email was created in MailerLite but not sent (${sent.error}). It is in MailerLite's campaigns as a draft.`;
}
