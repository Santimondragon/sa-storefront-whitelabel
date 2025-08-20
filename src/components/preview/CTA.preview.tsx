import type { CTA } from "~/lib/schemas";

export function CTAPreview({ data }: { data: CTA }) {
  return (
    <button className={`btn-${data.variant}`}>
      {data.name} → {data.url}
    </button>
  );
}