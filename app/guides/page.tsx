import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listPublishedProducts } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/products";
import { SITE } from "@/lib/site";

// Saving in the admin calls revalidatePath("/guides"); this is the backstop for
// rows edited directly in Supabase.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Guides | Faithful Path Community",
  description:
    "Short, practical guides on marriage, ministry and faith — written from twenty years of pastoral work.",
};

export default async function Guides() {
  const guides = await listPublishedProducts();

  return (
    <main className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Guides
      </h1>
      <p
        className="mt-5 max-w-xl text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Short, practical guides you can read in an evening and use the same
        week. Written from what people actually bring me.
      </p>

      {guides.length === 0 ? (
        <div className="mt-14 max-w-2xl rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-7 py-10">
          <p
            className="text-xl leading-snug text-[#2B2118]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            The first guide is being written.
          </p>
          <p className="mt-3 max-w-lg leading-relaxed">
            It is coming out of the conversations I am having now, so that it
            answers what people are actually asking rather than what I assume
            they want.
          </p>
        </div>
      ) : (
        <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => {
            const cover = coverPublicUrl(g.cover_path);
            return (
              <li key={g.id}>
                <Link href={`/guides/${g.slug}`} className="group block">
                  {/* Matches the detail page: object-contain so the whole
                      cover shows rather than being cropped. */}
                  <div className="relative aspect-[2/3] overflow-hidden rounded-sm border border-[#E5D9C7] bg-[#F3EADC]">
                    {cover && (
                      <Image
                        src={cover}
                        alt={g.title}
                        fill
                        sizes="(min-width: 1024px) 20rem, (min-width: 640px) 40vw, 90vw"
                        className="object-contain transition-opacity group-hover:opacity-90"
                      />
                    )}
                  </div>
                  <h2
                    className="mt-4 text-xl text-[#2B2118] transition-colors group-hover:text-[#8B5E34]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                    }}
                  >
                    {g.title}
                  </h2>
                  {g.subtitle && (
                    <p className="mt-1 leading-relaxed text-[#6B5F53]">
                      {g.subtitle}
                    </p>
                  )}
                  <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
                    {formatPrice(g.price_cents)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-16 border-t border-[#E5D9C7] pt-10">
        <p
          className="text-xl leading-snug text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Some things need a conversation, not a book.
        </p>
        <Link
          href="/talk-to-a-pastor"
          className="mt-6 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          Talk to a pastor — {SITE.price}
        </Link>
      </div>
    </main>
  );
}
