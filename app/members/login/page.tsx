import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import MemberLoginForm from "@/components/MemberLoginForm";
import { getSessionEmail } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, string> = {
  link: "That sign-in link was incomplete. Ask for a new code below and type it in.",
  expired:
    "That sign-in link has expired or was already used. Ask for a new code below and type it in.",
};

export default async function MemberLogin({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string; next?: string }>;
}) {
  const { email, error, sent, next } = await searchParams;
  // Where a community page sent them from, if it did (checked again by the actions).
  const nextPath = next && /^\/community(\/[a-z0-9-]+)*$/.test(next) ? next : undefined;
  // Already signed in: /account sends each person to the right place.
  if (await getSessionEmail()) redirect(nextPath ?? "/account");

  // From the membership thank-you page, which has just sent the code.
  const codeSentTo = sent === "1" && email && email.includes("@") ? email.trim().toLowerCase() : undefined;
  const notice = error ? MESSAGES[error] : null;

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-navy sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Sign in
      </h1>
      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        One sign-in for everyone: members, community members and anyone who has
        bought a book or course. Enter your email and we will send you a 6-digit
        code to type in. There is no password to remember.
      </p>

      {notice && (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger"
        >
          {notice}
        </p>
      )}

      <MemberLoginForm defaultEmail={email ?? ""} codeSentTo={codeSentTo} next={nextPath} />

      <p className="mt-10 text-sm leading-relaxed text-muted">
        New here?{" "}
        <Link href="/community/join" className="font-semibold text-gold-text underline underline-offset-4">
          Join the community free
        </Link>{" "}
        or see the{" "}
        <Link href="/membership" className="font-semibold text-gold-text underline underline-offset-4">
          membership
        </Link>
        .
      </p>
    </main>
  );
}
