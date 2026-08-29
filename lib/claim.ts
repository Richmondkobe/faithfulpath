import { createHmac, timingSafeEqual } from "node:crypto";

// Claim keys are derived per guide from one secret rather than stored, so each
// guide has its own key with no table to maintain. A leaked key exposes that
// guide alone. Rotating GUIDE_CLAIM_SECRET invalidates every outstanding key at
// once — there is no way to revoke a single one, which is the trade for having
// no storage.

const KEY_LENGTH = 16;

export function claimKeyFor(slug: string): string | null {
  const secret = process.env.GUIDE_CLAIM_SECRET;
  if (!secret) return null;

  return createHmac("sha256", secret)
    .update(slug)
    .digest("hex")
    .slice(0, KEY_LENGTH);
}

export function verifyClaimKey(slug: string, key: string | undefined): boolean {
  const expected = claimKeyFor(slug);
  if (!expected || !key) return false;

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(key, "utf8");

  // timingSafeEqual throws on a length mismatch, so check that first. The
  // length of a claim key is not a secret.
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/** The full claim URL for a guide, for copying out of the admin. */
export function claimUrlFor(slug: string): string | null {
  const key = claimKeyFor(slug);
  if (!key) return null;

  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return `${origin}/guides/${slug}/claim?key=${key}`;
}
