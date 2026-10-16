import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The site's share cards, drawn in its own look: navy deepening to night, a
 * thin gold rule, the title in Source Serif and a quiet line for the site.
 * Used for every article (app/articles/[slug]/opengraph-image.tsx) and for
 * the general card (scripts/render-share-card.mjs writes public/og-site.png),
 * so the two always match (website audit S9, 17 October 2026).
 *
 * The renderer reads only TTF, OTF or WOFF, so the fonts are single-weight
 * TTF copies of the site's families (fonts/og-*.ttf, from
 * scripts/fetch-fonts.mjs). No photographs and no member data.
 */

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

const NAVY = "#1f2d45";
const NIGHT = "#121b30";
const GOLD = "#d4a24c";
const GOLD_SOFT = "#e8c98a";
const SUN = "#f3e7c9";

async function fonts() {
  const dir = join(process.cwd(), "fonts");
  const [serif, sans] = await Promise.all([
    readFile(join(dir, "og-source-serif-4-600.ttf")),
    readFile(join(dir, "og-source-sans-3-600.ttf")),
  ]);
  return [
    { name: "Source Serif 4", data: serif, weight: 600 as const, style: "normal" as const },
    { name: "Source Sans 3", data: sans, weight: 600 as const, style: "normal" as const },
  ];
}

/** Long titles step down in size so they always fit in four lines or fewer. */
function titleSize(title: string): number {
  if (title.length <= 40) return 68;
  if (title.length <= 70) return 58;
  if (title.length <= 100) return 50;
  return 44;
}

export async function shareCard({
  kicker,
  title,
  footer = true,
}: {
  /** A small gold line above the title, e.g. the article's category. */
  kicker?: string;
  title: string;
  /** The site's name and address at the foot; off for the general card, whose title is the name. */
  footer?: boolean;
}): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          // The general card has no footer: its name sits in the middle, large.
          justifyContent: footer ? "space-between" : "center",
          padding: "84px 96px 72px",
          backgroundImage: `linear-gradient(180deg, ${NAVY} 0%, ${NIGHT} 100%)`,
          color: SUN,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {kicker ? (
            <div
              style={{
                fontFamily: "Source Sans 3",
                fontSize: 22,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: GOLD_SOFT,
                marginBottom: 26,
              }}
            >
              {kicker}
            </div>
          ) : null}
          <div style={{ width: 132, height: 3, background: GOLD, marginBottom: 34 }} />
          <div
            style={{
              fontFamily: "Source Serif 4",
              fontSize: footer ? titleSize(title) : 100,
              lineHeight: 1.18,
              maxWidth: footer ? 1000 : 760,
              color: SUN,
            }}
          >
            {title}
          </div>
        </div>
        {footer ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
            <div style={{ fontFamily: "Source Serif 4", fontSize: 30, color: SUN }}>Faithful Path Community</div>
            <div style={{ fontFamily: "Source Sans 3", fontSize: 22, letterSpacing: 2, color: GOLD_SOFT }}>
              faithfulpathcommunity.com
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: "Source Sans 3", fontSize: 28, letterSpacing: 3, color: GOLD_SOFT, marginTop: 44 }}>
            faithfulpathcommunity.com
          </div>
        )}
      </div>
    ),
    { ...SHARE_CARD_SIZE, fonts: await fonts() }
  );
}
