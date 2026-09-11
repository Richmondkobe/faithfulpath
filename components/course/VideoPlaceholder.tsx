/**
 * Stands in for a lesson video until one is recorded. The lesson text is the
 * whole content for now, so this only marks that something is coming rather
 * than implying anything is missing.
 */
export default function VideoPlaceholder() {
  return (
    <div className="mt-10 flex aspect-video w-full items-center justify-center rounded-sm border border-[#E5D9C7] bg-[#F3EADC]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Video coming soon
      </p>
    </div>
  );
}
