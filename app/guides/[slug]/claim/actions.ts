"use server";

import { verifyClaimKey } from "@/lib/claim";
import { getPublishedProductBySlug } from "@/lib/products-db";
import { recordFreeClaim } from "@/lib/purchases";

export type ClaimState = {
  error: string | null;
  token: string | null;
};

export async function claimGuide(
  _prev: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const key = String(formData.get("key") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  // Re-checked here, not just on the page: Server Actions are reachable by
  // direct POST, so the page's guard is not the security boundary.
  if (!slug || !verifyClaimKey(slug, key)) {
    return { error: "This claim link is not valid.", token: null };
  }

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address.", token: null };
  }

  const product = await getPublishedProductBySlug(slug);
  if (!product) {
    return { error: "This guide is not available.", token: null };
  }

  if (!product.pdf_path) {
    return {
      error: "This guide has no file to download yet.",
      token: null,
    };
  }

  try {
    const purchase = await recordFreeClaim(product.id, email);
    return { error: null, token: purchase.download_token };
  } catch (err) {
    console.error("Claim failed:", err);
    return {
      error: "Something went wrong. Please try again.",
      token: null,
    };
  }
}
