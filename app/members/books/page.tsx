import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { booksForEmail } from "@/lib/book-library";
import { coverPublicUrl } from "@/lib/supabase/admin";
import { getMemberByEmail, isActive } from "@/lib/members";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Your books",
  robots: { index: false, follow: false },
};

const DISPLAY = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;
const bought = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * "Your books": the books bought with the signed-in email, each with its
 * download link (the same private link the purchase email carries). Where
 * someone who has only bought a book lands after signing in (/account).
 */
export default async function YourBooks() {
  const email = await getSessionEmail();
  if (!email) redirect("/members/login");

  const [books, member, community] = await Promise.all([
    booksForEmail(email),
    getMemberByEmail(email).catch(() => null),
    supabaseAdmin.from("community_profiles").select("user_id", { count: "exact", head: true }).eq("email", email),
  ]);
  const paid = isActive(member);
  const joined = Boolean(community.count);

  return (
    <main className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-text">Your account</p>
      <h1 className="mt-3 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]" style={DISPLAY}>
        Your books
      </h1>
      <p className="mt-5 text-lg leading-relaxed">
        {books.length
          ? "Thank you for reading. Download your books here whenever you need them."
          : "There are no books bought with this email yet."}
      </p>

      {books.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {books.map(({ purchase, product }) => {
            const cover = coverPublicUrl(product.cover_path);
            return (
              <li key={product.id} className="flex gap-4 rounded-2xl border border-gold-line/60 bg-paper p-4 sm:p-5">
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-sand">
                  {cover && <Image src={cover} alt="" fill sizes="80px" className="object-contain" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl leading-snug text-navy" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
                    {product.title}
                  </h2>
                  <p className="mt-1 text-[13px] text-muted">Bought {bought(purchase.created_at)}</p>
                  <a
                    href={`/api/download/${purchase.download_token}`}
                    className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-gold px-5 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
                  >
                    Download the PDF<span className="sr-only">: {product.title}</span>
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6">
          <Link href="/guides" className="font-semibold text-gold-text underline underline-offset-4">
            See the books
          </Link>
        </p>
      )}

      <p className="mt-6 text-sm leading-relaxed text-muted">
        Signed in as <span className="break-words text-navy">{email}</span>. A download not working, or a book missing?
        Write to{" "}
        <a href="mailto:info@faithfulpathcommunity.com" className="text-gold-text underline underline-offset-4">
          info@faithfulpathcommunity.com
        </a>
        .
      </p>

      {(!joined || !paid) && (
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {!joined && (
            <Link href="/community" className="block rounded-2xl bg-navy p-5 transition-colors hover:bg-night">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-soft">Free</p>
              <p className="mt-2 text-xl text-sun" style={DISPLAY}>
                Join the free community
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-sand">Prayer, a weekly gathering, and letters from Pastor Richmond.</p>
              <span className="mt-3 inline-block font-semibold text-gold-soft">Join free ›</span>
            </Link>
          )}
          {!paid && (
            <Link href="/membership" className="block rounded-2xl border border-gold-line/60 bg-paper p-5 transition-colors hover:border-gold-line">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-text">US$19 a month</p>
              <p className="mt-2 text-xl text-navy" style={DISPLAY}>
                See the membership
              </p>
              <p className="mt-2 text-[15px] leading-relaxed">Five Christian courses with Pastor Richmond. Cancel any time.</p>
              <span className="mt-3 inline-block font-semibold text-gold-text">See the membership ›</span>
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
