import Image from "next/image";
import Link from "next/link";
import { listProducts } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/products";
import { requireAdmin } from "@/lib/auth";

export default async function Admin() {
  // Checked here as well as in the layout: a layout does not stop its pages
  // rendering on their own, and these read with the service-role key.
  await requireAdmin();
  const products = await listProducts();

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1
          className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Guides
        </h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-night transition-colors hover:bg-gold-soft"
        >
          New guide
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-12 leading-relaxed text-muted">
          Nothing here yet. Start with the first guide.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-line border-y border-line">
          {products.map((p) => {
            const cover = coverPublicUrl(p.cover_path);
            return (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div className="flex min-w-0 items-center gap-5">
                <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-sand">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-center text-[9px] uppercase leading-tight tracking-[0.14em] text-muted font-medium">
                      No
                      <br />
                      cover
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-lg text-navy"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                    }}
                  >
                    {p.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    /guides/{p.slug}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-sm text-ink">
                  {formatPrice(p.price_cents)}
                </span>
                <span
                  className={
                    "rounded-xl px-2 py-1 text-[11px] uppercase tracking-[0.18em] font-medium " +
                    (p.published
                      ? "bg-line text-gold-text"
                      : "bg-sand text-muted")
                  }
                >
                  {p.published ? "Published" : "Draft"}
                </span>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-gold-text"
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
