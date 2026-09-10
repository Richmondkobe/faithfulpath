"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import { slugify, type Product } from "@/lib/products";
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
      <div className="flex justify-between text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-sm bg-[#E5D9C7]">
        <div
          className="h-full bg-[#8B5E34] transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-sm border border-[#D9CDBA] bg-white px-4 py-3 text-sm text-[#2B2118] outline-none placeholder:text-[#A2968A] focus:border-[#8B5E34]";

const labelClass =
  "block text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]";

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
      {hint && <p className="mt-1 text-sm text-[#6B5F53]">{hint}</p>}
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
            className="mb-3 h-40 w-auto rounded-sm border border-[#E5D9C7]"
          />
        )}
        <input
          id="cover"
          name="cover"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-[#4A4038] file:mr-4 file:rounded-sm file:border-0 file:bg-[#F3EADC] file:px-4 file:py-2 file:text-sm file:text-[#5C5147]"
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
          className="block w-full text-sm text-[#4A4038] file:mr-4 file:rounded-sm file:border-0 file:bg-[#F3EADC] file:px-4 file:py-2 file:text-sm file:text-[#5C5147]"
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
          className="h-4 w-4 accent-[#8B5E34]"
        />
        <label htmlFor="published" className="text-sm text-[#4A4038]">
          Published — visible on /guides and available to buy
        </label>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-sm border border-[#E3C9C3] bg-[#FBF1EF] px-4 py-3 text-sm leading-relaxed text-[#8B3A2E]"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-6 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create guide"}
        </button>
        <Link
          href="/admin"
          className="text-sm text-[#5C5147] transition-colors hover:text-[#8B5E34]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
