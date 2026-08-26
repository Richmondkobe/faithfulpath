"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  supabaseAdmin,
  COVERS_BUCKET,
  GUIDES_BUCKET,
} from "@/lib/supabase/admin";
import { slugify } from "@/lib/products";

export type ProductFormState = { error: string | null };

function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const cleanBase = slugify(base) || "file";
  const cleanExt = ext.replace(/[^a-z0-9]/g, "");
  return cleanExt ? `${cleanBase}.${cleanExt}` : cleanBase;
}

async function uploadTo(
  bucket: string,
  slug: string,
  file: File
): Promise<string> {
  const path = `${slug}/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload to ${bucket} failed: ${error.message}`);
  }
  return path;
}

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  // Server Actions are reachable by direct POST, so authorise here as well as
  // in the admin layout.
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceInput = String(formData.get("price") ?? "").trim();
  const published = formData.get("published") === "on";

  if (!title) return { error: "Give the guide a title." };

  const slug = slugify(slugInput || title);
  if (!slug) return { error: "That title does not make a usable slug — set one by hand." };

  const price = Number(priceInput);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Enter the price as a number, like 12 or 12.50." };
  }
  const price_cents = Math.round(price * 100);

  const cover = formData.get("cover");
  const pdf = formData.get("pdf");

  const fields: Record<string, unknown> = {
    slug,
    title,
    subtitle: subtitle || null,
    description: description || null,
    price_cents,
    published,
  };

  try {
    if (cover instanceof File && cover.size > 0) {
      fields.cover_path = await uploadTo(COVERS_BUCKET, slug, cover);
    }
    if (pdf instanceof File && pdf.size > 0) {
      fields.pdf_path = await uploadTo(GUIDES_BUCKET, slug, pdf);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  if (published && !fields.pdf_path) {
    // Publishing without a file to deliver would take money for nothing.
    const existingPdf = id
      ? (
          await supabaseAdmin
            .from("products")
            .select("pdf_path")
            .eq("id", id)
            .maybeSingle()
        ).data?.pdf_path
      : null;

    if (!existingPdf) {
      return { error: "Upload the PDF before publishing this guide." };
    }
  }

  const { error } = id
    ? await supabaseAdmin.from("products").update(fields).eq("id", id)
    : await supabaseAdmin.from("products").insert(fields);

  if (error) {
    if (error.code === "23505") {
      return { error: `The slug "${slug}" is already in use.` };
    }
    return { error: `Could not save: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/guides");
  revalidatePath(`/guides/${slug}`);
  redirect("/admin");
}

export type DeleteState = { error: string | null };

export async function deleteProduct(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing product id." };

  const { data: product, error: loadError } = await supabaseAdmin
    .from("products")
    .select("id, slug, cover_path, pdf_path")
    .eq("id", id)
    .maybeSingle();

  if (loadError) return { error: `Could not load guide: ${loadError.message}` };
  if (!product) return { error: "That guide no longer exists." };

  // Purchases are the record of who paid for what — they must outlive the
  // product. A foreign key would block this anyway; this gives a usable message.
  const { count, error: countError } = await supabaseAdmin
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if (countError) {
    return { error: `Could not check purchases: ${countError.message}` };
  }

  if (count && count > 0) {
    return {
      error:
        `This guide has ${count} purchase${count === 1 ? "" : "s"} against it, ` +
        `so it cannot be deleted — those records have to be kept. ` +
        `Unpublish it instead to take it off the store.`,
    };
  }

  // Row first: if this fails, the files are still there and the guide still
  // works. Doing it the other way round could leave a live product with no PDF.
  const { error: deleteError } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { error: `Could not delete: ${deleteError.message}` };
  }

  const orphaned: string[] = [];

  if (product.cover_path) {
    const { error } = await supabaseAdmin.storage
      .from(COVERS_BUCKET)
      .remove([product.cover_path]);
    if (error) orphaned.push(`${COVERS_BUCKET}/${product.cover_path}`);
  }

  if (product.pdf_path) {
    const { error } = await supabaseAdmin.storage
      .from(GUIDES_BUCKET)
      .remove([product.pdf_path]);
    if (error) orphaned.push(`${GUIDES_BUCKET}/${product.pdf_path}`);
  }

  if (orphaned.length > 0) {
    // The row is gone, so the delete succeeded from the admin's point of view.
    // Log the leftovers rather than failing the whole operation.
    console.error("Deleted product but left files in storage:", orphaned);
  }

  revalidatePath("/admin");
  revalidatePath("/guides");
  revalidatePath(`/guides/${product.slug}`);
  redirect("/admin");
}
