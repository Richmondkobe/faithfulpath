import ArticleBody from "@/components/ArticleBody";
import type { VideoScript } from "@/lib/course";

/**
 * A video, or what stands in for one until it is recorded.
 *
 * Before the file exists the script is shown in full, because it is the lesson
 * content — a member should lose nothing by being early. Once the recording
 * lands, the same words stay as a collapsed transcript.
 */
export default function VideoBlock({
  video,
  src,
}: {
  video: VideoScript;
  src: string | null;
}) {
  if (src) {
    return (
      <section className="mt-10">
        <video
          controls
          preload="metadata"
          className="w-full rounded-sm border border-[#E5D9C7] bg-[#2B2118]"
        >
          <source src={src} type="video/mp4" />
          Your browser cannot play this video.
        </video>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          {video.title}
          {video.length ? ` · ${video.length}` : ""}
        </p>
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-sm text-[#8B5E34] underline underline-offset-4">
            Read the transcript
          </summary>
          <div className="border-l-2 border-[#E5D9C7] pl-5">
            <ArticleBody source={video.script} />
          </div>
        </details>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <div className="flex aspect-video w-full items-center justify-center rounded-sm border border-[#E5D9C7] bg-[#F3EADC]">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Video coming soon
        </p>
      </div>
      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {video.title}
        {video.length ? ` · ${video.length}` : ""}
      </p>

      <h3
        className="mt-6 text-xl text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        What Richmond says in this video
      </h3>
      <ArticleBody source={video.script} />
    </section>
  );
}
