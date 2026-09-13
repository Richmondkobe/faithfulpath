import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive } from "@/lib/members";

/**
 * The gate for everything behind the membership, composed from the same checks
 * /members already makes. Nothing in the payment or login code changes.
 *
 * Signed out goes to /membership, exactly as /members does. Signed in without a
 * live subscription goes to /members, which explains the situation properly
 * rather than bouncing them to a sales page that looks like the payment failed.
 */
export async function requireActiveMember(): Promise<string> {
  const email = await getSessionEmail();
  if (!email) redirect("/membership");

  const member = await getMemberByEmail(email);
  if (!isActive(member)) redirect("/members");

  return email;
}

/**
 * The gate for the journal, which outlives the subscription: anything a member
 * wrote stays readable after they cancel. Any members row will do — active,
 * past_due or canceled — but there must be one, so this never opens to a
 * signed-in stranger who simply has an account.
 *
 * Writing is not covered by this. Every write still goes through
 * requireActiveMember, so a cancelled member can read and download but not edit.
 */
export async function requireMemberRow(): Promise<string> {
  const email = await getSessionEmail();
  if (!email) redirect("/membership");

  const member = await getMemberByEmail(email);
  if (!member) redirect("/members");

  return email;
}
