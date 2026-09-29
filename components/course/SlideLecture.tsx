"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./SlideLecture.module.css";

export type LectureSlide = {
  /** The illustration to draw, by name. Unknown names draw nothing. */
  art?: string;
  kicker?: string;
  title?: string;
  sub?: string;
  body?: string[];
  chips?: string[];
  list?: string[];
  quote?: string;
  ref?: string;
  prayer?: string[];
  note?: string;
  /** Stop the recording at the end of this slide and wait for Play. */
  autoPause?: boolean;
};

export type LectureSlides = {
  slides: LectureSlide[];
  /** Where each slide begins, in seconds into the recording. */
  timings: number[];
};

/**
 * Lesson 1's slides, advancing with its recording.
 *
 * The same approach as When Your Mind Won't Rest's player — the recording
 * decides which slide is showing, arrows and a tap on either half move by hand,
 * and everything said is also in the transcript below, so a reader who never
 * presses play loses nothing. It is a separate component rather than a change
 * to that one because the slides are a different shape entirely: these carry a
 * kicker, a title, prose, chips, a list, a quotation and an illustration name,
 * where those carry one blob of markup. Twenty-one shipped lessons are not
 * worth risking to share a transport.
 *
 * Two differences beyond the shape. Start times come from a `timings` array
 * beside the slides rather than from a field on each slide. And the pause is
 * declared by the slide that wants it — `autoPause` — rather than passed in by
 * number, which means the slide asking the learner to stop is the slide that
 * stops the recording, and moving the slides around cannot separate them.
 *
 * It stores nothing. No progress, no position, nothing in the browser: reload
 * the page and it starts at the first slide, like the rest of this course.
 */
export default function SlideLecture({
  slides,
  timings,
  audioUrl,
  lessonTitle,
  art,
}: LectureSlides & {
  audioUrl: string | null;
  lessonTitle: string;
  /**
   * The illustration for a slide's `art` name. Passed in rather than imported,
   * because each course draws its own set and two of them use the same names
   * for different pictures.
   */
  art: (key: string | undefined) => ReactNode;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);

  // A manual move sets the time itself, and the timeupdate it causes must not
  // undo it. Refs, because the handler reads them on every tick and must see
  // the current value rather than the one captured when the effect last ran.
  const manual = useRef(false);
  const pausedOnce = useRef(false);

  const pauseAt = slides.findIndex((s) => s.autoPause);

  /** Move to a slide, and take the recording with us. */
  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= slides.length) return;
      manual.current = true;
      setCurrent(i);
      setPaused(false);
      const el = audio.current;
      if (el) el.currentTime = timings[i] + 0.05;
      manual.current = false;
    },
    [slides.length, timings]
  );

  useEffect(() => {
    const el = audio.current;
    if (!el) return;

    const onTime = () => {
      if (manual.current || el.paused) return;
      const t = el.currentTime;
      let i = 0;
      for (let k = 0; k < timings.length; k++) if (t >= timings[k]) i = k;

      // Leaving the slide that asked for a pause, for the first time: stop, and
      // stay on the slide that asked, with the recording queued at the next.
      // Once played through, it never interrupts again, so somebody returning
      // to the lesson is not stopped a second time.
      if (pauseAt >= 0 && i === pauseAt + 1 && !pausedOnce.current) {
        pausedOnce.current = true;
        el.pause();
        el.currentTime = timings[pauseAt + 1];
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
  }, [timings, pauseAt]);

  // Arrow keys move between slides; space plays and pauses.
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
        className={styles.stage}
        // The pilot turns the page by tapping a half of the slide. Keyboard
        // users have the arrows and the Back/Next buttons below.
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          go(e.clientX - r.left > r.width / 2 ? current + 1 : current - 1);
        }}
        aria-live="polite"
        role="region"
        aria-label={`${lessonTitle}: slide ${current + 1} of ${slides.length}`}
      >
        <div className={styles.art} key={`art-${current}`}>
          {art(slide.art)}
        </div>

        <div className={styles.words}>
          {slide.kicker && <p className={styles.kicker}>{slide.kicker}</p>}
          {slide.title && <h3 className={styles.title}>{slide.title}</h3>}

          {slide.quote && <blockquote>{slide.quote}</blockquote>}
          {slide.ref && <p className={styles.ref}>{slide.ref}</p>}

          {slide.body?.map((line) => <p key={line}>{line}</p>)}

          {slide.chips && (
            <ol className={styles.chips}>
              {slide.chips.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
          )}

          {slide.list && (
            <ul>
              {slide.list.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}

          {slide.prayer && (
            <div className={styles.prayer}>
              {slide.prayer.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}

          {slide.sub && <p className="sub">{slide.sub}</p>}
          {slide.note && <p className={styles.note}>{slide.note}</p>}

          {paused && (
            <p className={styles.pausedNote} role="status">
              Paused for reflection. Press play when you are ready.
            </p>
          )}
        </div>
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
              key={timings[i]}
              type="button"
              className={`${styles.dot} ${i === current ? styles.dotOn : ""}`}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}${s.kicker ? `: ${s.kicker}` : ""}`}
              aria-current={i === current ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
