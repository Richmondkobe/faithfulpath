import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { articlePaths, getProspect, outreachClient } from "@/lib/outreach-db";
import { STATUS_LABELS } from "@/lib/outreach";
import { ProspectForm } from "@/components/admin/OutreachForms";
import { DraftButton } from "@/components/admin/DraftButtons";
import SendPanel from "@/components/admin/SendPanel";
import { DAILY_LIMIT, sentToday } from "@/lib/outreach-send";

// "Draft email" runs on the server from this page, and can take a minute.
export const maxDuration = 120;

export const metadata: Metadata = {
  title: "Outreach site",
  robots: { index: false, follow: false },
};

export default async function OutreachProspectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [p, paths, today] = await Promise.all([getProspect(id), articlePaths(), outreachClient().then(sentToday)]);
  if (!p) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
        Outreach · {STATUS_LABELS[p.status]}
      </p>
      <h1
        className="mt-2 text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {p.site_name}
      </h1>
      <p className="mt-3 text-sm text-muted">
        <a href={p.site_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-gold-text">
          {p.domain}
        </a>
        {" · added "}
        {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
      </p>
      {/* No redrafting once it has gone or been answered. */}
      {["new", "drafted", "approved"].includes(p.status) && <DraftButton id={p.id} hasDraft={Boolean(p.draft_body)} />}
      <SendPanel p={p} sentToday={today} dailyLimit={DAILY_LIMIT} />
      {/* Keyed on updated_at, so a new draft shows in the fields at once. */}
      <ProspectForm key={p.updated_at} p={p} articlePaths={paths} />
    </main>
  );
}
