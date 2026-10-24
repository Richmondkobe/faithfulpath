import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OutreachGoal, OutreachProspect, OutreachStatus } from "@/lib/outreach";
import { listPublishedArticles } from "@/lib/articles-db";

/**
 * Outreach reads and writes go through the admin's own signed-in session, not
 * the service role, so the table's RLS policies (admin email only) are what
 * authorise them — on top of requireAdmin() in every page and action.
 */
export async function outreachClient() {
  return createSupabaseServerClient();
}

/** True when the migration has not been run yet. */
export function isMissingTable(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (/outreach_prospects/.test(error.message ?? "") &&
      /does not exist|could not find/i.test(error.message ?? ""))
  );
}

export type ProspectList =
  | { missingTable: true }
  | { missingTable: false; prospects: OutreachProspect[] };

/** Every prospect, newest first. A few hundred rows at most, so filtering is done on the page. */
export async function listProspects(): Promise<ProspectList> {
  const supabase = await outreachClient();
  const { data, error } = await supabase
    .from("outreach_prospects")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    if (isMissingTable(error)) return { missingTable: true };
    throw new Error(`Could not load outreach: ${error.message}`);
  }
  return { missingTable: false, prospects: (data ?? []) as OutreachProspect[] };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProspect(id: string): Promise<OutreachProspect | null> {
  if (!UUID.test(id)) return null;
  const supabase = await outreachClient();
  const { data, error } = await supabase
    .from("outreach_prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load the site: ${error.message}`);
  return (data as OutreachProspect) ?? null;
}

/** The prospect already holding a domain, if any. */
export async function findByDomain(
  domain: string
): Promise<Pick<OutreachProspect, "id" | "site_name" | "status"> | null> {
  const supabase = await outreachClient();
  const { data, error } = await supabase
    .from("outreach_prospects")
    .select("id, site_name, status")
    .eq("domain", domain)
    .maybeSingle();
  if (error) throw new Error(`Could not check the list: ${error.message}`);
  return data ?? null;
}

export function countByStatus(prospects: OutreachProspect[]): Map<OutreachStatus, number> {
  const counts = new Map<OutreachStatus, number>();
  for (const p of prospects) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  return counts;
}

/** Published article addresses, for the Suggested page picker. Read only. */
export async function articlePaths(): Promise<string[]> {
  return (await listPublishedArticles()).map((a) => `/articles/${a.slug}`).sort();
}

export function countByGoal(prospects: OutreachProspect[]): Map<OutreachGoal, number> {
  const counts = new Map<OutreachGoal, number>();
  for (const p of prospects) counts.set(p.goal, (counts.get(p.goal) ?? 0) + 1);
  return counts;
}
