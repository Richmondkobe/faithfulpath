import Form from "next/form";
import { SEARCH_MAX_LENGTH } from "@/lib/article-search";

/**
 * The search box above the topics. A GET form to /articles/search, so it
 * works without JavaScript; with it, next/form navigates without a reload.
 */
export default function ArticleSearch({ q = "" }: { q?: string }) {
  return (
    <Form action="/articles/search" role="search" className="mt-8 flex max-w-xl gap-2">
      <label htmlFor="article-search" className="sr-only">
        Search articles
      </label>
      <input
        id="article-search"
        type="search"
        name="q"
        defaultValue={q}
        maxLength={SEARCH_MAX_LENGTH}
        placeholder="Search articles — a word or phrase"
        className="min-w-0 flex-1 rounded-xl border border-field bg-white px-4 py-3 text-[16px] text-ink placeholder:text-placeholder focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-navy px-5 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-night"
      >
        Search
      </button>
    </Form>
  );
}
