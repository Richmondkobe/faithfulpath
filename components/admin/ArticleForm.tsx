"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveArticle, type ArticleFormState } from "@/app/admin/articles/actions";
import { slugify } from "@/lib/products";
import type { Article } from "@/lib/article";

const initial: ArticleFormState = { error: null };

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

export default function ArticleForm({ article }: { article?: Article }) {
  const [state, action, pending] = useActionState(saveArticle, initial);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  // Once the slug has been typed into by hand, stop overwriting it from title.
  const [slugTouched, setSlugTouched] = useState(Boolean(article?.slug));

  return (
    <form action={action} className="mt-10 max-w-2xl space-y-7">
      {article && <input type="hidden" name="id" value={article.id} />}

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

      <Field
        label="Slug"
        htmlFor="slug"
        hint={`faithfulpathcommunity.com/articles/${slug || "…"}`}
      >
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

      <Field
        label="Excerpt"
        htmlFor="excerpt"
        hint="The summary shown on the articles index."
      >
        <textarea
          id="excerpt"
          name="excerpt"
          rows={3}
          defaultValue={article?.excerpt ?? ""}
          className={inputClass + " leading-relaxed"}
        />
      </Field>

      <Field
        label="Body"
        htmlFor="body_md"
        hint="Markdown. Blank lines separate paragraphs; ## and ### for headings; - for bullets."
      >
        <textarea
          id="body_md"
          name="body_md"
          rows={28}
          required
          defaultValue={article?.body_md ?? ""}
          className={inputClass + " font-mono leading-relaxed"}
        />
      </Field>

      <Field
        label="Meta title"
        htmlFor="meta_title"
        hint="The <title> tag. Falls back to the article title when blank."
      >
        <input
          id="meta_title"
          name="meta_title"
          defaultValue={article?.meta_title ?? ""}
          className={inputClass}
        />
      </Field>

      <Field
        label="Meta description"
        htmlFor="meta_description"
        hint="Roughly 155 characters."
      >
        <textarea
          id="meta_description"
          name="meta_description"
          rows={3}
          defaultValue={article?.meta_description ?? ""}
          className={inputClass + " leading-relaxed"}
        />
      </Field>

      <div className="flex items-center gap-3">
        <input
          id="published"
          name="published"
          type="checkbox"
          defaultChecked={article?.published ?? false}
          className="h-4 w-4 accent-[#8B5E34]"
        />
        <label htmlFor="published" className="text-sm text-[#4A4038]">
          Published — visible on /articles
        </label>
      </div>

      {state.error && <p className="text-sm text-[#8B3A2E]">{state.error}</p>}

      <div className="flex items-center gap-6 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-sm bg-[#2B2118] px-7 py-4 text-[15px] font-medium text-[#FDFAF4] transition-colors hover:bg-[#8B5E34] disabled:opacity-60"
        >
          {pending ? "Saving…" : article ? "Save changes" : "Create article"}
        </button>
        <Link
          href="/admin/articles"
          className="text-sm text-[#5C5147] transition-colors hover:text-[#8B5E34]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
