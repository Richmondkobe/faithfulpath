/**
 * One <script type="application/ld+json"> tag.
 *
 * A component so every page emits the same shape, and so the JSON is stringified
 * in one place rather than at each call site.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
