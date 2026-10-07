import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/stripe";

/**
 * Email the six-digit sign-in code to an address, as the sign-in form does.
 *
 * Used by the membership thank-you page, which says "We have sent a six-digit
 * code to the email you paid with" (Richmond, 8 October 2026): the code goes
 * out as the page opens, for a payment Stripe has just confirmed. Returns
 * whether a code is on its way. Supabase allows one code a minute per address,
 * so a reload within the minute is told "too soon"; that still counts, as the
 * first code is on its way.
 */
export async function sendSignInCode(email: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/members`, shouldCreateUser: true },
  });
  if (!error) return true;
  if (error.status === 429 || /rate limit|only request this after|seconds/i.test(error.message)) return true;
  console.error("Thank-you page sign-in code failed:", error.message);
  return false;
}
