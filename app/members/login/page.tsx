import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MemberLoginForm from "@/components/MemberLoginForm";
import { getSessionEmail } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Member sign in | Faithful Path Community",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, string> = {
  link: "That sign-in link was incomplete. Ask for a new one below.",
  expired: "That sign-in link has expired or was already used. Ask for a new one below.",
};

export default async function MemberLogin({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  if (await getSessionEmail()) redirect("/members");

  const { email, error } = await searchParams;
  const notice = error ? MESSAGES[error] : null;

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Member sign in
      </h1>
      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Use the email address you paid with. We will send you a link — there is
        no password to remember.
      </p>

      {notice && (
        <p
          role="alert"
          className="mt-8 rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-4 py-3 text-sm leading-relaxed text-[#8B3A2E]"
        >
          {notice}
        </p>
      )}

      <MemberLoginForm defaultEmail={email ?? ""} />
    </main>
  );
}
