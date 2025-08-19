import React from "react";

export type HeroImageProps = {
  image_url?: string | null;
  heading?: string | null;
  subheading?: string | null;
};

export function HeroImage(props: HeroImageProps) {
  const { image_url, heading, subheading } = props;
  return (
    <section className="w-full">
      {image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image_url} alt={heading ?? "Hero"} className="w-full h-auto" />
      ) : (
        <div className="w-full aspect-[16/9] bg-gray-200" />
      )}
      <div className="p-4">
        <h1 className="text-2xl font-bold">{heading ?? "Hero Heading"}</h1>
        {subheading && <p className="text-gray-600">{subheading}</p>}
      </div>
    </section>
  );
}
