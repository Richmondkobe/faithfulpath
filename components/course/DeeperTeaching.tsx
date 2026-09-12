export default function DeeperTeaching({ children }: { children: React.ReactNode }) {
  return (
    <details className="group mt-12 border-t border-[#E5D9C7] pt-8">
      <summary className="cursor-pointer list-none">
        <span className="inline-flex items-center gap-2 text-xl text-[#2B2118] transition-colors group-hover:text-[#8B5E34]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          <span aria-hidden="true" className="text-[#8B5E34] transition-transform group-open:rotate-90">›</span>
          Read the deeper teaching
        </span>
        <span className="mt-1 block text-sm text-[#6B5F53]">
          The full chapter. The lesson above is the condensed version.
        </span>
      </summary>
      <div className="border-t border-[#E5D9C7]">{children}</div>
    </details>
  );
}
