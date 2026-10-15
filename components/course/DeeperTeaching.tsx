export default function DeeperTeaching({ children }: { children: React.ReactNode }) {
  return (
    <details className="group mt-12 border-t border-line pt-8">
      <summary className="cursor-pointer list-none">
        <span className="inline-flex items-center gap-2 text-xl text-navy transition-colors group-hover:text-gold-text" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          <span aria-hidden="true" className="text-gold-text transition-transform group-open:rotate-90">›</span>
          Read the deeper teaching
        </span>
        <span className="mt-1 block text-sm text-muted">
          The full chapter. The lesson above is the condensed version.
        </span>
      </summary>
      <div className="border-t border-line">{children}</div>
    </details>
  );
}
