"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import { slugify, type Product } from "@/lib/products";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  COVERS_BUCKET,
  GUIDES_BUCKET,
  storagePath,
  uploadWithProgress,
} from "@/lib/storage";

const initial: ProductFormState = { error: null };

type Progress = { cover?: number; pdf?: number };

function ProgressBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-xl bg-line">
        <div
          className="h-full bg-gold-text transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-field bg-white px-4 py-3 text-sm text-navy outline-none placeholder:text-placeholder focus:border-gold-text";

const labelClass =
  "block text-[11px] uppercase tracking-[0.18em] text-gold-text font-medium";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function ProductForm({
  product,
  coverUrl,
}: {
  product?: Product;
  coverUrl?: string | null;
}) {
  const [progress, setProgress] = useState<Progress>({});

  // The files go straight from the browser to Supabase Storage, and only the
  // resulting paths are sent to the server action. Sending the files themselves
  // put a whole PDF in the request body, which the platform rejected before the
  // action ran — the browser got a blank error page instead of anything useful.
  const [state, action, pending] = useActionState(
    async (
      prev: ProductFormState,
      formData: FormData
    ): Promise<ProductFormState> => {
      setProgress({});

      const cover = formData.get("cover");
      const pdf = formData.get("pdf");
      formData.delete("cover");
      formData.delete("pdf");

      const uploads: [key: keyof Progress, bucket: string, file: File][] = [];
      if (cover instanceof File && cover.size > 0) {
        uploads.push(["cover", COVERS_BUCKET, cover]);
      }
      if (pdf instanceof File && pdf.size > 0) {
        uploads.push(["pdf", GUIDES_BUCKET, pdf]);
      }

      if (uploads.length > 0) {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          return {
            error:
              "Your admin session has expired. Open the admin in a new tab, sign in, then try again — nothing has been saved.",
          };
        }

        const folder =
          slugify(
            String(formData.get("slug") ?? "") ||
              String(formData.get("title") ?? "")
          ) || "guide";

        for (const [key, bucket, file] of uploads) {
          setProgress((p) => ({ ...p, [key]: 0 }));
          try {
            const path = await uploadWithProgress({
              bucket,
              path: storagePath(folder, file.name),
              file,
              accessToken: session.access_token,
              onProgress: (percent) =>
                setProgress((p) => ({ ...p, [key]: percent })),
            });
            formData.set(`${key}_path`, path);
          } catch (err) {
            setProgress({});
            return {
              error:
                err instanceof Error
                  ? `Upload failed — ${err.message} Nothing has been saved.`
                  : "Upload failed. Nothing has been saved.",
            };
          }
        }
      }

      return saveProduct(prev, formData);
    },
    initial
  );

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  // Once the slug has been typed into by hand, stop overwriting it from title.
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));

  const pdfFileName = product?.pdf_path?.split("/").pop() ?? null;

  return (
    <form action={action} className="mt-10 max-w-2xl space-y-7">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Field label="Title" htmlFor="title">
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Slug" htmlFor="slug" hint={`faithfulpathcommunity.com/guides/${slug || "…"}`}>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          onBlur={(e) => setSlug(slugify(e.target.value))}
          className={inputClass}
        />
      </Field>

      <Field label="Subtitle" htmlFor="subtitle">
        <input
          id="subtitle"
          name="subtitle"
          defaultValue={product?.subtitle ?? ""}
          className={inputClass}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        hint="Markdown is allowed. Blank lines separate paragraphs."
      >
        <textarea
          id="description"
          name="description"
          rows={12}
          defaultValue={product?.description ?? ""}
          className={inputClass + " font-mono leading-relaxed"}
        />
      </Field>

      <Field label="Price (USD)" htmlFor="price">
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={
            product ? (product.price_cents / 100).toFixed(2) : ""
          }
          className={inputClass + " max-w-[12rem]"}
        />
      </Field>

      {/* The options come from lib/book-categories.ts, so the dropdown cannot
          offer a slug the database would reject — products_category_check
          allows exactly these four. Adding a category means editing that file
          and widening the constraint. */}
      <Field
        label="Category"
        htmlFor="category"
        hint="Where this book appears in the store. Left unset, it lists under “Other books”."
      >
        <select
          id="category"
          name="category"
          defaultValue={product?.category ?? ""}
          className={inputClass + " max-w-[22rem]"}
        >
          <option value="">No category</option>
          {BOOK_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Order within category"
        htmlFor="sort_order"
        hint="Lowest first. The Following Jesus series runs 1 to 5; books sharing a number fall back to newest first."
      >
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          step="1"
          defaultValue={product ? String(product.sort_order) : "0"}
          className={inputClass + " max-w-[12rem]"}
        />
      </Field>

      <Field
        label="Cover image"
        htmlFor="cover"
        hint={product?.cover_path ? "Choosing a file replaces the current cover." : undefined}
      >
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt="Current cover"
            className="mb-3 h-40 w-auto rounded-xl border border-line"
          />
        )}
        <input
          id="cover"
          name="cover"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-ink file:mr-4 file:rounded-xl file:border-0 file:bg-sand file:px-4 file:py-2 file:text-sm file:text-muted"
        />
        {progress.cover !== undefined && (
          <ProgressBar label="Uploading cover" percent={progress.cover} />
        )}
      </Field>

      <Field
        label="PDF"
        htmlFor="pdf"
        hint={
          pdfFileName
            ? `Current file: ${pdfFileName}. Choosing a file replaces it.`
            : undefined
        }
      >
        <input
          id="pdf"
          name="pdf"
          type="file"
          accept="application/pdf"
          className="block w-full text-sm text-ink file:mr-4 file:rounded-xl file:border-0 file:bg-sand file:px-4 file:py-2 file:text-sm file:text-muted"
        />
        {progress.pdf !== undefined && (
          <ProgressBar label="Uploading PDF" percent={progress.pdf} />
        )}
      </Field>

      <div className="flex items-center gap-3">
        <input
          id="published"
          name="published"
          type="checkbox"
          defaultChecked={product?.published ?? false}
          className="h-4 w-4 accent-gold-text"
        />
        <label htmlFor="published" className="text-sm text-ink">
          Published — visible on /guides and available to buy
        </label>
      </div>

      <div className="flex items-start gap-3">
        <input
          id="featured_on_start"
          name="featured_on_start"
          type="checkbox"
          defaultChecked={product?.featured_on_start ?? false}
          className="mt-0.5 h-4 w-4 accent-gold-text"
        />
        <label htmlFor="featured_on_start" className="text-sm text-ink">
          Featured on /start — the one book at the top of the Instagram link page. Ticking it here takes it off
          whichever book had it before.
        </label>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-danger-line bg-danger-bg px-4 py-3 text-sm leading-relaxed text-danger"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-6 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft disabled:opacity-60"
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create guide"}
        </button>
        <Link
          href="/admin"
          className="text-sm text-muted transition-colors hover:text-gold-text"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
