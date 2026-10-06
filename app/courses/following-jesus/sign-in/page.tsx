import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MemberLoginForm from "@/components/MemberLoginForm";
import { getSessionEmail } from "@/lib/auth";
import { SERIES_PATH } from "@/lib/following-jesus";

export const metadata: Metadata = {
  title: "Sign in | Following Jesus | Faithful Path Community",
  robots: { index: false, follow: false },
};

/** Only a page inside the series; anything else goes to the series home. */
function safeNext(next: string | undefined): string {
  return next && /^\/courses\/following-jesus(\/[a-z0-9-]+)*$/.test(next) ? next : SERIES_PATH;
}

/**
 * The site's own sign-in (email, then a 6-digit code), for the Following Jesus
 * courses. The same form and the same accounts as the membership; it only
 * returns the person to their course instead of to /members.
 */
export default async function FollowingJesusSignIn({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;
  const target = safeNext(next);
  if (await getSessionEmail()) redirect(target);

  const here = `${SERIES_PATH}/sign-in?next=${encodeURIComponent(target)}`;

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">Following Jesus</p>
      <h1
        className="mt-3 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Sign in to your course
      </h1>
      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Use the email address you paid with. We will email you a 6-digit code to
        type in — there is no password to remember.
      </p>

      <MemberLoginForm defaultEmail={email ?? ""} next={target} restartHref={here} />
    </main>
  );
}
