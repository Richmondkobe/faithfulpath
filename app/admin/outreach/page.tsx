import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { articlePaths, countByGoal, countByStatus, listProspects } from "@/lib/outreach-db";
import {
  GOAL_LABELS,
  OUTREACH_GOALS,
  OUTREACH_STATUSES,
  STATUS_LABELS,
  isOutreachGoal,
  isOutreachStatus,
  type OutreachGoal,
  type OutreachStatus,
} from "@/lib/outreach";
import { AddProspectForm } from "@/components/admin/OutreachForms";
import ProspectRow from "@/components/admin/ProspectRow";
import FindSitesPanel from "@/components/admin/FindSitesPanel";
import { RESEARCH_TOPICS } from "@/lib/outreach-research";
import { getCategory } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Outreach",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ status?: string; goal?: string }> };

/** The list address for a status and goal; either may be left off. */
function listHref(status: OutreachStatus | null, goal: OutreachGoal | null): string {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  if (goal) q.set("goal", goal);
  const qs = q.toString();
  return qs ? `/admin/outreach?${qs}` : "/admin/outreach";
}

const dateAdded = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function AdminOutreach({ searchParams }: Props) {
  // Checked here as well as in the layout: a layout does not stop its pages
  // rendering on their own.
  await requireAdmin();
  const sp = await searchParams;
  const active = isOutreachStatus(sp.status ?? "") ? (sp.status as OutreachStatus) : null;
  const activeGoal = isOutreachGoal(sp.goal ?? "") ? (sp.goal as OutreachGoal) : null;

  const [list, paths] = await Promise.all([listProspects(), articlePaths()]);

  const heading = (
    <h1
      className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy"
      style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
    >
      Outreach
    </h1>
  );

  if (list.missingTable) {
    return (
      <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
        {heading}
        <p className="mt-8 max-w-2xl rounded-xl border border-gold-line bg-paper px-5 py-4 leading-relaxed text-navy">
          The outreach table is not set up yet. Paste{" "}
          <code className="rounded bg-sand px-1.5 py-0.5 text-[0.9em]">supabase/migrations/20261024120000_outreach_prospects.sql</code>{" "}
          into the Supabase SQL editor and run it, then reload this page.
        </p>
      </main>
    );
  }

  const { prospects } = list;
  // Each row of buttons counts within the other row's choice.
  const inGoal = activeGoal ? prospects.filter((p) => p.goal === activeGoal) : prospects;
  const inStatus = active ? prospects.filter((p) => p.status === active) : prospects;
  const counts = countByStatus(inGoal);
  const goalCounts = countByGoal(inStatus);
  const shown = inGoal.filter((p) => !active || p.status === active);

  const pill = (on: boolean) =>
    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors " +
    (on ? "border-navy bg-navy text-paper" : "border-gold-line text-navy hover:border-navy hover:bg-paper");

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      {heading}
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        Christian blogs, ministry sites and directories that might link to an article. Click a row to edit it.
      </p>

      <FindSitesPanel
        topics={RESEARCH_TOPICS.map((slug) => ({ slug, label: getCategory(slug)?.label ?? slug }))}
      />

      <nav aria-label="Filter by status" className="mt-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">Status</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          <li>
            <Link href={listHref(null, activeGoal)} aria-current={active ? undefined : "page"} className={pill(!active)}>
              All <span className="font-normal opacity-80">{inGoal.length}</span>
            </Link>
          </li>
          {OUTREACH_STATUSES.map((s) => (
            <li key={s}>
              <Link
                href={listHref(s, activeGoal)}
                aria-current={active === s ? "page" : undefined}
                className={pill(active === s)}
              >
                {STATUS_LABELS[s]} <span className="font-normal opacity-80">{counts.get(s) ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Filter by goal" className="mt-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">Goal</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          <li>
            <Link href={listHref(active, null)} aria-current={activeGoal ? undefined : "page"} className={pill(!activeGoal)}>
              All <span className="font-normal opacity-80">{inStatus.length}</span>
            </Link>
          </li>
          {OUTREACH_GOALS.map((g) => (
            <li key={g}>
              <Link
                href={listHref(active, g)}
                aria-current={activeGoal === g ? "page" : undefined}
                className={pill(activeGoal === g)}
              >
                {GOAL_LABELS[g]} <span className="font-normal opacity-80">{goalCounts.get(g) ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {shown.length === 0 ? (
        <p className="mt-10 leading-relaxed text-muted">
          {prospects.length === 0 ? "No sites yet. Add the first one below." : "No sites match these filters."}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gold-line text-[11px] uppercase tracking-[0.18em] text-gold-text">
                <th className="py-3 pr-4 font-medium">Site</th>
                <th className="py-3 pr-4 font-medium">Contact email</th>
                <th className="py-3 pr-4 font-medium">Goal</th>
                <th className="py-3 pr-4 font-medium">Suggested page</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Added</th>
                <th className="py-3 font-medium"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <ProspectRow key={p.id} href={`/admin/outreach/${p.id}`}>
                  <td className="py-3 pr-4 align-top">
                    <a
                      href={p.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-navy underline underline-offset-4 hover:text-gold-text"
                    >
                      {p.site_name}
                    </a>
                    <span className="block text-muted">{p.domain}</span>
                  </td>
                  <td className="py-3 pr-4 align-top text-ink">{p.contact_email ?? <span className="text-muted">—</span>}</td>
                  <td className="py-3 pr-4 align-top whitespace-nowrap text-ink">{GOAL_LABELS[p.goal]}</td>
                  <td className="py-3 pr-4 align-top text-ink">{p.suggested_page ?? <span className="text-muted">—</span>}</td>
                  <td className="py-3 pr-4 align-top">
                    <span className="rounded-xl bg-line px-2 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gold-text">
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 align-top whitespace-nowrap text-muted">{dateAdded(p.created_at)}</td>
                  <td className="py-3 align-top">
                    <Link href={`/admin/outreach/${p.id}`} className="text-muted underline underline-offset-4 hover:text-gold-text">
                      Open
                    </Link>
                  </td>
                </ProspectRow>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-16 border-t border-line pt-10">
        <h2
          className="text-2xl text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Add site
        </h2>
        <AddProspectForm articlePaths={paths} />
      </section>
    </main>
  );
}
