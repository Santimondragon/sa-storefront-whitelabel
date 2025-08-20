import type { Hero } from "~/lib/schemas";
import { CTAPreview } from "./CTA.preview";

export function HeroPreview({ data }: { data: Hero }) {
  return (
    <section className="border p-4 bg-gray-100">
      <h1>{data.title}</h1>
      {data.subtitle && <h2>{data.subtitle}</h2>}
      {data.description && <p>{data.description}</p>}
      {data.cta?.map((cta, i) => (
        <CTAPreview key={i} data={cta} />
      ))}
    </section>
  );
}