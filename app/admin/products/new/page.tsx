import ProductForm from "@/components/admin/ProductForm";

export default function NewProduct() {
  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        New guide
      </h1>
      <ProductForm />
    </main>
  );
}
