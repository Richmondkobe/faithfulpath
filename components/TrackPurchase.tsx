"use client";

import { useEffect } from "react";
import { alreadyTracked, markTracked, withFbq } from "@/lib/fbq";

/**
 * Fires Purchase once for a completed order. The thank-you URL stays valid, so
 * it can be reloaded — the sessionStorage guard stops a refresh re-firing, and
 * the eventID lets Meta deduplicate if it is opened again in a later session.
 */
export default function TrackPurchase({
  purchaseId,
  value,
  currency,
}: {
  purchaseId: string;
  value: number;
  currency: string;
}) {
  useEffect(() => {
    const key = `fbq:purchase:${purchaseId}`;
    if (alreadyTracked(key)) return;

    return withFbq((fbq) => {
      fbq(
        "track",
        "Purchase",
        { value, currency },
        { eventID: `purchase-${purchaseId}` }
      );
      markTracked(key);
    });
  }, [purchaseId, value, currency]);

  return null;
}
