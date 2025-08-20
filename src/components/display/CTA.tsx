import type { CTA } from "~/lib/schemas";

export function CTAButton({ data }: { data: CTA }) {
  return (
    <a
      href={data.url}
      target={data.target === "blank" ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className={`btn btn-${data.variant}`}
    >
      {data.name}
    </a>
  );
}