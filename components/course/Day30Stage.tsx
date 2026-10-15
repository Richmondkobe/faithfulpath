"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CertificateButton from "@/components/course/CertificateButton";
import { saveDay30, saveCertificateName } from "@/app/members/courses/actions";

/**
 * The second stage of Lesson 28. It opens thirty days after the first checkbox,
 * or whenever the member says their month is done — plenty will have begun the
 * plan before they ever reached this page, and only they know the date.
 */
export default function Day30Stage({
  courseSlug,
  lessonSlug,
  finalAction,
  finalDoneLabel,
  available,
  finalDone,
  opensOn,
  certificateName,
}: {
  courseSlug: string;
  lessonSlug: string;
  finalAction: string;
  finalDoneLabel: string;
  available: boolean;
  finalDone: boolean;
  opensOn: string | null;
  certificateName: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(available);
  const [done, setDone] = useState(finalDone);
  const [name, setName] = useState(certificateName ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const saveName = () =>
    startTransition(async () => {
      try {
        await saveCertificateName(courseSlug, lessonSlug, name);
        setNameSaved(true);
      } catch {
        setError("Your name could not be saved. Please try again.");
      }
    });

  return (
    <section className="mt-16 border-t border-line pt-10">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
        Day 30
      </p>
      <h2
        className="mt-2 text-2xl text-navy"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
      >
        Complete the course
      </h2>

      {!open ? (
        <div className="mt-4 rounded-xl border border-line bg-sand px-5 py-5">
          <p className="leading-relaxed text-ink">
            This stage opens a month after you started the plan
            {opensOn ? ` — around ${opensOn}` : ""}. If your month is already
            done, you can open it now.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await saveDay30(courseSlug, lessonSlug, { monthComplete: true });
                  setOpen(true);
                  router.refresh();
                } catch {
                  setError("That could not be saved. Please try again.");
                }
              })
            }
            className="mt-4 inline-flex items-center justify-center rounded-xl border-[1.5px] border-navy px-6 py-3 text-[15px] font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text disabled:opacity-60"
          >
            My month is complete
          </button>
        </div>
      ) : (
        <>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            {finalAction}
          </p>
          {/* Needed only for the certificate — a member can finish the course
              without giving a name. */}
          <div id="certificate-name" className="mt-8 scroll-mt-24">
            <label
              htmlFor="certificate-name-input"
              className="block text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium"
            >
              Your name as you would like it on your certificate
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              <input
                id="certificate-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameSaved(false);
                }}
                onBlur={() => name.trim() && saveName()}
                placeholder="As you would like it printed"
                className="min-w-0 flex-1 rounded-xl border border-field bg-white px-4 py-3 text-sm text-navy outline-none placeholder:text-placeholder focus:border-gold-text"
              />
              <button
                type="button"
                onClick={saveName}
                disabled={pending || !name.trim()}
                className="rounded-xl border-[1.5px] border-navy px-5 py-3 text-sm font-semibold text-navy transition-colors hover:border-gold-text hover:text-gold-text disabled:opacity-60"
              >
                Save name
              </button>
            </div>
            {nameSaved && !pending && (
              <p className="mt-2 text-sm text-muted">Saved.</p>
            )}
          </div>

          <label
            className={`mt-6 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 text-sm leading-relaxed ${
              done ? "border-gold-text bg-sand" : "border-field"
            }`}
          >
            <input
              type="checkbox"
              checked={done}
              disabled={pending}
              onChange={() => {
                const next = !done;
                setDone(next);
                startTransition(async () => {
                  try {
                    await saveDay30(courseSlug, lessonSlug, { finalDone: next });
                    router.refresh();
                  } catch {
                    setDone(!next);
                    setError("That could not be saved. Please try again.");
                  }
                });
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-gold-text"
            />
            <span className="text-navy">{finalDoneLabel}</span>
          </label>
          {done && (
            <div className="mt-4">
              <p className="text-sm text-muted">
                The course is marked complete.
              </p>
              <CertificateButton
                courseSlug={courseSlug}
                name={name.trim() || null}
                nameFieldHref="#certificate-name"
                className="mt-4"
              />
            </div>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
