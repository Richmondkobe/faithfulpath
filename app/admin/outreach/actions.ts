"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { findByDomain, getProspect, isMissingTable, outreachClient } from "@/lib/outreach-db";
import { draftProspectEmail, type DraftResult } from "@/lib/outreach-draft";
import { domainFromUrl, isOutreachGoal, isOutreachStatus, looksLikeEmail, normaliseUrl } from "@/lib/outreach";

export type OutreachFormState = {
  error: string | null;
  /** Set when the domain is already in the list, so the form can link to it. */
  duplicate?: { id: string; site_name: string; domain: string } | null;
  saved?: boolean;
  /** What was typed, sent back on an error so the form can show it again. */
  values?: Record<string, string>;
  /** Changes on every answer, so the form re-renders its fields from it. */
  nonce?: number;
};

/** An error answer that keeps what was typed (React resets the form after an action). */
function fail(formData: FormData, error: string, duplicate?: OutreachFormState["duplicate"]): OutreachFormState {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && !k.startsWith("$")) values[k] = v;
  return { error, duplicate: duplicate ?? null, values, nonce: Date.now() };
}

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const orNull = (s: string) => (s ? s : null);

/**
 * The fields both forms share, checked. Returns an error message or the values
 * to store.
 */
function readCommon(formData: FormData) {
  const site_name = text(formData, "site_name");
  const siteUrlInput = text(formData, "site_url");
  const contactEmail = text(formData, "contact_email");
  const contactPageInput = text(formData, "contact_page_url");
  const suggested = text(formData, "suggested_page");
  const goal = text(formData, "goal");

  if (!site_name) return { error: "Give the site a name." } as const;
  if (!isOutreachGoal(goal)) return { error: "Choose a goal from the list." } as const;
  const site_url = normaliseUrl(siteUrlInput);
  const domain = site_url ? domainFromUrl(site_url) : null;
  if (!site_url || !domain) return { error: "Enter the site's web address, like example.org." } as const;
  if (contactEmail && !looksLikeEmail(contactEmail)) {
    return { error: `"${contactEmail}" does not look like an email address.` } as const;
  }
  const contact_page_url = contactPageInput ? normaliseUrl(contactPageInput) : null;
  if (contactPageInput && !contact_page_url) {
    return { error: "Enter the contact page as a web address, or leave it blank." } as const;
  }

  return {
    fields: {
      site_name,
      site_url,
      domain,
      contact_name: orNull(text(formData, "contact_name")),
      contact_email: orNull(contactEmail.toLowerCase()),
      contact_page_url,
      why_relevant: orNull(text(formData, "why_relevant")),
      goal,
      suggested_page: orNull(suggested),
    },
  } as const;
}

export async function addProspect(
  _prev: OutreachFormState,
  formData: FormData
): Promise<OutreachFormState> {
  // Server Actions are reachable by direct POST, so authorise here too.
  await requireAdmin();

  const read = readCommon(formData);
  if ("error" in read) return fail(formData, read.error ?? "Check the form.");
  const { fields } = read;

  // Checked first for a friendly message; the unique index is the real guard.
  const existing = await findByDomain(fields.domain).catch(() => null);
  if (existing) {
    return fail(formData, `${fields.domain} is already in the list, as "${existing.site_name}".`, { id: existing.id, site_name: existing.site_name, domain: fields.domain });
  }

  const supabase = await outreachClient();
  const { error } = await supabase.from("outreach_prospects").insert({ ...fields, status: "new" });

  if (error) {
    if (error.code === "23505") {
      const again = await findByDomain(fields.domain).catch(() => null);
      return fail(formData, `${fields.domain} is already in the list.`, again ? { id: again.id, site_name: again.site_name, domain: fields.domain } : null);
    }
    if (isMissingTable(error)) {
      return fail(formData, "The outreach table is not set up yet. Run the migration in Supabase first.");
    }
    return fail(formData, `Could not add the site: ${error.message}`);
  }

  revalidatePath("/admin/outreach");
  return { error: null, saved: true, nonce: Date.now() };
}

/** "2026-10-24" from a date input, as a timestamp; blank clears it. */
function dateField(raw: string): string | null | "invalid" {
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "invalid";
  const d = new Date(`${raw}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? "invalid" : d.toISOString();
}

export async function updateProspect(
  _prev: OutreachFormState,
  formData: FormData
): Promise<OutreachFormState> {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) return { error: "Missing the site's id." };

  const read = readCommon(formData);
  if ("error" in read) return fail(formData, read.error ?? "Check the form.");
  const { fields } = read;

  const status = text(formData, "status");
  if (!isOutreachStatus(status)) return fail(formData, "Choose a status from the list.");

  let sent_at = dateField(text(formData, "sent_at"));
  let replied_at = dateField(text(formData, "replied_at"));
  if (sent_at === "invalid" || replied_at === "invalid") return fail(formData, "Enter dates as day, month and year.");
  // Marking a site sent or replied records the day, unless a day is already set.
  const today = new Date().toISOString();
  if (status === "sent" && !sent_at) sent_at = today;
  if (status === "replied" && !replied_at) replied_at = today;

  const existing = await findByDomain(fields.domain).catch(() => null);
  if (existing && existing.id !== id) {
    return fail(formData, `${fields.domain} is already in the list, as "${existing.site_name}".`, { id: existing.id, site_name: existing.site_name, domain: fields.domain });
  }

  const supabase = await outreachClient();
  const { error } = await supabase
    .from("outreach_prospects")
    .update({
      ...fields,
      status,
      draft_subject: orNull(text(formData, "draft_subject")),
      draft_body: orNull(String(formData.get("draft_body") ?? "").replace(/\r\n/g, "\n").trim()),
      notes: orNull(String(formData.get("notes") ?? "").replace(/\r\n/g, "\n").trim()),
      sent_at,
      replied_at,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return fail(formData, `${fields.domain} is already in the list.`);
    return fail(formData, `Could not save: ${error.message}`);
  }

  revalidatePath("/admin/outreach");
  revalidatePath(`/admin/outreach/${id}`);
  redirect("/admin/outreach");
}

/** Drafts (or redrafts) one site's email and marks it Drafted. Nothing is sent. */
export async function draftProspect(id: string): Promise<DraftResult> {
  await requireAdmin();
  const p = await getProspect(id);
  if (!p) return { ok: false, error: "That site is not in the list." };
  try {
    const result = await draftProspectEmail(p, await outreachClient());
    if (result.ok) {
      revalidatePath("/admin/outreach");
      revalidatePath(`/admin/outreach/${id}`);
    }
    return result;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "The draft failed." };
  }
}
