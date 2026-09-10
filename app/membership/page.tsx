import type { Metadata } from "next";

// Placeholder copy throughout — final wording to come.
export const metadata: Metadata = {
  title: "Membership | Faithful Path Community",
  description: "Placeholder description for the monthly membership.",
  alternates: { canonical: "/membership" },
};

export default function Membership() {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Membership
      </p>
      <h1
        className="mt-4 text-[2.25rem] leading-[1.1] tracking-[-0.02em] text-[#2B2118] sm:text-[3rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Join the membership
      </h1>

      <p
        className="mt-6 text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        Placeholder introduction. This is where the description of what the
        membership includes will go, once the final wording is written.
      </p>

      <form action="/api/membership/checkout" method="POST" className="mt-10">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34]"
        >
          Join for US$19/month
        </button>
      </form>

      <p className="mt-6 text-sm leading-relaxed text-[#6B5F53]">
        Cancel any time from your account. Placeholder line about billing.
      </p>

      <div className="mt-16 border-t border-[#E5D9C7] pt-10">
        <p className="text-sm leading-relaxed text-[#6B5F53]">
          Already a member?{" "}
          <a
            href="/members/login"
            className="text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
          >
            Sign in
          </a>{" "}
          with the email you paid with.
        </p>
      </div>
    </main>
  );
}
