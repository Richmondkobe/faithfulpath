import { SITE } from "@/lib/site";
import { getProductById } from "@/lib/products-db";
import type { Purchase } from "@/lib/products";

/**
 * The email that delivers a bought book (Richmond, 29 October 2026). Until
 * then the only way to the PDF was the button on the thank-you page, and a
 * buyer who lost that page had nothing in their inbox.
 *
 * Sent once: recordPurchase calls this only from the call that saved the
 * purchase row, and the row's Stripe session id is unique, so the webhook and
 * the thank-you page can never both send it.
 */

const FROM = "Faithful Path Community <info@faithfulpathcommunity.com>";
const REPLY_TO = "info@faithfulpathcommunity.com";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function bookDeliveryEmail(title: string, downloadToken: string, email: string) {
  const download = `${SITE.url}/api/download/${downloadToken}`;
  const signIn = `${SITE.url}/members/login`;

  const subject = `Your book: ${title}`;
  const text = [
    "Thank you for your order.",
    "",
    `${title} is ready. Download the PDF here:`,
    download,
    "",
    "This link keeps working, so you can come back to it.",
    "",
    "You can also download it any time from Your books:",
    `1. Go to ${signIn}`,
    `2. Enter this email address: ${email}`,
    "3. Type the 6-digit code we email you (or open the link in that email).",
    "4. You will see Your books. Press Download the PDF.",
    "",
    "If anything does not work, just reply to this email.",
    "",
    "Grace and peace,",
    "Pastor Richmond Kobe",
    "Faithful Path Community",
  ].join("\n");

  const p = (s: string) => `<p style="margin:0 0 16px;line-height:1.6">${s}</p>`;
  const html =
    `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#2b3445;max-width:560px">` +
    p("Thank you for your order.") +
    p(`<strong>${escape(title)}</strong> is ready.`) +
    `<p style="margin:0 0 16px"><a href="${download}" style="display:inline-block;background:#c9a24a;color:#141a26;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:10px">Download the PDF</a></p>` +
    p("This link keeps working, so you can come back to it.") +
    p("You can also download it any time from <strong>Your books</strong>:") +
    `<ol style="margin:0 0 16px;padding-left:24px;line-height:1.6">` +
    `<li>Go to <a href="${signIn}" style="color:#5e4412">${signIn.replace("https://", "")}</a></li>` +
    `<li>Enter this email address: ${escape(email)}</li>` +
    `<li>Type the 6-digit code we email you (or open the link in that email).</li>` +
    `<li>You will see Your books. Press Download the PDF.</li>` +
    `</ol>` +
    p("If anything does not work, just reply to this email.") +
    `<p style="margin:0;line-height:1.6">Grace and peace,<br>Pastor Richmond Kobe<br>Faithful Path Community</p>` +
    `</div>`;

  return { subject, text, html };
}

/** Sends the delivery email for a newly saved purchase. Never throws: the sale is already recorded. */
export async function sendBookDelivery(purchase: Purchase): Promise<void> {
  const error = await deliver(purchase);
  if (error) console.error(`Book delivery email not sent for purchase ${purchase.id}: ${error}`);
}

async function deliver(purchase: Purchase): Promise<string | null> {
  if (!purchase.email) return "the purchase has no email address.";
  const key = process.env.RESEND_API_KEY;
  if (!key) return "RESEND_API_KEY is not set for this site.";
  try {
    const product = await getProductById(purchase.product_id);
    if (!product) return `product ${purchase.product_id} not found.`;
    const { subject, text, html } = bookDeliveryEmail(product.title, purchase.download_token, purchase.email);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to: [purchase.email], reply_to: REPLY_TO, subject, text, html }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return `Resend ${res.status}: ${body.message ?? "no detail"}`;
    }
    return null;
  } catch (err) {
    return `Resend did not answer: ${err instanceof Error ? err.message : "network error"}`;
  }
}
