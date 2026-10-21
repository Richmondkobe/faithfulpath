"use client";

import Image from "next/image";
import { useState } from "react";
import { videoThumbnail, type Video } from "@/lib/videos";

/**
 * A YouTube video that costs nothing until it is wanted: the thumbnail (served
 * from this site) and a play button, and the player from youtube-nocookie.com
 * only once the button is pressed. No events are recorded.
 */
export default function VideoEmbed({ video, priority = false }: { video: Pick<Video, "id" | "title">; priority?: boolean }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-night">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${video.title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          <Image
            src={videoThumbnail(video.id)}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 768px) 42rem, 100vw"
            className="object-cover"
          />
          <span className="absolute inset-0 bg-night/20 transition-colors group-hover:bg-night/10" />
          {/* In the bottom-right corner, clear of the title words on the
              thumbnails. The whole picture is the button, so the tap area is
              far larger than the circle. */}
          <span className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold shadow-lg ring-4 ring-night/30 transition-transform group-hover:scale-105 sm:bottom-4 sm:right-4 sm:h-14 sm:w-14">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-0.5 h-6 w-6 fill-night sm:h-7 sm:w-7">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
