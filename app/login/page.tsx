import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in | Faithful Path Community",
  robots: { index: false, follow: false },
};

export default async function Login() {
  if (await isAdmin()) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-20 sm:pt-24">
      <h1
        className="text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Sign in
      </h1>
      <p
        className="mt-5 max-w-xl text-lg leading-relaxed"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        For managing guides. Nothing here for readers.
      </p>

      <LoginForm />
    </main>
  );
}
