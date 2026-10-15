export default function KeyScripture({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-10 rounded-xl border border-line bg-sand px-6 py-5">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
        Key Scripture
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
