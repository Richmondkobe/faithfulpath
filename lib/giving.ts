// Giving: amounts and labels, safe to import from Client Components. The
// Stripe and database side is in lib/giving-server.ts.

/** Stripe metadata on every gift's Checkout Session, PaymentIntent and Subscription. */
export const GIFT_TYPE = "gift";

export const MONTHLY_AMOUNTS = [10, 25, 50] as const;
export const ONCE_AMOUNTS = [10, 25, 50, 100] as const;
export const DEFAULT_MONTHLY = 25;
export const DEFAULT_ONCE = 25;
export const MIN_GIFT = 5;
/** A ceiling against typing slips (an extra zero); a larger gift can be arranged by email. */
export const MAX_GIFT = 10_000;

export type GiftKind = "monthly" | "one_time";

export const GIFT_NOTE =
  "Faithful Path Community is not yet a registered charity, so gifts are not tax-deductible. Gifts are voluntary and do not purchase any product or service.";

/** "US$25" or "US$25.50". */
export function giftAmount(cents: number): string {
  const dollars = cents / 100;
  return `US$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
}

/**
 * A typed amount in dollars as whole cents, or null if it is not one we take:
 * "25", "25.5" and "$25.50" are fine; under US$5 or over US$10,000 is not.
 */
export function parseGiftAmount(raw: string): number | null {
  const t = raw.trim().replace(/^US\$|^\$/i, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const cents = Math.round(Number(t) * 100);
  return cents >= MIN_GIFT * 100 && cents <= MAX_GIFT * 100 ? cents : null;
}
