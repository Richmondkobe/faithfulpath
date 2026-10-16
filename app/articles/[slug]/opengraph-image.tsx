import { getPublishedArticleBySlug } from "@/lib/articles-db";
import { getCategory } from "@/lib/categories";
import { SHARE_CARD_SIZE, shareCard } from "@/lib/share-card";

/**
 * Each article's own share card, drawn from its title and category (website
 * audit S9). Saved and refreshed with the article page.
 */
export const revalidate = 300;
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";
export const alt = "Faithful Path Community";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getPublishedArticleBySlug(slug);
  return shareCard({
    kicker: getCategory(a?.category)?.label,
    title: a?.title ?? "Faithful Path Community",
  });
}
