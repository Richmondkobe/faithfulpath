import { LBYR_LESSON_COUNT } from "@/lib/lbyr-links";

/**
 * The ten-segment course progress bar.
 *
 * It counts lessons *completed*, not the one being read, so it is empty on
 * Lesson 1 until that lesson is finished — which is what the preview pages
 * show and what the label says. The segments are decoration; the sentence
 * above them is what a screen reader gets.
 */
export default function LbyrProgress({ completed }: { completed: number }) {
  const done = Math.max(0, Math.min(LBYR_LESSON_COUNT, completed));
  return (
    <div className="mt-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Course progress: {done} of {LBYR_LESSON_COUNT} lessons completed
      </p>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {Array.from({ length: LBYR_LESSON_COUNT }, (_, i) => (
          <i
            key={i}
            className={`h-1.5 flex-1 rounded-sm ${
              i < done ? "bg-[#8B5E34]" : "bg-[#E5D9C7]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
