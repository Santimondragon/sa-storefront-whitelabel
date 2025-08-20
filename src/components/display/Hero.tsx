import type { Hero } from "~/lib/schemas";
import { CTAButton } from "./CTA";

export function HeroSection({ data }: { data: Hero }) {
  return (
    <section className={`hero hero-${data.variant}`}>
      <div className="content">
        <h1>{data.title}</h1>
        {data.subtitle && <h2>{data.subtitle}</h2>}
        {data.description && <p>{data.description}</p>}
        {data.cta?.map((cta, i) => (
          <CTAButton key={i} data={cta} />
        ))}
      </div>
      {/* Variant-specific rendering */}
      {data.variant === "image" && data.image && (
        <img src={data.image} alt={data.title} />
      )}
      {data.variant.includes("carousel") && data.images && (
        <div className="carousel">
          {data.images.map((img, i) => (
            <img key={i} src={img} alt={`${data.title}-${i}`} />
          ))}
        </div>
      )}
    </section>
  );
}