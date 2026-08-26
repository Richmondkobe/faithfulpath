import Image from "next/image";
import Link from "next/link";
import { listProducts } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/products";

export default async function Admin() {
  const products = await listProducts();

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1
          className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Guides
        </h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-6 py-3 text-sm font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          New guide
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-12 leading-relaxed text-[#6B5F53]">
          Nothing here yet. Start with the first guide.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-[#E5D9C7] border-y border-[#E5D9C7]">
          {products.map((p) => {
            const cover = coverPublicUrl(p.cover_path);
            return (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div className="flex min-w-0 items-center gap-5">
                <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-sm border border-[#E5D9C7] bg-[#F3EADC]">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-center text-[9px] uppercase leading-tight tracking-[0.14em] text-[#A2968A]">
                      No
                      <br />
                      cover
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-lg text-[#2B2118]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                    }}
                  >
                    {p.title}
                  </p>
                  <p className="mt-1 text-sm text-[#6B5F53]">
                    /guides/{p.slug}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-sm text-[#4A4038]">
                  {formatPrice(p.price_cents)}
                </span>
                <span
                  className={
                    "rounded-sm px-2 py-1 text-[11px] uppercase tracking-[0.18em] " +
                    (p.published
                      ? "bg-[#E5D9C7] text-[#8B5E34]"
                      : "bg-[#F3EADC] text-[#6B5F53]")
                  }
                >
                  {p.published ? "Published" : "Draft"}
                </span>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#8B5E34]"
                >
                  Edit
                </Link>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
