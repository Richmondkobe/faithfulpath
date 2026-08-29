import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import DeleteProduct from "@/components/admin/DeleteProduct";
import { getProductById } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";
import { claimUrlFor } from "@/lib/claim";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const claimUrl = claimUrlFor(product.slug);

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {product.title}
      </h1>
      <ProductForm
        product={product}
        coverUrl={coverPublicUrl(product.cover_path)}
      />
      <div className="mt-16 max-w-2xl border-t border-[#E5D9C7] pt-10">
        <p
          className="text-lg text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Give this guide away
        </p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#6B5F53]">
          Anyone with this link gets the guide free, without going through
          checkout. It is specific to this guide, and it does not expire —
          rotating GUIDE_CLAIM_SECRET invalidates every claim link at once.
        </p>
        {claimUrl ? (
          <code className="mt-4 block overflow-x-auto rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-4 py-3 text-sm text-[#2B2118]">
            {claimUrl}
          </code>
        ) : (
          <p className="mt-4 text-sm text-[#8B3A2E]">
            GUIDE_CLAIM_SECRET is not set, so no claim link can be generated.
          </p>
        )}
      </div>

      <DeleteProduct id={product.id} title={product.title} />
    </main>
  );
}
