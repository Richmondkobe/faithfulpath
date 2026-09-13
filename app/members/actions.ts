"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/stripe";

export type MemberLoginState = { error: string | null; sent: string | null };
export type MemberCodeState = { error: string | null };

/**
 * Sends the 6-digit sign-in code. Deliberately says the same thing whether or
 * not the address has a membership — this form is public, and the reply should
 * not confirm who has paid. A member who used a different address finds that
 * out on /members, where they are signed in and can be told properly.
 *
 * The same email also carries a link. On mobile the email app often opens that
 * link in a different browser from the one that asked for it, and the PKCE
 * verifier lives in the asking browser's cookies — so the link is only a
 * convenience for same-browser sign-ins. The code is what always works.
 */
export async function sendMemberLink(
  _prev: MemberLoginState,
  formData: FormData
): Promise<MemberLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Enter the email address you paid with.", sent: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/members`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("Member sign-in code failed:", error.message);
    return {
      error: "Could not send the code just now. Please try again in a moment.",
      sent: null,
    };
  }

  return { error: null, sent: email };
}

/**
 * Exchanges the 6-digit code for a session. Unlike the emailed link this needs
 * nothing from the browser that asked for the code, so it works when the email
 * is read on a phone and the code typed in whichever browser is to hand.
 */
export async function verifyMemberCode(
  _prev: MemberCodeState,
  formData: FormData
): Promise<MemberCodeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  // People paste the code with a stray space, and some mail clients hyphenate it.
  const token = String(formData.get("token") ?? "").replace(/\D/g, "");

  if (!email || !email.includes("@")) {
    return { error: "Start again below and we will send a fresh code." };
  }

  if (token.length !== 6) {
    return { error: "Enter the 6-digit code from your email." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    console.error("Member code sign-in failed:", error.message);
    return {
      error:
        "That code did not work. It may have expired or been used already — ask for a new one.",
    };
  }

  redirect("/members");
}

export async function memberLogout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/membership");
}
