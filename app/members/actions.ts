"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireActiveMember } from "@/lib/member-gate";
import {
  formatOpensOn,
  getQuestionAllowance,
  sendQuestionEmail,
  QUESTION_MAX,
} from "@/lib/questions";
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

/* ------------------------------------------------------- written questions */

export type MemberQuestionState = {
  error: string | null;
  sent: boolean;
};

/**
 * One written question, emailed on to Richmond.
 *
 * The monthly limit is re-checked here and not just in the page: a server
 * action is reachable by direct POST, so the form being hidden is not a
 * control. The row is written first and emailed second — a question that
 * reaches us but not the inbox can be chased from the table, whereas one that
 * was never saved is simply gone.
 *
 * The send itself runs in `after()`, once the response has gone. Resend can
 * take the better part of a minute, and the member has no reason to watch a
 * spinner for it: what they need to know — that the question is safely ours —
 * is true the moment the insert returns.
 */
export async function askMemberQuestion(
  _prev: MemberQuestionState,
  formData: FormData
): Promise<MemberQuestionState> {
  const question = String(formData.get("question") ?? "").trim();

  if (question.length < 10) {
    return { error: "Write a little more so Richmond can answer properly.", sent: false };
  }
  if (question.length > QUESTION_MAX) {
    return { error: `Please keep it under ${QUESTION_MAX} characters.`, sent: false };
  }

  // Asking is a membership benefit, so it closes when the membership does.
  const email = await requireActiveMember();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again.", sent: false };

  const allowance = await getQuestionAllowance();
  if (allowance.used) {
    return {
      error: `You have used this month's question; your next one opens on ${formatOpensOn(allowance.opensOn)}.`,
      sent: false,
    };
  }

  const askedAt = new Date();
  const { data: row, error } = await supabase
    .from("member_questions")
    .insert({ user_id: user.id, email, question })
    .select("id")
    .single();

  if (error) {
    console.error("Could not save member question:", error.message);
    return { error: "That could not be sent just now. Please try again.", sent: false };
  }

  after(async () => {
    const emailed = await sendQuestionEmail({ memberEmail: email, question, askedAt });
    if (!emailed) return;

    // Stamped with the service-role client rather than the member's: by now the
    // response has been sent, so there is no longer a cookie jar to refresh a
    // token into. This is bookkeeping — the question is safely stored either
    // way, and the column only tells a delivered one from a stuck one.
    const { error: stampError } = await supabaseAdmin
      .from("member_questions")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", row.id);
    if (stampError) {
      console.error("Question emailed but not stamped:", stampError.message);
    }
  });

  revalidatePath("/members");
  return { error: null, sent: true };
}
