import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin, GUIDES_BUCKET } from "@/lib/supabase/admin";
import { getPurchaseByToken } from "@/lib/purchases";
import { getProductById } from "@/lib/products-db";
import { slugify } from "@/lib/products";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/download/[token]">
) {
  const { token } = await ctx.params;

  if (!UUID.test(token)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const purchase = await getPurchaseByToken(token);
  if (!purchase) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const product = await getProductById(purchase.product_id);
  if (!product?.pdf_path) {
    console.error(`Purchase ${purchase.id} has no PDF to deliver.`);
    return NextResponse.json(
      { error: "This guide is not available to download yet." },
      { status: 409 }
    );
  }

  // Short-lived signed URL: the 'guides' bucket stays private, so the raw
  // storage path is never guessable or shareable for long.
  const { data, error } = await supabaseAdmin.storage
    .from(GUIDES_BUCKET)
    .createSignedUrl(product.pdf_path, 60, {
      download: `${slugify(product.title) || "guide"}.pdf`,
    });

  if (error || !data?.signedUrl) {
    console.error("Could not sign download URL:", error);
    return NextResponse.json(
      { error: "Could not prepare the download." },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("purchases")
    .update({ download_count: purchase.download_count + 1 })
    .eq("id", purchase.id);

  return NextResponse.redirect(data.signedUrl, 302);
}
