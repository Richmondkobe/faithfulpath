import type { Block } from "@/lib/lbyr-html";
import Blocks from "@/components/lbyr/Blocks";

/**
 * Watch or listen, before the recordings exist.
 *
 * The teaching for this course has not been recorded yet. Rather than hide the
 * section until it has, the player says so plainly and the transcript sits
 * underneath — every word of the lesson is here to read, so the lesson works
 * today and gains audio later.
 *
 * When the recordings arrive they go to the course-media bucket at
 * audio/lead-before-youre-ready/lbyr-lesson-NN.mp3, with slides and timings
 * added exactly as When Your Mind Won't Rest does, and this placeholder is
 * replaced by SlidePlayer.
 */
export default function LbyrRecording({
  duration,
  transcript,
}: {
  duration: string;
  transcript: Block[];
}) {
  return (
    <>
      <div className="rounded-xl border border-dashed border-field bg-cream px-5 py-6">
        <p className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium">
          Recording coming soon
        </p>
        <p className="mt-2 text-[17px] leading-relaxed text-ink">
          The teaching for this lesson has not been recorded yet. The full
          transcript is below, and the recording will appear here when it is
          ready.
        </p>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{duration}</p>

      <details className="mt-4 border-t border-line">
        <summary className="flex cursor-pointer justify-between py-4 text-[13px] uppercase tracking-[0.14em] text-gold-text font-medium">
          Read the transcript
        </summary>
        <div className="max-w-[65ch] pb-3">
          <Blocks blocks={transcript} />
        </div>
      </details>
    </>
  );
}
