import type { AudioScript } from "@/lib/course";

/**
 * The guided prayer recording. When it is not yet made, a one-line note is all
 * that appears — the written prayer follows immediately below, so there is no
 * gap to fill, and the script is never shown to a member.
 */
export default function AudioBlock({
  audio,
  src,
}: {
  audio: AudioScript;
  src: string | null;
}) {
  if (!src) {
    return (
      <p className="mt-4 text-sm text-[#6B5F53]">
        Audio coming soon{audio.length ? ` · ${audio.length}` : ""}. The prayer
        below is the same one, to read.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <audio controls preload="none" className="w-full">
        <source src={src} type="audio/mpeg" />
        Your browser cannot play this audio.
      </audio>
      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        {audio.title}
        {audio.length ? ` · ${audio.length}` : ""}
      </p>
    </div>
  );
}
