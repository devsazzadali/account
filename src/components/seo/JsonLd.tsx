// Reusable JSON-LD injector (server component — renders a plain
// <script type="application/ld+json"> into the SSR HTML).
// Accepts one schema object or an array of them.

export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default JsonLd;
