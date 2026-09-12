import Link from "next/link";
import { downloadHref, getDownload, getResource, resourceHref } from "@/lib/course";

/**
 * Sits above the collapsed deeper teaching on purpose: a member must never have
 * to open an optional section to find something the lesson requires.
 */
export default function ResourcesBox({
  courseSlug,
  slugs,
  downloads = [],
}: {
  courseSlug: string;
  slugs: string[];
  /** Ids of printable PDFs to list alongside the worksheets. */
  downloads?: string[];
}) {
  const resources = slugs
    .map((slug) => getResource(courseSlug, slug))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const files = downloads
    .map((id) => getDownload(courseSlug, id))
    .filter((d): d is NonNullable<typeof d> => d !== null);

  if (resources.length === 0 && files.length === 0) return null;

  return (
    <section className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F7F1E6] px-6 py-5">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Resources
      </h2>
      <ul className="mt-3 space-y-3">
        {resources.map((resource) => (
          <li key={resource.slug} className="flex flex-wrap items-baseline gap-x-4">
            <Link
              href={resourceHref(courseSlug, resource.slug)}
              className="text-[#2B2118] underline underline-offset-4 transition-colors hover:text-[#8B5E34]"
            >
              {resource.title}
            </Link>
            <Link
              href={`${resourceHref(courseSlug, resource.slug)}?print=1`}
              className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
            >
              Print
            </Link>
          </li>
        ))}
        {files.map((file) => (
          <li key={file.id} className="flex flex-wrap items-baseline gap-x-4">
            <span className="text-[#2B2118]">{file.title}</span>
            <a
              href={downloadHref(courseSlug, file.id)}
              className="text-sm text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
