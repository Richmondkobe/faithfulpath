import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { articlePaths, getProspect } from "@/lib/outreach-db";
import { STATUS_LABELS } from "@/lib/outreach";
import { ProspectForm } from "@/components/admin/OutreachForms";

export const metadata: Metadata = {
  title: "Outreach site",
  robots: { index: false, follow: false },
};

export default async function OutreachProspectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [p, paths] = await Promise.all([getProspect(id), articlePaths()]);
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
      <ProspectForm p={p} articlePaths={paths} />
    </main>
  );
}
