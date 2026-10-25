import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { giftAmount } from "@/lib/giving";

export const metadata: Metadata = {
  title: "Giving",
  robots: { index: false, follow: false },
};

type Gift = {
  id: string;
  kind: "one_time" | "monthly";
  amount_cents: number;
  name: string | null;
  email: string | null;
  paid_at: string;
};
type Partner = {
  stripe_subscription_id: string;
  name: string | null;
  email: string | null;
  amount_cents: number;
  status: string;
  cancel_at_period_end: boolean;
  started_at: string;
};

const DISPLAY = { fontFamily: "var(--font-display)", fontWeight: 500 } as const;
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });

/** The first moment of this month in Bangkok. */
function monthStart(): Date {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" })
    .format(new Date())
    .split("-");
  return new Date(`${y}-${m}-01T00:00:00+07:00`);
}

const LIVE = ["active", "trialing", "past_due"];

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-gold-line/60 bg-paper p-4">
      <p className="text-[13px] uppercase tracking-[0.12em] text-gold-text">{label}</p>
      <p className="mt-1 text-3xl text-navy" style={DISPLAY}>{value}</p>
      <p className="mt-1 text-sm text-muted">{note}</p>
    </div>
  );
}


/**
 * Gifts and monthly partners, read through the service role (the tables have
 * no policies), after requireAdmin(). Read only: nothing here changes a gift
 * or a partnership; that is done in Stripe.
 */
export default async function AdminGiving() {
  await requireAdmin();
  const [gifts, partners] = await Promise.all([
    supabaseAdmin.from("gifts").select("*").order("paid_at", { ascending: false }).limit(1000),
    supabaseAdmin.from("ministry_partners").select("*").order("started_at", { ascending: false }),
  ]);
  const missing = [gifts.error, partners.error].find((e) => e && /does not exist|could not find/i.test(e.message));
  if (missing) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl text-navy" style={DISPLAY}>Giving</h1>
        <p className="mt-4 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-danger">
          The giving tables are not in Supabase yet. Run supabase/migrations/20261028120000_giving.sql in the Supabase SQL
          editor first.
        </p>
      </main>
    );
  }
  const loadError = gifts.error ?? partners.error;
  const allGifts = (gifts.data ?? []) as Gift[];
  const allPartners = (partners.data ?? []) as Partner[];
  const since = monthStart().getTime();
  const sum = (list: Gift[]) => list.reduce((n, g) => n + g.amount_cents, 0);
  const thisMonth = allGifts.filter((g) => new Date(g.paid_at).getTime() >= since);
  const live = allPartners.filter((p) => LIVE.includes(p.status));
  const monthlyPromised = live.filter((p) => !p.cancel_at_period_end).reduce((n, p) => n + p.amount_cents, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl text-navy" style={DISPLAY}>Giving</h1>
      <p className="mt-2 text-muted">
        Gifts made at /give. Kept apart from book sales and the membership. Refunds and cancellations are done in Stripe.
      </p>
      {loadError && <p className="mt-6 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-danger">Could not load everything: {loadError.message}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="This month" value={giftAmount(sum(thisMonth))} note={`${thisMonth.length} gift${thisMonth.length === 1 ? "" : "s"} since the 1st (Bangkok time)`} />
        <Stat label="All time" value={giftAmount(sum(allGifts))} note={`${allGifts.length} gift${allGifts.length === 1 ? "" : "s"}, monthly gifts counted each month`} />
        <Stat label="Monthly partners" value={String(live.length)} note={`${giftAmount(monthlyPromised)} a month from partners not cancelling`} />
      </div>

      <section id="partners" className="mt-12">
        <h2 className="text-2xl text-navy" style={DISPLAY}>Active monthly partners ({live.length})</h2>
        {live.length === 0 ? (
          <p className="mt-4 text-muted">No monthly partners yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-paper">
            {live.map((p) => (
              <li key={p.stripe_subscription_id} className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 text-sm">
                <p className="text-navy">
                  <span className="font-semibold">{p.name ?? "No name given"}</span>
                  {p.email && <> · <a href={`mailto:${p.email}`} className="text-gold-text underline underline-offset-4">{p.email}</a></>}
                  {p.status === "past_due" && <span className="ml-2 font-semibold text-danger">Payment failing</span>}
                  {p.cancel_at_period_end && <span className="ml-2 text-muted">Cancelling at the end of this month</span>}
                </p>
                <p className="text-navy">
                  <span className="font-semibold">{giftAmount(p.amount_cents)} a month</span>
                  <span className="text-muted"> · since {day(p.started_at)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="gifts" className="mt-12">
        <h2 className="text-2xl text-navy" style={DISPLAY}>All gifts ({allGifts.length})</h2>
        {allGifts.length === 0 ? (
          <p className="mt-4 text-muted">No gifts yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-paper">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-[13px] uppercase tracking-[0.12em] text-gold-text">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {allGifts.map((g) => (
                  <tr key={g.id}>
                    <td className="whitespace-nowrap px-4 py-3">{day(g.paid_at)}</td>
                    <td className="px-4 py-3 text-navy">{g.name ?? "—"}</td>
                    <td className="px-4 py-3 break-all">{g.email ?? "—"}</td>
                    <td className="px-4 py-3">{g.kind === "monthly" ? "Monthly" : "One-time"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">{giftAmount(g.amount_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
