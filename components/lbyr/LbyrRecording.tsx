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
      <div className="rounded-sm border border-dashed border-[#D9CDBA] bg-[#FDFAF4] px-5 py-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Recording coming soon
        </p>
        <p className="mt-2 text-[17px] leading-relaxed text-[#4A4038]">
          The teaching for this lesson has not been recorded yet. The full
          transcript is below, and the recording will appear here when it is
          ready.
        </p>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-[#6B5F53]">{duration}</p>

      <details className="mt-4 border-t border-[#E5D9C7]">
        <summary className="flex cursor-pointer justify-between py-4 text-[13px] uppercase tracking-[0.14em] text-[#8B5E34]">
          Read the transcript
        </summary>
        <div className="max-w-[65ch] pb-3">
          <Blocks blocks={transcript} />
        </div>
      </details>
    </>
  );
}
