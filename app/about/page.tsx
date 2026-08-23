import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COUNTRIES, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | Faithful Path Community",
  description:
    "Richmond — pastor of more than twenty years across ten countries, author of eighteen books.",
};

export default function About() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        About
      </h1>

      <div className="mt-12 grid gap-10 sm:grid-cols-[1fr_1.4fr] sm:items-start">
        <div className="relative aspect-square w-full max-w-[16rem] overflow-hidden rounded-sm">
          <Image
            src="/richmond.jpg"
            alt="Richmond, pastor at Faithful Path Community"
            fill
            sizes="16rem"
            className="object-cover"
          />
        </div>

        <div className="space-y-5 text-lg leading-relaxed">
          <p>
            My name is Richmond. I hold a degree in theology and I have pastored
            for more than twenty years — in Canada and the United States, across
            West and East Africa, and through Southeast Asia.
          </p>
          <p>
            In that time I have counselled well over a thousand individuals and
            couples: engaged couples preparing to marry, families coming apart,
            people carrying grief they cannot put down, and pastors quietly
            running on empty.
          </p>
          <p>
            I have written eighteen books on spiritual growth and personal
            development. But the work I care most about has always happened in a
            room with one person, telling the truth.
          </p>
        </div>
      </div>

      <div className="mt-14 border-y border-[#E5D9C7] py-8">
        <p className="text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#7C7065]">
          {COUNTRIES.join(" · ")}
        </p>
      </div>

      <div className="mt-14">
        <p
          className="text-xl leading-snug text-[#2B2118]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          If you would like to talk, I keep hours for exactly that.
        </p>
        <Link
          href="/talk-to-a-pastor"
          className="mt-6 inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          Talk to a pastor — {SITE.price}
        </Link>
      </div>
    </main>
  );
}
