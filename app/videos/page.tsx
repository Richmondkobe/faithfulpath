import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import VideoEmbed from "@/components/video/VideoEmbed";
import { abs, breadcrumbs, graph, orgRef } from "@/lib/schema";
import { socialMeta } from "@/lib/social-meta";
import { VIDEOS, videoSchema } from "@/lib/videos";

const TITLE = "Videos";
const DESCRIPTION =
  "Teaching videos from Pastor Richmond Kobe, from the Before You Say Yes series on Christian dating.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/videos" },
  ...socialMeta({ title: TITLE, description: DESCRIPTION, path: "/videos" }),
};

// Every video in lib/videos.ts, in its order there.
export default function VideosPage() {
  const schema = graph(
    ...VIDEOS.map((v) => videoSchema(v, abs, orgRef)),
    breadcrumbs([{ name: "Home", path: "/" }, { name: TITLE }])
  );

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 break-words sm:pt-24">
      <JsonLd data={schema} />

      <Link
        href="/"
        className="text-[13px] uppercase tracking-[0.12em] text-gold-text font-medium"
      >
        ← Home
      </Link>

      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {TITLE}
      </h1>

      <ul className="mt-10 space-y-14">
        {VIDEOS.map((v, i) => (
          <li key={v.id}>
            <VideoEmbed video={v} priority={i === 0} />
            <h2
              className="mt-5 text-[1.5rem] leading-snug text-navy"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {v.title}
            </h2>
            {v.book === "before-you-say-yes" && (
              <Link
                href="/guides/before-you-say-yes"
                className="mt-3 inline-flex min-h-11 items-center text-[15px] font-medium text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
              >
                From the book Before You Say Yes →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
