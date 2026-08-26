import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import DeleteProduct from "@/components/admin/DeleteProduct";
import { getProductById } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

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
      <DeleteProduct id={product.id} title={product.title} />
    </main>
  );
}
