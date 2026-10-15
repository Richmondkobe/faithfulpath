import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import DeleteProduct from "@/components/admin/DeleteProduct";
import { getProductById } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";
import { claimUrlFor } from "@/lib/claim";
import { requireAdmin } from "@/lib/auth";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Checked here as well as in the layout: a layout does not stop its pages
  // rendering on their own, and these read with the service-role key.
  await requireAdmin();
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const claimUrl = claimUrlFor(product.slug);

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {product.title}
      </h1>
      <ProductForm
        product={product}
        coverUrl={coverPublicUrl(product.cover_path)}
      />
      <div className="mt-16 max-w-2xl border-t border-line pt-10">
        <p
          className="text-lg text-navy"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Give this guide away
        </p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          Anyone with this link gets the guide free, without going through
          checkout. It is specific to this guide, and it does not expire —
          rotating GUIDE_CLAIM_SECRET invalidates every claim link at once.
        </p>
        {claimUrl ? (
          <code className="mt-4 block overflow-x-auto rounded-xl border border-line bg-sand px-4 py-3 text-sm text-navy">
            {claimUrl}
          </code>
        ) : (
          <p className="mt-4 text-sm text-danger">
            GUIDE_CLAIM_SECRET is not set, so no claim link can be generated.
          </p>
        )}
      </div>

      <DeleteProduct id={product.id} title={product.title} />
    </main>
  );
}
