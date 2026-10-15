/**
 * Stands in for a lesson video until one is recorded. The lesson text is the
 * whole content for now, so this only marks that something is coming rather
 * than implying anything is missing.
 */
export default function VideoPlaceholder() {
  return (
    <div className="mt-10 flex aspect-video w-full items-center justify-center rounded-xl border border-line bg-sand">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
        Video coming soon
      </p>
    </div>
  );
}
