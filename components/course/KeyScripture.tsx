export default function KeyScripture({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-6 py-5">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Key Scripture
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
