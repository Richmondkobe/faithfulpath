import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import JoinForm from "@/components/community/JoinForm";
import { DISPLAY } from "@/components/community/styles";
import { getSessionEmail } from "@/lib/auth";
import { makeFormStamp } from "@/lib/form-stamp";
import { COMMUNITY_HOME, COMMUNITY_SIGN_IN } from "@/lib/community";

export const metadata: Metadata = {
  title: "Join the community",
  robots: { index: false, follow: false },
};

export default async function CommunityJoin() {
  // A fresh stamp for each visit (lib/form-stamp.ts).
  await connection();
  if (await getSessionEmail()) redirect(COMMUNITY_HOME);

  return (
    <main className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-20">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-text">Faithful Path Community</p>
      <h1 className="mt-3 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]" style={DISPLAY}>
        Join free
      </h1>
      <p className="mt-5 text-lg leading-relaxed">
        Tell us a little about yourself, and we will email you a 6-digit code to type in. There is no password and
        no card.
      </p>
      <JoinForm mode="join" stamp={makeFormStamp()} restartHref="/community/join" />
      <p className="mt-8 text-sm text-muted">
        Already joined, or a member of the membership?{" "}
        <Link href={COMMUNITY_SIGN_IN} className="font-semibold text-gold-text underline underline-offset-4">
          Sign in
        </Link>
        . Only your first name is ever shown, and only on prayer requests you choose to share with your name. See the{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
