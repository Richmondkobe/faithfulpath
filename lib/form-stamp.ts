import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A signed "this form was opened at" stamp, for the free community sign-up.
 *
 * The membership sign-in only sends codes to people who have paid
 * (lib/sign-in-gate.ts), because from 18 September 2026 a robot typed
 * strangers' addresses into it. Joining the community is open to anyone, so
 * that check cannot apply. These stand in for it: the stamp is put in the page
 * when it is opened, and a code is sent only if it comes back unaltered, at
 * least a few seconds and at most two hours later. A robot posting straight to
 * the form has no stamp; one that fills it instantly is too quick.
 *
 * Signed with a key derived from the service role key, so there is no new
 * secret to set up, and the service role key itself is never exposed.
 */

const MIN_MS = 3_000;
const MAX_MS = 2 * 60 * 60 * 1000;

function key(): Buffer {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set.");
  return createHmac("sha256", secret).update("faithfulpath community form stamp v1").digest();
}

const sign = (ts: string) => createHmac("sha256", key()).update(ts).digest("base64url");

export function makeFormStamp(now = Date.now()): string {
  const ts = String(now);
  return `${ts}.${sign(ts)}`;
}

/** Whether a stamp is genuine and the form was filled in at a human pace. */
export function checkFormStamp(stamp: string, now = Date.now()): boolean {
  const [ts, sig] = stamp.split(".");
  if (!ts || !sig || !/^\d{13}$/.test(ts)) return false;
  const expected = Buffer.from(sign(ts));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  const age = now - Number(ts);
  return age >= MIN_MS && age <= MAX_MS;
}
