import { AUTHOR } from "@/lib/types";
import { SITE } from "@/lib/site";

/**
 * JSON-LD for the public pages.
 *
 * One Organization and one WebSite exist for the whole site, emitted by the root
 * layout. Everything else refers to them by @id rather than repeating them —
 * that is what @id is for, and a second inline Organization would be a second
 * claim about the same body rather than extra detail about it.
 *
 * Absolute URLs throughout. A canonical may be relative because Next resolves
 * it against metadataBase, but JSON-LD is handed to a crawler verbatim.
 */
export const ORG_ID = `${SITE.url}/#organization`;
export const SITE_ID = `${SITE.url}/#website`;
export const PERSON_ID = `${SITE.url}/#richmond`;

export const abs = (path: string) =>
  path.startsWith("http") ? path : `${SITE.url}${path}`;

/** The five accounts the footer links to. */
const SOCIAL = [
  "https://www.facebook.com/faithfulpathcummunity",
  "https://www.instagram.com/faithfulpathcommunty/",
  "https://www.linkedin.com/in/richmondkobe/",
  "https://www.tiktok.com/@christianheritagehub",
  "https://www.youtube.com/@ChristianHeritageHub",
];

/** A reference to the Organization, for use as provider, publisher, worksFor. */
export const orgRef = { "@id": ORG_ID };

/**
 * Richmond, as author and as the subject of /about.
 *
 * `full: false` gives the reference-plus-name form that is enough for an
 * author field; /about emits the full Person once, under the same @id.
 *
 * No `logo` on the Organization: there is no logo file in public/ — only a
 * social card and a portrait — and claiming a portrait is the organisation's
 * logo would be wrong. Add one and it belongs here.
 */
export function organizationAndWebSite() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: SITE.name,
        url: SITE.url,
        email: "info@faithfulpathcommunity.com",
        sameAs: SOCIAL,
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        name: SITE.name,
        url: SITE.url,
        publisher: orgRef,
      },
    ],
  };
}

export function personRichmond() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: AUTHOR.name,
    jobTitle: "Pastor",
    description: AUTHOR.credential,
    url: abs("/about"),
    image: abs(AUTHOR.image),
    // The profiles that are his rather than the ministry's. The Lulu spotlight
    // is where the other thirteen books are, and /about names it.
    sameAs: [
      "https://www.linkedin.com/in/richmondkobe/",
      "https://www.youtube.com/@ChristianHeritageHub",
      "https://www.lulu.com/spotlight/toptierconsultant",
    ],
    worksFor: orgRef,
  };
}

/** The author field on a Book or an Article: the @id, plus a name to read. */
export const personRef = { "@id": PERSON_ID, "@type": "Person", name: AUTHOR.name };

/**
 * A breadcrumb trail. Positions are 1-based and the last item is the page
 * itself, which carries no `item` — a crawler already knows where it is.
 */
export function breadcrumbs(trail: { name: string; path?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      ...(step.path ? { item: abs(step.path) } : {}),
    })),
  };
}

/** Wraps one or more nodes as a document a page can emit in a single tag. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
