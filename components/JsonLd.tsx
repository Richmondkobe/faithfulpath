/**
 * One <script type="application/ld+json"> tag.
 *
 * A component so every page emits the same shape, and so the JSON is stringified
 * in one place rather than at each call site. "<" is escaped so a title that
 * happens to contain "</script>" cannot end the tag early.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
