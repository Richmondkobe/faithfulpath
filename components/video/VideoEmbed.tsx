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
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold shadow-lg ring-4 ring-night/30 transition-transform group-hover:scale-105 sm:h-20 sm:w-20">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-1 h-7 w-7 fill-night sm:h-8 sm:w-8">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
