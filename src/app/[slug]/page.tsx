import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { HeroImage } from "~/components/sections/HeroImage";
import { ThreeColumnContent } from "~/components/sections/ThreeColumnContent";
import { ImageCarousel } from "~/components/sections/ImageCarousel";

function fieldsToObject(fields: Array<{ key: string; value: string | null }>) {
  const obj: Record<string, string | null> = {};
  for (const f of fields) obj[f.key] = f.value ?? null;
  return obj;
}

export default async function Page({
  params,
}: {
  // In newer Next.js versions, params can be a Promise and must be awaited
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolved = (await params) as { slug: string };
  const slug = resolved.slug;
  const page = await api.page.getBySlug({ slug });
  if (!page) return notFound();

  const fields = page.fields;
  const title = fields.find((f) => f.key === "title")?.value ?? null;
  // Shopify returns references as an object with a `nodes` array. Use that.
  const sections =
    fields.find((f) => f.key === "sections")?.references?.nodes ?? [];

  return (
    <main className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">{title ?? slug}</h1>
      {sections.map((section) => {
        const data = fieldsToObject(section.fields);
        switch (section.type) {
          case "hero_image":
            return (
              <HeroImage
                key={section.id}
                image_url={data.image_url}
                heading={data.heading}
                subheading={data.subheading}
              />
            );
          case "three_column_content":
            return (
              <ThreeColumnContent
                key={section.id}
                column1={data.column1}
                column2={data.column2}
                column3={data.column3}
              />
            );
          case "image_carousel": {
            const images = (data.images ?? "")
              ?.split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            return <ImageCarousel key={section.id} images={images ?? []} />;
          }
          default:
            return (
              <pre key={section.id} className="p-4 bg-gray-50 border rounded">
                Unknown section type: {section.type}
                {"\n"}
                {JSON.stringify(section, null, 2)}
              </pre>
            );
        }
      })}
    </main>
  );
}
