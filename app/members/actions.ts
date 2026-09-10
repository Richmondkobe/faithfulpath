"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/stripe";

export type MemberLoginState = { error: string | null; sent: string | null };

/**
 * Sends the sign-in link. Deliberately says the same thing whether or not the
 * address has a membership — this form is public, and the reply should not
 * confirm who has paid. A member who used a different address finds that out on
 * /members, where they are signed in and can be told properly.
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
    console.error("Member sign-in link failed:", error.message);
    return {
      error: "Could not send the link just now. Please try again in a moment.",
      sent: null,
    };
  }

  return { error: null, sent: email };
}

export async function memberLogout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/membership");
}
