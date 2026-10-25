import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import JoinForm from "@/components/community/JoinForm";
import { DISPLAY } from "@/components/community/styles";
import { getSessionEmail } from "@/lib/auth";
import { makeFormStamp } from "@/lib/form-stamp";
import { COMMUNITY_HOME, COMMUNITY_JOIN } from "@/lib/community";

export const metadata: Metadata = {
  title: "Community sign in",
  robots: { index: false, follow: false },
};

export default async function CommunitySignIn() {
  await connection();
  if (await getSessionEmail()) redirect(COMMUNITY_HOME);

  return (
    <main className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-20">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-text">Faithful Path Community</p>
      <h1 className="mt-3 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]" style={DISPLAY}>
        Sign in
      </h1>
      <p className="mt-5 text-lg leading-relaxed">
        Use the email you joined with, or the one you pay for the membership with. We will email you a 6-digit code.
      </p>
      <JoinForm mode="sign-in" stamp={makeFormStamp()} restartHref="/community/sign-in" />
      <p className="mt-8 text-sm text-muted">
        Not joined yet?{" "}
        <Link href={COMMUNITY_JOIN} className="font-semibold text-gold-text underline underline-offset-4">
          Join free
        </Link>
        . A code is only sent to an address that has joined.
      </p>
    </main>
  );
}
