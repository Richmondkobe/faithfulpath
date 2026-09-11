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
