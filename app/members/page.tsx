import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive, needsBilling } from "@/lib/members";
import { memberLogout } from "@/app/members/actions";

export const metadata: Metadata = {
  title: "Members | Faithful Path Community",
  robots: { index: false, follow: false },
};

function ManageBilling() {
  return (
    <form action="/api/membership/portal" method="POST">
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-sm border border-[#D9CDBA] px-6 py-3 text-[15px] font-medium text-[#2B2118] transition-colors hover:border-[#8B5E34] hover:text-[#8B5E34]"
      >
        Manage billing
      </button>
    </form>
  );
}

export default async function Members() {
  const email = await getSessionEmail();

  // Not signed in at all — nothing here to explain yet.
  if (!email) redirect("/membership");

  const member = await getMemberByEmail(email);

  // Signed in, but this address has no live membership. Say so plainly: a
  // silent bounce to /membership would look like the payment never worked.
  if (!isActive(member)) {
    return (
      <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
        <h1
          className="text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          {needsBilling(member) ? "Your payment did not go through" : "No membership on this email"}
        </h1>

        <p
          className="mt-6 text-lg leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
        >
          You are signed in as{" "}
          <span className="break-words text-[#2B2118]">{email}</span>.{" "}
          {needsBilling(member)
            ? "Update your card and the membership will pick up where it left off."
            : "There is no active membership attached to this address. If you paid with a different one, sign out and sign back in with that address."}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          {member?.stripe_customer_id ? (
            <ManageBilling />
          ) : (
            <Link
              href="/membership"
              className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
            >
              See the membership
            </Link>
          )}
          <form action={memberLogout}>
            <button
              type="submit"
              className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#8B5E34]"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Members
      </p>
      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Welcome to the membership
      </h1>

      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Placeholder copy. Course pages arrive here later.
      </p>

      {member?.cancel_at_period_end && member.current_period_end && (
        <p className="mt-8 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-5 py-4 text-sm leading-relaxed text-[#6B5F53]">
          Your membership is set to end on{" "}
          {new Date(member.current_period_end).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric",
          })}
          . You keep access until then.
        </p>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-[#E5D9C7] pt-10">
        <ManageBilling />
        <form action={memberLogout}>
          <button
            type="submit"
            className="text-sm text-[#5C5147] underline underline-offset-4 transition-colors hover:text-[#8B5E34]"
          >
            Sign out
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-[#6B5F53]">
        Signed in as <span className="break-words">{email}</span>.
      </p>
    </main>
  );
}
