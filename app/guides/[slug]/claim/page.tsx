import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ClaimForm from "@/components/ClaimForm";
import { verifyClaimKey } from "@/lib/claim";
import { getPublishedProductBySlug } from "@/lib/products-db";
import { coverPublicUrl } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Your guide | Faithful Path Community",
  robots: { index: false, follow: false },
};

export default async function Claim({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { slug } = await params;
  const { key } = await searchParams;

  // A bad key 404s rather than 403s, so probing cannot confirm that a claim
  // page exists for this guide.
  if (!verifyClaimKey(slug, key)) notFound();

  const guide = await getPublishedProductBySlug(slug);
  if (!guide?.pdf_path) notFound();

  const cover = coverPublicUrl(guide.cover_path);

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        A gift
      </p>
      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[2.75rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        {guide.title}
      </h1>

      {guide.subtitle && (
        <p
          className="mt-4 max-w-xl text-lg leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
        >
          {guide.subtitle}
        </p>
      )}

      <div className="mt-10 flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-12">
        {cover && (
          <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-sm border border-[#E5D9C7] bg-[#F3EADC]">
            <Image
              src={cover}
              alt={guide.title}
              fill
              sizes="10rem"
              className="object-contain"
            />
          </div>
        )}

        <div className="min-w-0">
          <p className="max-w-lg leading-relaxed">
            This copy is free — there is nothing to pay. Leave your email and
            the download will appear straight away.
          </p>
          <ClaimForm slug={slug} claimKey={key!} title={guide.title} />
        </div>
      </div>
    </main>
  );
}
