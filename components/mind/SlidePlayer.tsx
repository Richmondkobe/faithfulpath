"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./SlidePlayer.module.css";

export type Slide = {
  label: string;
  h: string;
  /** The slide's markup, including its inline SVG. */
  body: string;
  dark: boolean;
  /** When this slide begins, in seconds into the recording. */
  t: number;
};

/**
 * A lesson's slides, advancing with its recording.
 *
 * Ported from each lesson's pilot page rather than rebuilt: the pilot is what
 * the slides were timed against, and its behaviour — when a slide turns, where
 * the pause falls, which half of the screen goes back — is what was reviewed.
 *
 * The pause is the part worth reading twice. Once, and only the first time, the
 * recording stops at the end of slide 10, which asks the member to write one
 * sentence. It stops at the end rather than the beginning so they hear the
 * instruction before the silence. Pressing play carries on; having played
 * through it once, it never interrupts again, so somebody returning to the
 * lesson is not stopped a second time.
 *
 * Everything the slides say is also in the transcript below the player, so a
 * reader without JavaScript, or who would rather read than listen, loses
 * nothing by never starting it.
 */
export default function SlidePlayer({
  slides,
  audioUrl,
  /** 1-based; the slide the recording pauses after. */
  pauseAfterSlide = 10,
  lessonTitle,
}: {
  slides: Slide[];
  audioUrl: string | null;
  pauseAfterSlide?: number;
  lessonTitle: string;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  // Manual moves set the time themselves, and the resulting timeupdate must
  // not undo them. `pausedOnce` is a ref because the timeupdate handler reads
  // it on every tick and must see the current value, not the one captured when
  // the effect last ran.
  const manual = useRef(false);
  const pausedOnce = useRef(false);

  const pauseAt = pauseAfterSlide - 1;

  /** Move to a slide, and take the recording with us. */
  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= slides.length) return;
      manual.current = true;
      setCurrent(i);
      setPaused(false);
      const el = audio.current;
      if (el) el.currentTime = slides[i].t + 0.05;
      manual.current = false;
    },
    [slides]
  );

  // The recording decides which slide is showing, except while a manual move
  // is in flight or it is not playing.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;

    const onTime = () => {
      if (manual.current || el.paused) return;
      const t = el.currentTime;
      let i = 0;
      for (let k = 0; k < slides.length; k++) if (t >= slides[k].t) i = k;

      // Leaving the "do this now" slide for the first time: stop, and stay on
      // the slide that asked, with the recording queued at the next one.
      if (i === pauseAt + 1 && !pausedOnce.current) {
        pausedOnce.current = true;
        el.pause();
        el.currentTime = slides[pauseAt + 1].t;
        setPaused(true);
        return;
      }
      setCurrent(i);
    };

    const onSeeking = () => {
      manual.current = false;
    };
    const onPlay = () => setPaused(false);

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("seeking", onSeeking);
    el.addEventListener("play", onPlay);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("seeking", onSeeking);
      el.removeEventListener("play", onPlay);
    };
  }, [slides, pauseAt]);

  // Arrow keys move between slides; space plays and pauses. Both are ignored
  // while the member is typing or using the audio element's own controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
      if (e.key === "ArrowRight") go(current + 1);
      else if (e.key === "ArrowLeft") go(current - 1);
      else if (e.key === " " && tag !== "AUDIO") {
        const a = audio.current;
        if (!a) return;
        e.preventDefault();
        if (a.paused) void a.play();
        else a.pause();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, go]);

  const slide = slides[current];
  if (!slide) return null;

  return (
    <div className={styles.player}>
      <div
        ref={stage}
        className={`${styles.stage} ${slide.dark ? styles.dark : ""}`}
        // The pilot turns the page by tapping a half of the slide. Keyboard
        // users have the arrow keys and the Back/Next buttons below, so this
        // adds nothing they cannot already reach.
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          go(e.clientX - r.left > r.width / 2 ? current + 1 : current - 1);
        }}
        aria-live="polite"
        role="region"
        aria-label={`${lessonTitle}: slide ${current + 1} of ${slides.length}`}
      >
        <p className={`label in`}>{slide.label}</p>
        {slide.h && (
          <h1 className="in2" dangerouslySetInnerHTML={{ __html: slide.h }} />
        )}
        <div dangerouslySetInnerHTML={{ __html: slide.body }} />
        {paused && (
          <p className={styles.pausedNote}>
            The audio is paused. Write your sentence, then press play.
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.row}>
          <b>
            Slide {current + 1} of {slides.length}
          </b>
          <span>
            <button
              type="button"
              className={styles.nav}
              onClick={() => go(current - 1)}
              disabled={current === 0}
              aria-label="Previous slide"
            >
              ‹ Back
            </button>{" "}
            <button
              type="button"
              className={styles.nav}
              onClick={() => go(current + 1)}
              disabled={current === slides.length - 1}
              aria-label="Next slide"
            >
              Next ›
            </button>
          </span>
        </div>

        {audioUrl ? (
          <audio ref={audio} controls preload="metadata" src={audioUrl}>
            Your browser cannot play this recording. The transcript below has
            every word of it.
          </audio>
        ) : (
          <p className={styles.row}>
            The recording is not up yet. The transcript below has every word of
            it, and the slides can be read with Back and Next.
          </p>
        )}

        <div className={styles.dots}>
          {slides.map((s, i) => (
            <button
              key={s.t}
              type="button"
              className={`${styles.dot} ${i === current ? styles.dotOn : ""}`}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}: ${s.label}`}
              aria-current={i === current ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
